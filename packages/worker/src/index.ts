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
  'TOOL_TIMEOUT_MS',
];
const missingEnv = WORKER_REQUIRED_ENV.filter((v) => !process.env[v]);
if (missingEnv.length > 0) {
  console.error(`[Worker] Missing required environment variables:\n${missingEnv.map((v) => `  - ${v}`).join('\n')}`);
  process.exit(1);
}

import { Worker, Job, Queue, DelayedError } from 'bullmq';
import { db, tasks, taskPayloads, credits, creditTransactions, tools as toolsTable } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import {
  createRedisConnection, redis, createLogger, createTaskLogger,
  getProviderRateLimitConfig, tryAcquire, releaseSlot, markProviderBusy,
  taskDuration, tasksTotal, taskQueueWait,
  bullmqWaiting, bullmqActive, bullmqFailed,
  createMetricsHandler,
} from '@funmagic/services';
import { ERROR_CODES } from '@funmagic/shared';
import { isProvider429Error } from './lib/provider-errors';
import { TaskError } from './lib/task-error';
import { publishTaskCompleted, publishTaskFailed } from './lib/progress';
import { getToolWorker, getRegisteredTools } from './tools';
import { confirmCharge, releaseCredits } from '@funmagic/services/credit';
import type { AITaskJobData } from './types';

// Maximum time a tool worker can take before being considered stalled.
const TOOL_TIMEOUT_MS = parseInt(process.env.TOOL_TIMEOUT_MS!, 10);

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
    const { taskId, toolSlug, stepId, input, userId, parentTaskId, requestId } = job.data;
    const taskLog = createTaskLogger('Worker', taskId, requestId);
    const jobStartTime = performance.now();

    // Record queue wait time
    if (job.timestamp) {
      const waitSec = (Date.now() - job.timestamp) / 1000;
      taskQueueWait.observe({ queue: 'ai-tasks' }, waitSec);
    }

    taskLog.info({ toolSlug, stepId }, 'Processing task');

    // Per-provider rate limiting
    const providerName = await resolveProviderName(toolSlug, stepId);
    const rlConfig = providerName
      ? await getProviderRateLimitConfig(db, redis, 'web', providerName)
      : null;
    let rlAcquired = false;

    if (rlConfig && providerName) {
      const rlResult = await tryAcquire(redis, 'web', providerName, job.id!, rlConfig);
      if (!rlResult.allowed) {
        taskLog.info({ provider: providerName, reason: rlResult.reason }, 'Rate limited, delaying job');
        const jitter = Math.floor(Math.random() * 2000);
        await job.moveToDelayed(Date.now() + (rlResult.retryAfterMs ?? 5000) + jitter, job.token);
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

    // Execute the tool worker with timeout guard.
    // Prevents indefinite hangs when provider APIs are unreachable.
    let result: import('./types').StepResult;
    try {
      result = await Promise.race([
        toolWorker.execute({
          taskId,
          stepId,
          userId,
          input: { ...input, parentTaskId },
          redis,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, `Tool ${toolSlug} timed out after ${TOOL_TIMEOUT_MS / 1000}s`)),
            TOOL_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (error) {
      // Handle provider 429 errors: reschedule instead of failing.
      // NOTE: job.attemptsMade is NOT incremented by moveToDelayed + DelayedError,
      // so we track 429 retries separately via job.data to prevent infinite loops.
      if (providerName && rlConfig?.retryOn429 !== false && isProvider429Error(error)) {
        const maxRetries = rlConfig?.maxRetries ?? 3;
        const retryCount = (job.data as any)._429retries ?? 0;
        if (retryCount < maxRetries) {
          taskLog.info({ provider: providerName, attempt: retryCount + 1, maxRetries }, 'Provider 429, rescheduling');
          if (rlAcquired) {
            await releaseSlot(redis, 'web', providerName, job.id!);
            rlAcquired = false;
          }
          // Tell Gate 1 the provider is busy for another full RPM window
          await markProviderBusy(redis, 'web', providerName);
          await job.updateData({ ...job.data, _429retries: retryCount + 1 });
          // Short delay — Gate 1 will handle the actual timing on next run
          const jitter = Math.floor(Math.random() * 2000);
          await job.moveToDelayed(Date.now() + 2000 + jitter, job.token);
          throw new DelayedError();
        }
        taskLog.warn({ provider: providerName, retryCount, maxRetries }, 'Provider 429 retries exhausted, failing task');
      }

      result = {
        success: false,
        error: error instanceof TaskError
          ? error.code
          : ERROR_CODES.TASK_PROCESSING_FAILED,
      };
    } finally {
      if (rlAcquired && providerName) {
        await releaseSlot(redis, 'web', providerName, job.id!);
      }
    }

    // Record task metrics
    const durationSec = (performance.now() - jobStartTime) / 1000;
    const status = result.success ? 'completed' : 'failed';
    taskDuration.observe({ tool: toolSlug, status }, durationSec);
    tasksTotal.inc({ tool: toolSlug, status });

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

      taskLog.info('Task completed successfully');
      return result.output;

    } else {
      const errorCode = result.error || ERROR_CODES.TASK_PROCESSING_FAILED;
      taskLog.error({ err: errorCode, providerResponse: result.providerResponse }, 'Task failed');

      // Update task as failed
      await db.update(tasks)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update payload with error and any provider data captured before failure
      await db.update(taskPayloads)
        .set({ error: errorCode, ...providerData })
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
          reason: `Task failed for ${toolSlug}`,
        });
      }

      // Publish failure event
      await publishTaskFailed(redis, taskId, errorCode);

      // Do NOT throw here — the failure is fully handled (DB updated, credits
      // released, event published). Throwing would cause BullMQ to retry the
      // job, leading to duplicate credit release attempts.
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY ?? '5', 10),
    // Match lock duration to tool timeout so long-running jobs (e.g. VGGT
    // point-cloud generation) are not falsely detected as stalled.
    // BullMQ auto-extends the lock every lockDuration/2 ms.
    lockDuration: TOOL_TIMEOUT_MS,
    // Disable stalled-job retries: the worker handles all failures
    // internally (never throws), so a "stalled" job is just a slow job.
    // Re-running it creates duplicate provider calls (e.g. Replicate
    // predictions) without duplicate DB records.
    maxStalledCount: 0,
  }
);

