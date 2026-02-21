import { OpenAPIHono } from '@hono/zod-openapi';
import { db, tasks, studioGenerations, studioProjects } from '@funmagic/database';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { redis, createRedisConnection, createLogger, getUserStreamKey } from '@funmagic/services';

const log = createLogger('Backend');

const ACTIVE_STATUSES = ['pending', 'queued', 'processing'];

/**
 * User-level SSE endpoint.
 *
 * One connection per user per browser tab. All task progress and studio
 * generation events flow through the single per-user Redis Stream
 * (`stream:user:{userId}`).
 *
 * Real-time delivery: XREAD BLOCK on the user stream.
 * Reconnect replay: client sends `lastEventId` query param → XRANGE.
 * DB poll fallback: every 3s checks for terminal task/generation status.
 */
export const streamRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .get('/', async (c) => {
    const user = c.get('user');
    const userId = user?.id;
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const lastEventId = c.req.query('lastEventId') || null;
    const streamKey = getUserStreamKey(userId);
    const encoder = new TextEncoder();

    // --- Stream state ---
    let streamCtrl: ReadableStreamDefaultController<Uint8Array>;
    let closed = false;
    let blockingRedis: ReturnType<typeof createRedisConnection> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    /** Write an SSE event to the response stream */
    function writeEvent(data: string, streamId?: string) {
      if (closed) return;
      try {
        // Include streamId so client can track last received event
        let payload = data;
        if (streamId) {
          try {
            const parsed = JSON.parse(data);
            parsed.streamId = streamId;
            payload = JSON.stringify(parsed);
          } catch {
            // If data isn't valid JSON, send as-is
          }
        }
        streamCtrl.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } catch { /* stream already closed or errored */ }
    }

    /** Fully close the stream and clean up all resources */
    function closeAll() {
      if (closed) return;
      closed = true;
      log.debug(`[SSE] Closing user stream for: ${userId}`);
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (blockingRedis) {
        blockingRedis.disconnect();
        blockingRedis = null;
      }
      c.req.raw.signal.removeEventListener('abort', onAbort);
      try { streamCtrl.close(); } catch { /* already closed */ }
    }

    const onAbort = () => closeAll();

    // --- Build the raw ReadableStream ---
    const readable = new ReadableStream<Uint8Array>({
      start(ctrl) {
        streamCtrl = ctrl;
      },
      cancel() {
        log.debug(`[SSE] Client disconnected: ${userId}`);
        closeAll();
      },
    });

    c.req.raw.signal.addEventListener('abort', onAbort);

    // --- Async pipeline ---
    (async () => {
      try {
        // 1. Gather active task IDs for connected event
        const activeTasks = await db.query.tasks.findMany({
          where: and(
            eq(tasks.userId, userId),
            inArray(tasks.status, ACTIVE_STATUSES),
            isNull(tasks.deletedAt),
          ),
          columns: { id: true },
        });

        // Gather active generation IDs owned by this user (admin studio)
        const ownedProjects = await db.query.studioProjects.findMany({
          where: eq(studioProjects.adminId, userId),
          columns: { id: true },
        });
        const ownedProjectIds = ownedProjects.map(p => p.id);

        let activeGenerationIds: string[] = [];
        if (ownedProjectIds.length > 0) {
          const activeGens = await db.query.studioGenerations.findMany({
            where: and(
              inArray(studioGenerations.projectId, ownedProjectIds),
              inArray(studioGenerations.status, ACTIVE_STATUSES),
            ),
            columns: { id: true },
          });
          activeGenerationIds = activeGens.map(g => g.id);
        }

        // 2. Send connected event
        writeEvent(JSON.stringify({
          type: 'connected',
          activeTaskIds: activeTasks.map(t => t.id),
          activeGenerationIds,
          timestamp: new Date().toISOString(),
        }));

        if (closed) return;

        // 3. Replay from stream
        try {
          const rangeStart = lastEventId ? `(${lastEventId}` : '-';
          const existingEvents = await redis.xrange(streamKey, rangeStart, '+');
          if (existingEvents.length > 0) {
            log.debug(`[SSE] Replaying ${existingEvents.length} events for user ${userId}`);
          }

          for (const [entryId, fields] of existingEvents) {
            if (closed) return;
            const dataIdx = fields.indexOf('data');
            if (dataIdx === -1 || dataIdx + 1 >= fields.length) continue;
            const eventJson = fields[dataIdx + 1];
            writeEvent(eventJson, entryId);
          }
        } catch (e) {
          log.error({ err: e }, '[SSE] Failed to read Redis Stream for replay');
        }

        if (closed) return;

        // 4. Create dedicated Redis connection for XREAD BLOCK
        blockingRedis = createRedisConnection();

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          if (blockingRedis!.status === 'ready') { resolve(); return; }
          let settled = false;
          const t = setTimeout(() => {
            if (!settled) { settled = true; reject(new Error('Redis connection timeout')); }
          }, 5000);
          blockingRedis!.once('ready', () => {
            if (!settled) { settled = true; clearTimeout(t); resolve(); }
          });
          blockingRedis!.once('error', (err) => {
            if (!settled) { settled = true; clearTimeout(t); reject(err); }
          });
        });

        if (closed) return;

        // Track last seen stream ID for XREAD cursor
        let lastId = '$'; // Start from now (replay already handled above)

        // If we replayed events, start from the last replayed ID
        if (lastEventId) {
          lastId = lastEventId;
        } else {
          // Get latest stream entry ID so XREAD doesn't re-deliver replayed events
          const latest = await redis.xrevrange(streamKey, '+', '-', 'COUNT', '1');
          if (latest.length > 0) {
            lastId = latest[0][0];
          }
        }

        // 5. DB poll fallback (every 3s) — catches terminal status if stream missed it
        const SSE_MAX_DURATION_MS = parseInt(process.env.SSE_MAX_DURATION_MS!, 10) || 600_000;
        const sseStartTime = Date.now();
        // Track task IDs already seen as terminal to avoid duplicate DB polls
        const terminalSentTaskIds = new Set<string>();
        const terminalSentGenIds = new Set<string>();

        pollTimer = setInterval(async () => {
          if (closed) return;

          if (Date.now() - sseStartTime > SSE_MAX_DURATION_MS) {
            log.warn(`[SSE] Max duration reached for user ${userId}, closing stream`);
            closeAll();
            return;
          }

          try {
            // Check active tasks for terminal status
            for (const { id: taskId } of activeTasks) {
              if (closed || terminalSentTaskIds.has(taskId)) continue;
              const current = await db.query.tasks.findFirst({
                where: eq(tasks.id, taskId),
                with: { payload: true },
              });
              if (current && (current.status === 'completed' || current.status === 'failed')) {
                terminalSentTaskIds.add(taskId);
                writeEvent(JSON.stringify({
                  type: current.status,
                  taskId,
                  error: current.payload?.error,
                  timestamp: new Date().toISOString(),
                }));
              }
            }

            // Check active generations for terminal status
            for (const genId of activeGenerationIds) {
              if (closed || terminalSentGenIds.has(genId)) continue;
              const current = await db.query.studioGenerations.findFirst({
                where: eq(studioGenerations.id, genId),
              });
              if (current && (current.status === 'completed' || current.status === 'failed')) {
                terminalSentGenIds.add(genId);
                writeEvent(JSON.stringify({
                  type: current.status === 'completed' ? 'complete' : 'error',
                  messageId: genId,
                  images: current.images,
                  content: current.content,
                  error: current.error,
                  timestamp: new Date().toISOString(),
                }));
              }
            }
          } catch { /* retry next cycle */ }
        }, 3000);

        // 6. XREAD BLOCK loop
        while (!closed) {
          try {
            const result = await blockingRedis!.xread(
              'BLOCK', '6000',
              'COUNT', '100',
              'STREAMS', streamKey, lastId
            );

            if (closed) break;

            if (!result) {
              // Timeout — send heartbeat
              writeEvent('{"type":"heartbeat"}');
              continue;
            }

            // result is [[streamName, entries]]
            const entries = result[0]?.[1];
            if (!entries) continue;

            for (const [entryId, fields] of entries) {
              if (closed) break;
              const dataIdx = fields.indexOf('data');
              if (dataIdx === -1 || dataIdx + 1 >= fields.length) continue;
              const eventJson = fields[dataIdx + 1];
              writeEvent(eventJson, entryId);
              lastId = entryId;
            }
          } catch (err) {
            if (closed) break;
            log.error({ err }, '[SSE] XREAD error');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (err) {
        log.error({ err }, '[SSE] Fatal setup error in user stream');
        closeAll();
      }
    })().catch((err) => {
      log.error({ err }, '[SSE] Unhandled error in user stream pipeline');
      closeAll();
    });

    return new Response(readable, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      }),
    }) as any;
  });
