import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, tasks, taskPayloads, tools, credits, creditTransactions } from '@funmagic/database';
import { eq, sql } from 'drizzle-orm';
import { streamSSE } from 'hono/streaming';
import { addAITaskJob } from '../lib/queue';
import { redis, createRedisConnection } from '@funmagic/services';
import { CreateTaskSchema, TaskSchema, TaskDetailSchema, ErrorSchema } from '../schemas';

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
  .openapi(createTaskRoute, async (c) => {
    const { toolSlug, stepId, parentTaskId, input } = c.req.valid('json');
    const user = c.get('user');

    if (!user?.id) {
      return c.json({ error: 'Authentication required' }, 401 as any);
    }

    const userId = user.id;

    // Get tool by slug
    const tool = await db.query.tools.findFirst({
      where: eq(tools.slug, toolSlug),
    });

    if (!tool) {
      return c.json({ error: 'Tool not found' }, 404);
    }

    if (!tool.isActive) {
      return c.json({ error: 'Tool is not available' }, 400);
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
        return c.json({ error: reserveResult.error || 'Insufficient credits' }, 400);
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
    await addAITaskJob({
      taskId: task.id,
      toolSlug,
      stepId,
      input,
      userId,
      parentTaskId,
    });

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

    // Fetch task with payload using relation
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        payload: true,
      },
    });

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    return c.json({
      task: {
        id: task.id,
        userId: task.userId,
        toolId: task.toolId,
        status: task.status,
        creditsCost: task.creditsCost,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        payload: task.payload ? {
          id: task.payload.id,
          taskId: task.payload.taskId,
          input: task.payload.input,
          output: task.payload.output,
        } : null,
      },
    }, 200);
  })
  .openapi(streamTaskRoute, async (c) => {
    const { taskId } = c.req.valid('param');

    // Verify task exists
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const channel = `task:${taskId}`;

    return streamSSE(c, async (stream) => {
      let isCompleted = false;
      let subscriber: Awaited<ReturnType<typeof createRedisConnection>> | null = null;
      let resolveStreamEnd: () => void;
      const streamEndPromise = new Promise<void>((resolve) => {
        resolveStreamEnd = resolve;
      });

      const closeStream = () => {
        if (!isCompleted) {
          isCompleted = true;
          try {
            subscriber?.disconnect();
          } catch {
            // Ignore disconnect errors
          }
          resolveStreamEnd();
        }
      };

      // Send initial connected event
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'connected',
          taskId,
          status: task.status,
          timestamp: new Date().toISOString(),
        } as ProgressEvent),
      });

      // If task is already completed or failed, send final event and close
      if (task.status === 'completed' || task.status === 'failed') {
        const finalTask = await db.query.tasks.findFirst({
          where: eq(tasks.id, taskId),
          with: { payload: true },
        });

        await stream.writeSSE({
          data: JSON.stringify({
            type: task.status,
            output: finalTask?.payload?.output,
            error: finalTask?.payload?.error,
            timestamp: new Date().toISOString(),
          } as ProgressEvent),
        });

        closeStream();
        await streamEndPromise;
        return;
      }

      // --- REPLAY MISSED EVENTS FROM REDIS STREAM ---
      // This fixes the race condition where worker publishes before SSE connects
      const streamKey = `stream:task:${taskId}`;

      try {
        const existingEvents = await redis.xrange(streamKey, '-', '+');
        console.log(`[SSE] Found ${existingEvents.length} events in stream ${streamKey}`);

        for (const [_id, fields] of existingEvents) {
          try {
            // Fields are returned as [key, value, key, value, ...]
            // We stored as 'data', eventJson
            const dataIndex = fields.indexOf('data');
            if (dataIndex === -1 || dataIndex + 1 >= fields.length) {
              continue;
            }
            const eventJson = fields[dataIndex + 1];
            const event = JSON.parse(eventJson) as ProgressEvent;

            await stream.writeSSE({
              data: eventJson,
            });

            console.log(`[SSE] Replayed event from stream: ${event.type}`);

            // If we replayed a terminal event, close immediately
            if (event.type === 'completed' || event.type === 'failed') {
              closeStream();
              await streamEndPromise;
              return;
            }
          } catch (e) {
            console.error('[SSE] Failed to parse stream event:', e);
          }
        }
      } catch (e) {
        console.error('[SSE] Failed to read from stream:', e);
      }

      // --- SUBSCRIBE TO PUB/SUB FOR REAL-TIME EVENTS ---
      try {
        // Create Redis subscriber connection and wait for it to be ready
        subscriber = createRedisConnection();

        // Set up error handlers before subscribing
        subscriber.on('error', (err) => {
          console.error('[SSE] Redis subscriber error:', err.message);
          closeStream();
        });

        subscriber.on('close', () => {
          if (!isCompleted) {
            console.log('[SSE] Redis subscriber connection closed unexpectedly');
          }
        });

        // Wait for connection to be ready
        await new Promise<void>((resolve, reject) => {
          if (subscriber!.status === 'ready') {
            resolve();
            return;
          }
          subscriber!.once('ready', () => resolve());
          subscriber!.once('error', (err) => reject(err));
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
        });

        await subscriber.subscribe(channel);
        console.log(`[SSE] Subscribed to channel: ${channel}`);

        // Handle incoming messages (only set up if subscription succeeded)
        subscriber.on('message', async (ch, message) => {
          if (ch !== channel || isCompleted) return;

          try {
            const event = JSON.parse(message) as ProgressEvent;

            await stream.writeSSE({
              data: JSON.stringify(event),
            });

            // Close stream on completion or failure
            if (event.type === 'completed' || event.type === 'failed') {
              try {
                await subscriber?.unsubscribe(channel);
              } catch {
                // Ignore unsubscribe errors
              }
              closeStream();
            }
          } catch (e) {
            // Only log if it's not a connection closed error
            if (e instanceof Error && !e.message.includes('Connection is closed')) {
              console.error('Failed to parse progress event:', e);
            }
          }
        });
      } catch (err) {
        console.error('[SSE] Failed to create Redis subscriber:', err);
        // Continue without pub/sub - polling will still work as fallback
      }

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(async () => {
        if (isCompleted) {
          clearInterval(heartbeatInterval);
          return;
        }

        try {
          await stream.writeSSE({
            data: JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }),
          });
        } catch {
          // Stream closed
          clearInterval(heartbeatInterval);
          closeStream();
        }
      }, 15000);

      // Handle stream abort
      stream.onAbort(() => {
        clearInterval(heartbeatInterval);
        try {
          subscriber?.unsubscribe(channel);
        } catch {
          // Ignore unsubscribe errors
        }
        closeStream();
      });

      // Poll for task completion as fallback
      const pollInterval = setInterval(async () => {
        if (isCompleted) {
          clearInterval(pollInterval);
          return;
        }

        const currentTask = await db.query.tasks.findFirst({
          where: eq(tasks.id, taskId),
          with: { payload: true },
        });

        if (currentTask && (currentTask.status === 'completed' || currentTask.status === 'failed')) {
          clearInterval(pollInterval);

          try {
            await stream.writeSSE({
              data: JSON.stringify({
                type: currentTask.status,
                output: currentTask.payload?.output,
                error: currentTask.payload?.error,
                timestamp: new Date().toISOString(),
              } as ProgressEvent),
            });
          } catch {
            // Stream already closed
          }

          closeStream();
        }
      }, 5000);

      // Cleanup on stream close
      stream.onAbort(() => {
        clearInterval(pollInterval);
      });

      // Keep the stream alive until closeStream() is called
      await streamEndPromise;
    });
  });
