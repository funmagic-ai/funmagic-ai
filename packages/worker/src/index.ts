import 'dotenv/config';

// Validate required env vars before importing anything else
const WORKER_REQUIRED_ENV = [
  'DATABASE_URL',
  'REDIS_URL',
  'SECRET_KEY',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET_PUBLIC',
  'S3_BUCKET_PRIVATE',
  'S3_BUCKET_ADMIN',
];
const missingEnv = WORKER_REQUIRED_ENV.filter((v) => !process.env[v]);
if (missingEnv.length > 0) {
  console.error(`[Worker] Missing required environment variables:\n${missingEnv.map((v) => `  - ${v}`).join('\n')}`);
  process.exit(1);
}

import { Worker, Job, DelayedError } from 'bullmq';
import { db, tasks, taskPayloads, credits, creditTransactions, tools as toolsTable } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import { createRedisConnection, redis, createLogger, getProviderRateLimitConfig, tryAcquire, releaseSlot } from '@funmagic/services';
import { isProvider429Error, calculateBackoff } from './lib/provider-errors';
import { publishTaskCompleted, publishTaskFailed } from './lib/progress';
import { getToolWorker, getRegisteredTools } from './tools';
import { confirmCharge, releaseCredits } from '@funmagic/services/credit';
import type { AITaskJobData } from './types';

const log = createLogger('Worker');

log.info('Starting...');
log.info({ tools: getRegisteredTools() }, 'Registered tools');

/**
 * Resolve provider name from tool slug + stepId.
 * The provider name is embedded in the tool's config.steps[].provider.name.
 */
async function resolveProviderName(toolSlug: string, stepId?: string): Promise<string | null> {
  const tool = await db.query.tools.findFirst({
    where: eq(toolsTable.slug, toolSlug),
    columns: { config: true },
  });
  if (!tool) return null;
  const config = tool.config as { steps?: Array<{ id: string; provider?: { name: string } }> };
  if (!config.steps || config.steps.length === 0) return null;
  const step = stepId
    ? config.steps.find(s => s.id === stepId)
    : config.steps[0];
  return step?.provider?.name ?? null;
}

// AI Task Worker
const aiTaskWorker = new Worker<AITaskJobData>(
  'ai-tasks',
  async (job: Job<AITaskJobData>) => {
    const { taskId, toolSlug, stepId, input, userId, parentTaskId } = job.data;

    log.info({ taskId, toolSlug, stepId }, 'Processing task');

    // Per-provider rate limiting
    const providerName = await resolveProviderName(toolSlug, stepId);
    const rlConfig = providerName
      ? await getProviderRateLimitConfig(db, redis, 'web', providerName)
      : null;
    let rlAcquired = false;

    if (rlConfig && providerName) {
      const rlResult = await tryAcquire(redis, 'web', providerName, job.id!, rlConfig);
      if (!rlResult.allowed) {
        log.info({ taskId, provider: providerName, reason: rlResult.reason }, 'Rate limited, delaying job');
        await job.moveToDelayed(Date.now() + (rlResult.retryAfterMs ?? 5000), job.token);
        throw new DelayedError();
      }
      rlAcquired = true;
    }

    // Update task status to processing
    await db.update(tasks)
      .set({ status: 'processing', startedAt: new Date() })
      .where(eq(tasks.id, taskId));

    // Get the tool-specific worker
    const toolWorker = getToolWorker(toolSlug);

    if (!toolWorker) {
      throw new Error(`No worker found for tool: ${toolSlug}. Available: ${getRegisteredTools().join(', ')}`);
    }

    // Execute the tool worker with step context
    let result: import('./types').StepResult;
    try {
      result = await toolWorker.execute({
        taskId,
        stepId,
        userId,
        input: { ...input, parentTaskId },
        redis,
      });
    } catch (error) {
      // Handle provider 429 errors: reschedule instead of failing
      if (providerName && rlConfig?.retryOn429 !== false && isProvider429Error(error)) {
        const maxRetries = rlConfig?.maxRetries ?? 3;
        if (job.attemptsMade < maxRetries) {
          const backoff = calculateBackoff(job.attemptsMade, rlConfig?.baseBackoffMs ?? 1000);
          log.info({ taskId, provider: providerName, backoff, attempt: job.attemptsMade + 1, maxRetries }, 'Provider 429, rescheduling');
          if (rlAcquired) {
            await releaseSlot(redis, 'web', providerName, job.id!);
            rlAcquired = false;
          }
          await job.moveToDelayed(Date.now() + backoff, job.token);
          throw new DelayedError();
        }
      }

      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      if (rlAcquired && providerName) {
        await releaseSlot(redis, 'web', providerName, job.id!);
      }
    }

    // Provider data to persist regardless of outcome
    const providerData = {
      providerRequest: result.providerRequest,
      providerResponse: result.providerResponse,
      providerMeta: result.providerMeta,
    };

    if (result.success) {
      // Update task as completed
      await db.update(tasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update payload with output and provider data
      await db.update(taskPayloads)
        .set({ output: result.output, ...providerData })
        .where(eq(taskPayloads.taskId, taskId));

      // Confirm credit charge if credits were reserved
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (task?.creditsCost && task.creditsCost > 0) {
        await confirmCharge(db, credits, creditTransactions, {
          userId,
          amount: task.creditsCost,
          taskId,
          description: `Completed task for ${toolSlug}`,
        });
      }

      // Publish completion signal (no output — it can be massive, e.g. 13MB
      // point cloud data). Client fetches full output via REST after receiving
      // this notification. Output is already persisted in taskPayloads above.
      await publishTaskCompleted(redis, taskId);

      log.info({ taskId }, 'Task completed successfully');
      return result.output;

    } else {
      const errorMessage = result.error || 'Tool execution failed';
      log.error({ taskId, err: errorMessage }, 'Task failed');

      // Update task as failed
      await db.update(tasks)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update payload with error and any provider data captured before failure
      await db.update(taskPayloads)
        .set({ error: errorMessage, ...providerData })
        .where(eq(taskPayloads.taskId, taskId));

      // Release reserved credits if task failed
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (task?.creditsCost && task.creditsCost > 0) {
        await releaseCredits(db, credits, creditTransactions, {
          userId,
          amount: task.creditsCost,
          taskId,
          reason: `Task failed: ${errorMessage}`,
        });
      }

      // Publish failure event
      await publishTaskFailed(redis, taskId, errorMessage);

      throw new Error(errorMessage);
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 5,
  }
);

aiTaskWorker.on('completed', (job) => {
  log.info({ jobId: job.id }, 'Job completed');
});

aiTaskWorker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, err }, 'Job failed');
});

aiTaskWorker.on('error', (err) => {
  log.error({ err }, 'Worker error');
});

log.info('Started and listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  log.info('Received SIGTERM, closing worker...');
  await aiTaskWorker.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('Received SIGINT, closing worker...');
  await aiTaskWorker.close();
  await redis.quit();
  process.exit(0);
});
