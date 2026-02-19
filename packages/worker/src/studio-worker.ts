import 'dotenv/config';

// Validate required env vars before importing anything else
const WORKER_REQUIRED_ENV = ['DATABASE_URL', 'REDIS_URL', 'SECRET_KEY', 'PROVIDER_TIMEOUT_MS'];
const missingEnv = WORKER_REQUIRED_ENV.filter((v) => !process.env[v]);
if (missingEnv.length > 0) {
  console.error(`[Studio Worker] Missing required environment variables:\n${missingEnv.map((v) => `  - ${v}`).join('\n')}`);
  process.exit(1);
}

import { Worker, Job, Queue, DelayedError } from 'bullmq';
import { db, studioGenerations, studioProjects } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import {
  createRedisConnection, redis, createLogger, createTaskLogger,
  getProviderRateLimitConfig, tryAcquire, releaseSlot,
  taskDuration, tasksTotal, taskQueueWait,
  providerApiDuration, providerRateLimitHits, providerErrors,
  bullmqWaiting, bullmqActive, bullmqFailed,
  createMetricsHandler,
} from '@funmagic/services';
import { ERROR_CODES } from '@funmagic/shared';
import { isProvider429Error, calculateBackoff } from './lib/provider-errors';
import { TaskError } from './lib/task-error';

// Maximum time a provider API call can take before being considered stalled.
const PROVIDER_TIMEOUT_MS = parseInt(process.env.PROVIDER_TIMEOUT_MS!, 10);
import {
  getStudioProviderWorker,
  getRegisteredProviders,
  determineModelCapability,
  publishStudioProgress,
} from './studio-tools';
import type { StudioGenerationJobData, StudioProvider, ModelCapability } from './studio-tools/types';

const log = createLogger('StudioWorker');

log.info('Starting...');
log.info({ providers: getRegisteredProviders() }, 'Registered providers');

