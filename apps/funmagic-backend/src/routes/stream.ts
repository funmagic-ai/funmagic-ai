import { OpenAPIHono } from '@hono/zod-openapi';
import { db, tasks, studioGenerations, studioProjects } from '@funmagic/database';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { redis, createRedisConnection, createLogger, getUserStreamKey } from '@funmagic/services';
import type { Redis } from 'ioredis';

const log = createLogger('Backend');

const ACTIVE_STATUSES = ['pending', 'queued', 'processing'];

// ─── Types ──────────────────────────────────────────────────────────

interface ActiveItems {
  tasks: { id: string }[];
  generationIds: string[];
}

interface StreamWriter {
  write: (data: string, streamId?: string) => void;
  isClosed: () => boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Fetch active tasks and generation IDs for a user */
async function getActiveItems(userId: string): Promise<ActiveItems> {
  const activeTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.userId, userId),
      inArray(tasks.status, ACTIVE_STATUSES),
      isNull(tasks.deletedAt),
    ),
    columns: { id: true },
  });

  const ownedProjects = await db.query.studioProjects.findMany({
    where: eq(studioProjects.adminId, userId),
    columns: { id: true },
  });

  let generationIds: string[] = [];
  if (ownedProjects.length > 0) {
    const activeGens = await db.query.studioGenerations.findMany({
      where: and(
        inArray(studioGenerations.projectId, ownedProjects.map(p => p.id)),
        inArray(studioGenerations.status, ACTIVE_STATUSES),
      ),
      columns: { id: true },
    });
    generationIds = activeGens.map(g => g.id);
  }

  return { tasks: activeTasks, generationIds };
}

/** Replay missed events from Redis Stream using XRANGE */
async function replayEvents(
  streamKey: string,
  lastEventId: string | null,
  writer: StreamWriter,
) {
  const rangeStart = lastEventId ? `(${lastEventId}` : '-';
  const existingEvents = await redis.xrange(streamKey, rangeStart, '+');

  if (existingEvents.length > 0) {
    log.debug(`[SSE] Replaying ${existingEvents.length} events`);
  }

  for (const [entryId, fields] of existingEvents) {
    if (writer.isClosed()) return;
    const dataIdx = fields.indexOf('data');
    if (dataIdx === -1 || dataIdx + 1 >= fields.length) continue;
    writer.write(fields[dataIdx + 1], entryId);
  }
}

