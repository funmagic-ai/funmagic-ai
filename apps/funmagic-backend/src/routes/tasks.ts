import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, tasks, taskPayloads, tools, assets, credits, creditTransactions } from '@funmagic/database';
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm';
import {
  AppError, ERROR_CODES, type AssetVisibility,
  SUPPORTED_LOCALES, DEFAULT_LOCALE,
  type SupportedLocale, type TranslationsRecord, type ToolTypeTranslationContent,
  getLocalizedToolTypeContent,
} from '@funmagic/shared';
import { addAITaskJob } from '../lib/queue';
import { redis, createRedisConnection, createLogger, resolveAssetUrl } from '@funmagic/services';
import { CreateTaskSchema, TaskSchema, TaskDetailSchema, UserTasksListSchema, DeleteTaskSuccessSchema, ErrorSchema } from '../schemas';
import { notFound, badRequest, forbidden } from '../lib/errors';

const log = createLogger('Backend');

// Step config from tool.config
interface StepConfig {
  id: string;
  name: string;
  type: string;
  providerId?: string;
  providerModel?: string;
  cost?: number;
}

interface ToolConfig {
  steps: StepConfig[];
  [key: string]: unknown;
}

// ─── User task list & delete routes ──────────────────────────────

const listUserTasksRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tasks'],
  request: {
    query: z.object({
      category: z.string().optional(),
      limit: z.coerce.number().default(20),
      offset: z.coerce.number().default(0),
      locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserTasksListSchema } },
      description: 'List of user tasks',
    },
  },
});

const deleteUserTaskRoute = createRoute({
  method: 'delete',
  path: '/{taskId}',
  tags: ['Tasks'],
  request: {
    params: z.object({ taskId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DeleteTaskSuccessSchema } },
      description: 'Task deleted',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Task not found',
    },
  },
});

/** Extract the primary output asset ID from task payload output */
function extractOutputAssetId(toolSlug: string, currentStepId: string | null, output: Record<string, unknown> | null): string | null {
  if (!output) return null;
  // figme 3d-gen stores model in modelAssetId
  if (toolSlug === 'figme' && currentStepId === '3d-gen') {
    return (output.modelAssetId as string) ?? null;
  }
  return (output.assetId as string) ?? null;
}

const ACTIVE_STATUSES = ['pending', 'queued', 'processing'];

/** Compute effective status considering child tasks for multi-step workflows */
function getEffectiveStatus(parentStatus: string, childTasks: Array<{ status: string; deletedAt: Date | null }>, totalSteps: number): string {
  if (parentStatus !== 'completed') return parentStatus;
  // Parent completed — check if any active (non-deleted) child task is still running
  const activeChildren = childTasks.filter(ct => !ct.deletedAt);
  // Multi-step tool: parent completed but no child tasks created yet (user hasn't started next step)
  if (totalSteps > 1 && activeChildren.length === 0) return 'processing';
  if (activeChildren.length === 0) return parentStatus;
  if (activeChildren.some(ct => ACTIVE_STATUSES.includes(ct.status))) return 'processing';
  if (activeChildren.some(ct => ct.status === 'failed')) return 'failed';
  return parentStatus;
}

const createTaskRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Tasks'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateTaskSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: TaskSchema } },
      description: 'Task created',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Insufficient credits',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool not found',
    },
  },
});

const getTaskRoute = createRoute({
  method: 'get',
  path: '/{taskId}',
  tags: ['Tasks'],
  request: {
    params: z.object({ taskId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TaskDetailSchema } },
      description: 'Task details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Task not found',
    },
  },
});