// Studio Generation Worker
const studioWorker = new Worker<StudioGenerationJobData>(
  'studio-tasks',
  async (job: Job<StudioGenerationJobData>) => {
    const {
      messageId,
      provider,
      model,
      modelCapability: jobModelCapability,
      input,
      adminId,
      projectId,
      session,
      apiKey,
      requestId,
    } = job.data;

    const taskLog = createTaskLogger('StudioWorker', messageId, requestId);
    const jobStartTime = performance.now();

    // Record queue wait time
    if (job.timestamp) {
      const waitSec = (Date.now() - job.timestamp) / 1000;
      taskQueueWait.observe({ queue: 'studio-tasks' }, waitSec);
    }

    // Determine model capability from job data or infer from provider/model
    const modelCapability: ModelCapability = jobModelCapability || determineModelCapability(provider as StudioProvider, model);

    taskLog.info({ provider, model, capability: modelCapability }, 'Processing generation');

    // Update generation status to processing
    await db.update(studioGenerations)
      .set({ status: 'processing' })
      .where(eq(studioGenerations.id, messageId));

    // Per-provider rate limiting
    const providerName = provider as string;
    const rlConfig = await getProviderRateLimitConfig(db, redis, 'admin', providerName);
    let rlAcquired = false;

    if (rlConfig) {
      const rlResult = await tryAcquire(redis, 'admin', providerName, job.id!, rlConfig);
      if (!rlResult.allowed) {
        providerRateLimitHits.inc({ provider: providerName });
        taskLog.info({ provider: providerName, reason: rlResult.reason }, 'Rate limited, delaying job');
        await job.moveToDelayed(Date.now() + (rlResult.retryAfterMs ?? 5000), job.token);
        throw new DelayedError();
      }
      rlAcquired = true;
    }

    try {
      // Get the provider-specific worker
      const providerWorker = getStudioProviderWorker(provider as StudioProvider);

      if (!providerWorker) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `No worker found for provider: ${provider}. Available: ${getRegisteredProviders().join(', ')}`);
      }

      // Execute the provider worker with timeout guard.
      // If the provider API hangs (network down, etc.), this prevents the job
      // from running indefinitely (we've seen 580+ minute stalls).
      const apiStart = performance.now();
      const result = await Promise.race([
        providerWorker.execute({
          messageId,
          projectId,
          adminId,
          provider: provider as StudioProvider,
          model,
          modelCapability,
          input,
          redis,
          session,
          apiKey,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, `Provider ${providerName} timed out after ${PROVIDER_TIMEOUT_MS / 1000}s`)),
            PROVIDER_TIMEOUT_MS,
          ),
        ),
      ]);
      const apiDurationSec = (performance.now() - apiStart) / 1000;
      providerApiDuration.observe({ provider: providerName, operation: 'generate' }, apiDurationSec);

      if (!result.success) {
        providerErrors.inc({ provider: providerName, error_type: 'execution_failed' });
        // result.error is now an error code from the provider worker
        throw new TaskError(
          (result.error as keyof typeof ERROR_CODES) || ERROR_CODES.TASK_PROCESSING_FAILED,
          `Provider ${providerName} execution failed`,
        );
      }

      // Record task metrics
      const durationSec = (performance.now() - jobStartTime) / 1000;
      taskDuration.observe({ tool: `studio-${providerName}`, status: 'completed' }, durationSec);
      tasksTotal.inc({ tool: `studio-${providerName}`, status: 'completed' });

      // Update generation with results - store only storageKey for images
      await db.update(studioGenerations)
        .set({
          status: 'completed',
          images: result.images?.map(img => ({
            storageKey: img.storageKey,
            type: img.type,
          })),
          content: result.text || undefined,
          rawRequest: result.rawRequest,
          rawResponse: result.rawResponse,
          completedAt: new Date(),
        })
        .where(eq(studioGenerations.id, messageId));

      // Store session data for multi-turn conversations (OpenAI only - Google reconstructs from generations)
      if (result.session?.openaiResponseId !== undefined) {
        await db.update(studioProjects)
          .set({ openaiResponseId: result.session.openaiResponseId })
          .where(eq(studioProjects.id, projectId));
        taskLog.info({ projectId }, 'Stored OpenAI response ID');
      }

      taskLog.info('Generation completed successfully');
      return result;

    } catch (error) {
      // Handle provider 429 errors: reschedule instead of failing
      if (rlConfig?.retryOn429 !== false && isProvider429Error(error)) {
        providerRateLimitHits.inc({ provider: providerName });
        const maxRetries = rlConfig?.maxRetries ?? 3;
        if (job.attemptsMade < maxRetries) {
          const backoff = calculateBackoff(job.attemptsMade, rlConfig?.baseBackoffMs ?? 1000);
          taskLog.info({ provider: providerName, backoff, attempt: job.attemptsMade + 1, maxRetries }, 'Provider 429, rescheduling');
          await job.moveToDelayed(Date.now() + backoff, job.token);
          throw new DelayedError();
        }
      }

      const errorCode = error instanceof TaskError
        ? error.code
        : ERROR_CODES.TASK_PROCESSING_FAILED;
      const technicalMessage = error instanceof Error ? error.message : 'Unknown error';
      taskLog.error({ err: technicalMessage, errorCode }, 'Generation failed');

      // Record failure metrics
      const durationSec = (performance.now() - jobStartTime) / 1000;
      taskDuration.observe({ tool: `studio-${providerName}`, status: 'failed' }, durationSec);
      tasksTotal.inc({ tool: `studio-${providerName}`, status: 'failed' });
      providerErrors.inc({ provider: providerName, error_type: 'unknown' });

      // Update generation as failed (store error code, not raw message)
      await db.update(studioGenerations)
        .set({
          status: 'failed',
          error: errorCode,
          completedAt: new Date(),
        })
        .where(eq(studioGenerations.id, messageId));

      // Publish failure event with error code
      await publishStudioProgress(redis, messageId, {
        type: 'error',
        error: errorCode,
      });

      // Do NOT throw here — the failure is fully handled (DB updated, event
      // published). Throwing would cause BullMQ to retry the job, leading to
      // duplicate processing and potential DB constraint violations.
    } finally {
      if (rlAcquired) {
        await releaseSlot(redis, 'admin', providerName, job.id!);
      }
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 3, // Lower concurrency for studio tasks (image generation is resource-intensive)
  }
);

studioWorker.on('completed', (job) => {
  log.info({ jobId: job.id }, 'Job completed');
});

studioWorker.on('failed', (job, err) => {
  log.error({ jobId: job?.id, err: err.message }, 'Job failed');
});

studioWorker.on('error', (err) => {
  log.error({ err }, 'Worker error');
});

log.info('Started and listening for jobs on "studio-tasks" queue');

// ─── Queue Depth Sampler ───
const studioTasksQueue = new Queue('studio-tasks', { connection: createRedisConnection() });

const queueSampler = setInterval(async () => {
  try {
    const counts = await studioTasksQueue.getJobCounts('waiting', 'active', 'failed');
    bullmqWaiting.set({ queue: 'studio-tasks' }, counts.waiting ?? 0);
    bullmqActive.set({ queue: 'studio-tasks' }, counts.active ?? 0);
    bullmqFailed.set({ queue: 'studio-tasks' }, counts.failed ?? 0);
  } catch {
    // Non-critical — skip this sample
  }
}, 30_000);

// ─── Metrics HTTP endpoint ───
const metricsPort = Number(process.env.STUDIO_WORKER_METRICS_PORT) || 9091;
const metricsServer = Bun.serve({
  port: metricsPort,
  fetch: createMetricsHandler(process.env.METRICS_AUTH_TOKEN),
});
log.info({ port: metricsPort }, 'Studio worker metrics server running');

// Graceful shutdown
async function shutdown(signal: string) {
  log.info({ signal }, 'Shutting down studio worker...');
  clearInterval(queueSampler);
  metricsServer.stop();
  await studioWorker.close();
  await studioTasksQueue.close();
  await redis.quit();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