aiTaskWorker.on('completed', (job) => {
  log.info({ jobId: job.id }, 'Job completed');
});

aiTaskWorker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, err }, 'Job failed');
});

aiTaskWorker.on('stalled', (jobId) => {
  log.warn({ jobId }, 'Job stalled (lock expired before completion)');
});

aiTaskWorker.on('error', (err) => {
  log.error({ err }, 'Worker error');
});

log.info('Started and listening for jobs');

// ─── Queue Depth Sampler ───
// Poll BullMQ queue counts every 30s and update Prometheus gauges
const aiTasksQueue = new Queue('ai-tasks', { connection: createRedisConnection() });

const queueSampler = setInterval(async () => {
  try {
    const counts = await aiTasksQueue.getJobCounts('waiting', 'active', 'failed');
    bullmqWaiting.set({ queue: 'ai-tasks' }, counts.waiting ?? 0);
    bullmqActive.set({ queue: 'ai-tasks' }, counts.active ?? 0);
    bullmqFailed.set({ queue: 'ai-tasks' }, counts.failed ?? 0);
  } catch {
    // Non-critical — skip this sample
  }
}, 30_000);

// ─── Metrics HTTP endpoint ───
const metricsPort = Number(process.env.WORKER_METRICS_PORT) || 9090;
const metricsServer = Bun.serve({
  port: metricsPort,
  fetch: createMetricsHandler(process.env.METRICS_AUTH_TOKEN),
});
log.info({ port: metricsPort }, 'Worker metrics server running');

// Graceful shutdown
async function shutdown(signal: string) {
  log.info({ signal }, 'Shutting down worker...');
  clearInterval(queueSampler);
  metricsServer.stop();
  await aiTaskWorker.close();
  await aiTasksQueue.close();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