const streamTaskRoute = createRoute({
  method: 'get',
  path: '/{taskId}/stream',
  tags: ['Tasks'],
  request: {
    params: z.object({ taskId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: 'SSE stream of task progress events',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Task not found',
    },
  },
});

// Progress event types
type ProgressEventType =
  | 'connected'
  | 'step_started'
  | 'progress'
  | 'step_completed'
  | 'completed'
  | 'failed';

interface ProgressEvent {
  type: ProgressEventType;
  stepId?: string;
  progress?: number;
  message?: string;
  output?: unknown;
  error?: string;
  timestamp: string;
}

/**
 * Calculate cost for a specific step from tool config
 */
function getStepCost(config: ToolConfig, stepId?: string): number {
  if (!config.steps || config.steps.length === 0) {
    return 0;
  }

  // If stepId provided, find that specific step's cost
  if (stepId) {
    const step = config.steps.find(s => s.id === stepId);
    return step?.cost ?? 0;
  }

  // Default to first step's cost
  return config.steps[0]?.cost ?? 0;
}

/**
 * Reserve credits for a task
 */
async function reserveCredits(userId: string, amount: number, taskId: string): Promise<{ success: boolean; error?: string }> {
  if (amount <= 0) {
    return { success: true };
  }

  // Get or create credit record
  let creditRecord = await db.query.credits.findFirst({
    where: eq(credits.userId, userId),
  });

  if (!creditRecord) {
    // Create credit record with 0 balance
    const [newRecord] = await db.insert(credits).values({
      userId,
      balance: 0,
      reservedBalance: 0,
    }).returning();
    creditRecord = newRecord;
  }

  const availableBalance = creditRecord.balance - (creditRecord.reservedBalance ?? 0);

  if (availableBalance < amount) {
    return {
      success: false,
      error: `Insufficient credits. Available: ${availableBalance}, Required: ${amount}`,
    };
  }

  // Reserve credits
  await db.update(credits)
    .set({
      reservedBalance: sql`${credits.reservedBalance} + ${amount}`,
    })
    .where(eq(credits.userId, userId));

  // Create transaction record
  await db.insert(creditTransactions).values({
    userId,
    type: 'reservation',
    amount: -amount,
    balanceAfter: creditRecord.balance - (creditRecord.reservedBalance ?? 0) - amount,
    description: `Reserved for task`,
    referenceType: 'task',
    referenceId: taskId,
    idempotencyKey: `reserve-${taskId}`,
  });

  return { success: true };
}

export const tasksRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  // ─── List user tasks ───────────────────────────────────────────
  .openapi(listUserTasksRoute, async (c) => {
    const user = c.get('user');
    if (!user?.id) {
      throw new AppError({ code: ERROR_CODES.AUTH_UNAUTHORIZED, message: 'Authentication required', statusCode: 401 });
    }
    const userId = user.id;
    const { category, limit, offset, locale } = c.req.valid('query');

    // 1. Fetch all tool types for dynamic category filtering
    const allToolTypes = await db.query.toolTypes.findMany();
    const toolTypeMap = new Map(allToolTypes.map(tt => [tt.id, tt]));

    // 2. Build base conditions
    const baseConditions = [
      eq(tasks.userId, userId),
      isNull(tasks.deletedAt),
      isNull(tasks.parentTaskId), // Only top-level tasks
    ];

    // 3. Fetch tasks with tool (including toolType) + payload + child tasks
    const userTasks = await db.query.tasks.findMany({
      where: and(...baseConditions),
      orderBy: desc(tasks.createdAt),
      with: {
        tool: { with: { toolType: true } },
        payload: true,
        childTasks: true,
      },
    });

    // 4. Compute per-tool-type counts
    const typeCountMap = new Map<string, number>();
    for (const t of userTasks) {
      const typeId = t.tool?.toolTypeId;
      if (typeId) {
        typeCountMap.set(typeId, (typeCountMap.get(typeId) ?? 0) + 1);
      }
    }

    // 5. Build categories array (only types that have tasks)
    const categories = allToolTypes
      .filter(tt => (typeCountMap.get(tt.id) ?? 0) > 0)
      .map(tt => {
        const localizedToolType = getLocalizedToolTypeContent(
          tt.translations as TranslationsRecord<ToolTypeTranslationContent>,
          locale as SupportedLocale,
        );
        return {
          id: tt.id,
          name: tt.name,
          title: localizedToolType.title,
          count: typeCountMap.get(tt.id) ?? 0,
        };
      });

    // 6. Filter by category (tool type name) if requested
    const matchedToolType = category
      ? allToolTypes.find(tt => tt.name === category)
      : null;
    const filtered = category && matchedToolType
      ? userTasks.filter(t => t.tool?.toolTypeId === matchedToolType.id)
      : userTasks;

    const total = filtered.length;

    // 7. Paginate
    const paginated = filtered.slice(offset, offset + limit);

    // 8. Batch-resolve thumbnail URLs
    const assetIdsToResolve = new Set<string>();
    for (const t of paginated) {
      const output = t.payload?.output as Record<string, unknown> | null;
      const input = t.payload?.input as Record<string, unknown> | null;
      const outputAssetId = extractOutputAssetId(t.tool?.slug ?? '', t.currentStepId, output);
      if (outputAssetId) assetIdsToResolve.add(outputAssetId);
      if (input?.sourceAssetId && typeof input.sourceAssetId === 'string') {
        assetIdsToResolve.add(input.sourceAssetId);
      }
      if (output?.assetId && typeof output.assetId === 'string') {
        assetIdsToResolve.add(output.assetId);
      }
    }

    const assetMap = new Map<string, { visibility: string; bucket: string; storageKey: string; userId: string; mimeType: string }>();
    if (assetIdsToResolve.size > 0) {
      const foundAssets = await db.query.assets.findMany({
        where: and(
          inArray(assets.id, [...assetIdsToResolve]),
          isNull(assets.deletedAt),
        ),
      });
      for (const a of foundAssets) {
        assetMap.set(a.id, a);
      }
    }

    // 9. Build response with thumbnails resolved in parallel
    const taskItems = await Promise.all(
      paginated.map(async (t) => {
        const output = t.payload?.output as Record<string, unknown> | null;
        const input = t.payload?.input as Record<string, unknown> | null;
        const toolSlug = t.tool?.slug ?? '';
        const toolTypeName = t.tool?.toolType?.name ?? '';
        const outputAssetId = extractOutputAssetId(toolSlug, t.currentStepId, output);

        // Thumbnail resolution: use output asset for image-type tools,
        // source image for non-image tools or non-completed tasks
        let thumbnailUrl: string | null = null;
        try {
          const isImageType = toolTypeName === 'image';
          if (t.status === 'completed' && isImageType && outputAssetId) {
            const asset = assetMap.get(outputAssetId);
            if (asset) {
              const result = await resolveAssetUrl(
                { visibility: asset.visibility as AssetVisibility, bucket: asset.bucket, storageKey: asset.storageKey, userId: asset.userId },
                userId,
              );
              thumbnailUrl = result.url;
            }
          } else if (input?.sourceAssetId && typeof input.sourceAssetId === 'string') {
            const source = assetMap.get(input.sourceAssetId);
            if (source) {
              const result = await resolveAssetUrl(
                { visibility: source.visibility as AssetVisibility, bucket: source.bucket, storageKey: source.storageKey, userId: source.userId },
                userId,
              );
              thumbnailUrl = result.url;
            }
          }
        } catch {
          // Silently ignore thumbnail resolution errors
        }

        const config = t.tool?.config as ToolConfig | null;
        const totalSteps = config?.steps?.length ?? 1;
        const effectiveStatus = getEffectiveStatus(t.status, t.childTasks ?? [], totalSteps);

        // Sum credits across parent + child tasks for per-task total
        const activeChildren = (t.childTasks ?? []).filter(ct => !ct.deletedAt);
        const totalCreditsCost = t.creditsCost + activeChildren.reduce((sum, ct) => sum + ct.creditsCost, 0);

        return {
          id: t.id,
          status: effectiveStatus,
          toolTypeName,
          toolSlug,
          toolTitle: t.tool?.title ?? '',
          thumbnailUrl,
          outputAssetId: effectiveStatus === 'completed' ? outputAssetId : null,
          creditsCost: totalCreditsCost,
          createdAt: t.createdAt.toISOString(),
          completedAt: t.completedAt?.toISOString() ?? null,
        };
      })
    );

    return c.json({
      tasks: taskItems,
      pagination: { total, limit, offset },
      totalCount: userTasks.length,
      categories,
    }, 200);
  })
  // ─── Delete user task ──────────────────────────────────────────
  .openapi(deleteUserTaskRoute, async (c) => {
    const user = c.get('user');
    if (!user?.id) {
      throw new AppError({ code: ERROR_CODES.AUTH_UNAUTHORIZED, message: 'Authentication required', statusCode: 401 });
    }
    const { taskId } = c.req.valid('param');

    const existing = await db.query.tasks.findFirst({
      where: and(eq(tasks.id, taskId), isNull(tasks.deletedAt)),
    });

    if (!existing) {
      throw notFound('Task');
    }

    // Verify ownership
    if (existing.userId !== user.id) {
      throw forbidden();
    }

    // Soft delete the task
    await db.update(tasks)
      .set({ deletedAt: new Date() })
      .where(eq(tasks.id, taskId));

    // Also soft delete child tasks
    await db.update(tasks)
      .set({ deletedAt: new Date() })
      .where(and(eq(tasks.parentTaskId, taskId), isNull(tasks.deletedAt)));

    return c.json({ success: true }, 200);
  })
  // ─── Create task ───────────────────────────────────────────────
  .openapi(createTaskRoute, async (c) => {
    const { toolSlug, stepId, parentTaskId, input } = c.req.valid('json');
    const user = c.get('user');

    if (!user?.id) {
      throw new AppError({ code: ERROR_CODES.AUTH_UNAUTHORIZED, message: 'Authentication required', statusCode: 401 });
    }

    const userId = user.id;

    // Get tool by slug
    const tool = await db.query.tools.findFirst({
      where: eq(tools.slug, toolSlug),
    });

    if (!tool) {
      throw notFound('Tool');
    }

    if (!tool.isActive) {
      throw badRequest(ERROR_CODES.TOOL_INACTIVE, 'Tool is not available');
    }

    // Calculate cost from tool config
    const config = tool.config as ToolConfig;
    const creditsCost = getStepCost(config, stepId);

    // Create task first to get taskId
    const [task] = await db.insert(tasks).values({
      userId,
      toolId: tool.id,
      status: 'pending',
      creditsCost,
      currentStepId: stepId || config.steps?.[0]?.id,
      parentTaskId,
    }).returning();

    // Reserve credits if cost > 0
    if (creditsCost > 0) {
      const reserveResult = await reserveCredits(userId, creditsCost, task.id);
      if (!reserveResult.success) {
        // Rollback task creation
        await db.delete(tasks).where(eq(tasks.id, task.id));
        throw badRequest(ERROR_CODES.CREDITS_INSUFFICIENT, reserveResult.error || 'Insufficient credits');
      }
    }

    // Create payload record
    await db.insert(taskPayloads).values({
      taskId: task.id,
      input: {
        ...input,
        parentTaskId,
      },
    });

    // Queue the job
    const jobIdSuffix = stepId ? `-${stepId}` : '';
    const bullmqJobId = `task-${task.id}${jobIdSuffix}`;

    await addAITaskJob({
      taskId: task.id,
      toolSlug,
      stepId,
      input,
      userId,
      parentTaskId,
      requestId: c.get('requestId' as never) as string | undefined,
    });

    // Store the BullMQ job ID in the tasks table
    await db.update(tasks).set({ bullmqJobId }).where(eq(tasks.id, task.id));

    return c.json({
      task: {
        id: task.id,
        status: task.status,
        creditsCost: task.creditsCost,
      }
    }, 201);
  })
  .openapi(getTaskRoute, async (c) => {
    const { taskId } = c.req.valid('param');

    // Fetch task with payload and tool relations
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        payload: true,
        tool: true,
      },
    });

    if (!task) {
      throw notFound('Task');
    }

    // Query child tasks
    const childTasks = await db.query.tasks.findMany({
      where: and(eq(tasks.parentTaskId, taskId), isNull(tasks.deletedAt)),
      with: { payload: true },
    });

    return c.json({
      task: {
        id: task.id,
        userId: task.userId,
        toolId: task.toolId,
        toolSlug: task.tool?.slug ?? '',
        parentTaskId: task.parentTaskId ?? null,
        status: task.status,
        currentStepId: task.currentStepId ?? null,
        creditsCost: task.creditsCost,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        payload: task.payload ? {
          id: task.payload.id,
          taskId: task.payload.taskId,
          input: task.payload.input,
          output: task.payload.output,
        } : null,
        childTasks: childTasks.map(ct => ({
          id: ct.id,
          status: ct.status,
          currentStepId: ct.currentStepId ?? null,
          creditsCost: ct.creditsCost,
          payload: ct.payload ? {
            id: ct.payload.id,
            taskId: ct.payload.taskId,
            input: ct.payload.input,
            output: ct.payload.output,
          } : null,
        })),
      },
    }, 200);
  })
  .openapi(streamTaskRoute, async (c) => {
    const { taskId } = c.req.valid('param');
    log.debug(`[SSE] Stream request for task: ${taskId}`);

    // Verify task exists
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      log.debug(`[SSE] Task not found: ${taskId}`);
      throw notFound('Task');
    }

    log.debug(`[SSE] Starting stream for task: ${taskId}, status: ${task.status}`);
    const channel = `task:${taskId}`;
    const streamKey = `stream:task:${taskId}`;
    const encoder = new TextEncoder();

    // --- Stream state ---
    let streamCtrl: ReadableStreamDefaultController<Uint8Array>;
    let closed = false;
    let subscriber: Awaited<ReturnType<typeof createRedisConnection>> | null = null;
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    /** Write an SSE event to the response stream */
    function writeEvent(data: string) {
      if (closed) return;
      try {
        streamCtrl.enqueue(encoder.encode(`data: ${data}\n\n`));
      } catch { /* stream already closed or errored */ }
    }

    /** Fully close the stream and clean up all resources */
    function closeAll() {
      if (closed) return;
      closed = true;
      log.debug(`[SSE] Closing stream for task: ${taskId}`);
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
      if (subscriber) {
        subscriber.unsubscribe(channel).catch(() => {});
        subscriber.quit().catch(() => {});
        subscriber = null;
      }
      c.req.raw.signal.removeEventListener('abort', onAbort);
      try { streamCtrl.close(); } catch { /* already closed */ }
    }

    /**
     * After writing a terminal event, clean up resources but DON'T close
     * the stream. Let the client drive the closure (via reader.cancel() /
     * abort). This avoids the ERR_INCOMPLETE_CHUNKED_ENCODING that occurs
     * when the server closes the stream before the client reads the last chunk.
     * A safety timeout ensures cleanup even if the client doesn't disconnect.
     */
    function onTerminalWritten() {
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (subscriber) {
        subscriber.unsubscribe(channel).catch(() => {});
        subscriber.quit().catch(() => {});
        subscriber = null;
      }
      if (!safetyTimer) {
        safetyTimer = setTimeout(closeAll, 30_000);
      }
    }

    // --- Build the raw ReadableStream (bypasses Hono's streamSSE / TransformStream) ---
    const readable = new ReadableStream<Uint8Array>({
      start(ctrl) {
        streamCtrl = ctrl;
      },
      cancel() {
        // Client disconnected (reader.cancel() / fetch abort)
        log.debug(`[SSE] Client disconnected: ${taskId}`);
        closeAll();
      },
    });

    // Also listen for request abort signal (backup cleanup path)
    const onAbort = () => closeAll();
    c.req.raw.signal.addEventListener('abort', onAbort);

    // --- Async pipeline (runs after Response is returned) ---
    // Guard: only send one terminal event (completed/failed) to the client.
    // Multiple sources (pub/sub, stream replay, poll) may detect the same terminal.
    let terminalSent = false;

    function sendTerminal(data: string) {
      if (terminalSent || closed) return;
      terminalSent = true;
      writeEvent(data);
      onTerminalWritten();
    }

    (async () => {
      try {
        // 1. Send connected event
        writeEvent(JSON.stringify({
          type: 'connected',
          taskId,
          status: task.status,
          timestamp: new Date().toISOString(),
        }));

        // 2. If task is already terminal, send final event.
        //    Don't include output — it can be massive (e.g. 13MB point cloud).
        //    Client fetches full output via REST GET /tasks/:taskId.
        if (task.status === 'completed' || task.status === 'failed') {
          const finalTask = task.status === 'failed'
            ? await db.query.tasks.findFirst({ where: eq(tasks.id, taskId), with: { payload: true } })
            : null;
          sendTerminal(JSON.stringify({
            type: task.status,
            error: finalTask?.payload?.error,
            timestamp: new Date().toISOString(),
          }));
          return;
        }

        // 3. Subscribe to pub/sub FIRST — this ensures no events are missed.
        //    Events published after subscribe are queued by the subscriber.
        //    Events published before subscribe are caught by the XRANGE below.
        try {
          subscriber = createRedisConnection();

          subscriber.on('error', (err) => {
            console.error(`[SSE] Redis subscriber error (task ${taskId}):`, err.message);
          });

          // 'close' fires on transient disconnects AND on explicit quit().
          // ioredis auto-reconnects on transient disconnects.
          // Don't close the SSE stream — poll fallback continues working.
          subscriber.on('close', () => {
            log.warn(`[SSE] Redis subscriber disconnected (task ${taskId})`);
          });

          // 'end' fires when ioredis gives up reconnecting or after quit().
          subscriber.on('end', () => {
            log.debug(`[SSE] Redis subscriber ended (task ${taskId})`);
            subscriber = null;
          });

          subscriber.on('reconnecting', () => {
            log.debug(`[SSE] Redis subscriber reconnecting (task ${taskId})`);
          });

          // Wait for initial connection
          await new Promise<void>((resolve, reject) => {
            if (subscriber!.status === 'ready') { resolve(); return; }
            let settled = false;
            const t = setTimeout(() => {
              if (!settled) { settled = true; reject(new Error('Redis connection timeout')); }
            }, 5000);
            subscriber!.once('ready', () => {
              if (!settled) { settled = true; clearTimeout(t); resolve(); }
            });
            subscriber!.once('error', (err) => {
              if (!settled) { settled = true; clearTimeout(t); reject(err); }
            });
          });

          if (closed) return;

          await subscriber.subscribe(channel);
          log.debug(`[SSE] Subscribed to ${channel}`);

          subscriber.on('message', (ch, message) => {
            if (ch !== channel || closed) return;
            try {
              const event = JSON.parse(message) as ProgressEvent;
              if (event.type === 'completed' || event.type === 'failed') {
                sendTerminal(JSON.stringify(event));
              } else {
                writeEvent(JSON.stringify(event));
              }
            } catch (e) {
              log.error({ err: e }, '[SSE] Message parse error');
            }
          });
        } catch (err) {
          log.error({ err }, '[SSE] Redis subscriber setup failed');
        }

        if (closed) return;

        // 4. Replay missed events from Redis Stream AFTER subscribing.
        //    This guarantees no gap: events before subscribe are in the stream,
        //    events after subscribe arrive via pub/sub.
        try {
          const existingEvents = await redis.xrange(streamKey, '-', '+');
          if (existingEvents.length > 0) {
            log.debug(`[SSE] Replaying ${existingEvents.length} events from stream`);
          }

          for (const [, fields] of existingEvents) {
            if (closed) return;
            const dataIdx = fields.indexOf('data');
            if (dataIdx === -1 || dataIdx + 1 >= fields.length) continue;
            const eventJson = fields[dataIdx + 1];
            try {
              const event = JSON.parse(eventJson) as ProgressEvent;
              if (event.type === 'completed' || event.type === 'failed') {
                sendTerminal(eventJson);
                return;
              }
              writeEvent(eventJson);
            } catch { /* skip unparseable */ }
          }
        } catch (e) {
          log.error({ err: e }, '[SSE] Failed to read Redis Stream');
        }

        if (closed) return;

        // 5. Heartbeat — fires every 6s (must be < Bun's idleTimeout to reset
        //    the TCP idle timer). Must be a `data:` event (not SSE comment) so
        //    that EventSource.onmessage fires and the client can reset its own
        //    heartbeat timeout. Minimal JSON to save bandwidth.
        heartbeatTimer = setInterval(() => {
          if (closed) return;
          writeEvent('{"type":"heartbeat"}');
        }, 6000);

        // 6. Poll DB as safety net (catches completion if pub/sub missed it)
        //    Max duration prevents indefinite polling when worker stalls.
        const SSE_MAX_DURATION_MS = parseInt(process.env.SSE_MAX_DURATION_MS!, 10);
        const sseStartTime = Date.now();
        pollTimer = setInterval(async () => {
          if (closed || terminalSent) return;

          // Safety net: close stream after max duration to prevent indefinite polling
          if (Date.now() - sseStartTime > SSE_MAX_DURATION_MS) {
            log.warn(`[SSE] Max duration reached for task ${taskId}, closing stream`);
            closeAll();
            return;
          }

          try {
            const current = await db.query.tasks.findFirst({
              where: eq(tasks.id, taskId),
              with: { payload: true },
            });
            if (closed || terminalSent) return;
            if (current && (current.status === 'completed' || current.status === 'failed')) {
              sendTerminal(JSON.stringify({
                type: current.status,
                // Don't include output — client fetches via REST
                error: current.payload?.error,
                timestamp: new Date().toISOString(),
              }));
            }
          } catch { /* retry next cycle */ }
        }, 3000);
      } catch (err) {
        log.error({ err }, '[SSE] Fatal setup error');
        closeAll();
      }
    })().catch((err) => {
      log.error({ err }, '[SSE] Unhandled error in stream pipeline');
      closeAll();
    });

    // Return the raw SSE response immediately.
    // Data is pushed asynchronously via streamCtrl.enqueue().
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
