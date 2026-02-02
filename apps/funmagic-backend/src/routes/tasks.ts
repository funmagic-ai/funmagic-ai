import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, tasks, taskPayloads, tools, credits, creditTransactions } from '@funmagic/database';
import { eq, sql } from 'drizzle-orm';
import { streamSSE } from 'hono/streaming';
import { addAITaskJob } from '../lib/queue';
import { redis } from '@funmagic/services';
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

    // Create a new Redis subscriber connection for this SSE stream
    const subscriber = redis.duplicate();
    const channel = `task:${taskId}`;

    return streamSSE(c, async (stream) => {
      let isCompleted = false;

      // Send initial connected event
      await stream.writeSSE({
        event: 'connected',
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
          event: task.status,
          data: JSON.stringify({
            type: task.status,
            output: finalTask?.payload?.output,
            error: finalTask?.payload?.error,
            timestamp: new Date().toISOString(),
          } as ProgressEvent),
        });

        subscriber.disconnect();
        return;
      }

      // Subscribe to task progress channel
      await subscriber.subscribe(channel);

      // Handle incoming messages
      subscriber.on('message', async (ch, message) => {
        if (ch !== channel || isCompleted) return;

        try {
          const event = JSON.parse(message) as ProgressEvent;

          await stream.writeSSE({
            event: event.type,
            data: JSON.stringify(event),
          });

          // Close stream on completion or failure
          if (event.type === 'completed' || event.type === 'failed') {
            isCompleted = true;
            await subscriber.unsubscribe(channel);
            subscriber.disconnect();
          }
        } catch (e) {
          console.error('Failed to parse progress event:', e);
        }
      });

      // Keep connection alive with heartbeat
      const heartbeatInterval = setInterval(async () => {
        if (isCompleted) {
          clearInterval(heartbeatInterval);
          return;
        }

        try {
          await stream.writeSSE({
            event: 'heartbeat',
            data: JSON.stringify({ timestamp: new Date().toISOString() }),
          });
        } catch {
          // Stream closed
          clearInterval(heartbeatInterval);
          isCompleted = true;
          subscriber.disconnect();
        }
      }, 15000);

      // Handle stream abort
      stream.onAbort(() => {
        isCompleted = true;
        clearInterval(heartbeatInterval);
        subscriber.unsubscribe(channel);
        subscriber.disconnect();
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
          isCompleted = true;
          clearInterval(pollInterval);

          await stream.writeSSE({
            event: currentTask.status,
            data: JSON.stringify({
              type: currentTask.status,
              output: currentTask.payload?.output,
              error: currentTask.payload?.error,
              timestamp: new Date().toISOString(),
            } as ProgressEvent),
          });

          subscriber.disconnect();
        }
      }, 5000);

      // Cleanup on stream close
      stream.onAbort(() => {
        clearInterval(pollInterval);
      });
    });
  });