/** Poll DB for terminal task/generation status as fallback */
function startDbPoll(
  activeItems: ActiveItems,
  writer: StreamWriter,
  onMaxDuration: () => void,
): ReturnType<typeof setInterval> {
  const sseMaxMs = parseInt(process.env.SSE_MAX_DURATION_MS!, 10);
  const startTime = Date.now();
  const sentTaskIds = new Set<string>();
  const sentGenIds = new Set<string>();

  return setInterval(async () => {
    if (writer.isClosed()) return;

    if (Date.now() - startTime > sseMaxMs) {
      onMaxDuration();
      return;
    }

    try {
      for (const { id: taskId } of activeItems.tasks) {
        if (writer.isClosed() || sentTaskIds.has(taskId)) continue;
        const current = await db.query.tasks.findFirst({
          where: eq(tasks.id, taskId),
          with: { payload: true },
        });
        if (current && (current.status === 'completed' || current.status === 'failed')) {
          sentTaskIds.add(taskId);
          writer.write(JSON.stringify({
            type: current.status,
            taskId,
            error: current.payload?.error,
            timestamp: new Date().toISOString(),
          }));
        }
      }

      for (const genId of activeItems.generationIds) {
        if (writer.isClosed() || sentGenIds.has(genId)) continue;
        const current = await db.query.studioGenerations.findFirst({
          where: eq(studioGenerations.id, genId),
        });
        if (current && (current.status === 'completed' || current.status === 'failed')) {
          sentGenIds.add(genId);
          writer.write(JSON.stringify({
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
}

/** XREAD BLOCK loop — reads new events from Redis Stream in real-time */
async function xreadLoop(
  blockingRedis: Redis,
  streamKey: string,
  startId: string,
  writer: StreamWriter,
) {
  let lastId = startId;

  while (!writer.isClosed()) {
    try {
      const result = await blockingRedis.xread(
        'BLOCK', '6000',
        'COUNT', '100',
        'STREAMS', streamKey, lastId,
      );

      if (writer.isClosed()) break;

      if (!result) {
        writer.write('{"type":"heartbeat"}');
        continue;
      }

      const entries = result[0]?.[1];
      if (!entries) continue;

      for (const [entryId, fields] of entries) {
        if (writer.isClosed()) break;
        const dataIdx = fields.indexOf('data');
        if (dataIdx === -1 || dataIdx + 1 >= fields.length) continue;
        writer.write(fields[dataIdx + 1], entryId);
        lastId = entryId;
      }
    } catch (err) {
      if (writer.isClosed()) break;
      log.error({ err }, '[SSE] XREAD error');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/** Wait for a Redis connection to become ready */
async function waitForReady(conn: Redis, timeoutMs = 5000): Promise<void> {
  if (conn.status === 'ready') return;
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const t = setTimeout(() => {
      if (!settled) { settled = true; reject(new Error('Redis connection timeout')); }
    }, timeoutMs);
    conn.once('ready', () => {
      if (!settled) { settled = true; clearTimeout(t); resolve(); }
    });
    conn.once('error', (err) => {
      if (!settled) { settled = true; clearTimeout(t); reject(err); }
    });
  });
}

// ─── Route ──────────────────────────────────────────────────────────

export const streamRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .get('/', async (c) => {
    const userId = c.get('user')?.id;
    if (!userId) return c.json({ error: 'Unauthorized' }, 401);

    const lastEventId = c.req.query('lastEventId') || null;
    const streamKey = getUserStreamKey(userId);
    const encoder = new TextEncoder();

    let streamCtrl: ReadableStreamDefaultController<Uint8Array>;
    let closed = false;
    let blockingRedis: ReturnType<typeof createRedisConnection> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const writer: StreamWriter = {
      write(data: string, streamId?: string) {
        if (closed) return;
        try {
          let payload = data;
          if (streamId) {
            try {
              const parsed = JSON.parse(data);
              parsed.streamId = streamId;
              payload = JSON.stringify(parsed);
            } catch { /* send as-is */ }
          }
          streamCtrl.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch { /* stream already closed */ }
      },
      isClosed: () => closed,
    };

    function closeAll() {
      if (closed) return;
      closed = true;
      log.debug(`[SSE] Closing user stream for: ${userId}`);
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (blockingRedis) { blockingRedis.disconnect(); blockingRedis = null; }
      c.req.raw.signal.removeEventListener('abort', onAbort);
      try { streamCtrl.close(); } catch { /* already closed */ }
    }

    const onAbort = () => closeAll();

    const readable = new ReadableStream<Uint8Array>({
      start(ctrl) { streamCtrl = ctrl; },
      cancel() {
        log.debug(`[SSE] Client disconnected: ${userId}`);
        closeAll();
      },
    });

    c.req.raw.signal.addEventListener('abort', onAbort);

    // Async pipeline
    (async () => {
      try {
        const activeItems = await getActiveItems(userId);

        writer.write(JSON.stringify({
          type: 'connected',
          activeTaskIds: activeItems.tasks.map(t => t.id),
          activeGenerationIds: activeItems.generationIds,
          timestamp: new Date().toISOString(),
        }));

        if (closed) return;

        // Replay missed events
        try {
          await replayEvents(streamKey, lastEventId, writer);
        } catch (e) {
          log.error({ err: e }, '[SSE] Failed to read Redis Stream for replay');
        }

        if (closed) return;

        // Create dedicated Redis connection for XREAD BLOCK
        blockingRedis = createRedisConnection();
        await waitForReady(blockingRedis);

        if (closed) return;

        // Determine XREAD start cursor
        let startId = '$';
        if (lastEventId) {
          startId = lastEventId;
        } else {
          const latest = await redis.xrevrange(streamKey, '+', '-', 'COUNT', '1');
          if (latest.length > 0) startId = latest[0][0];
        }

        // Start DB poll fallback
        pollTimer = startDbPoll(activeItems, writer, () => {
          log.warn(`[SSE] Max duration reached for user ${userId}, closing stream`);
          closeAll();
        });

        // Start XREAD loop
        await xreadLoop(blockingRedis, streamKey, startId, writer);
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
