import 'dotenv/config';

// Validate required env vars before importing anything else
const WORKER_REQUIRED_ENV = ['DATABASE_URL', 'REDIS_URL', 'SECRET_KEY'];
const missingEnv = WORKER_REQUIRED_ENV.filter((v) => !process.env[v]);
if (missingEnv.length > 0) {
  console.error(`[Studio Worker] Missing required environment variables:\n${missingEnv.map((v) => `  - ${v}`).join('\n')}`);
  process.exit(1);
}

import { Worker, Job, DelayedError } from 'bullmq';
import { db, studioGenerations, studioProjects } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import { createRedisConnection, redis, getProviderRateLimitConfig, tryAcquire, releaseSlot } from '@funmagic/services';
import { isProvider429Error, calculateBackoff } from './lib/provider-errors';
import {
  getStudioProviderWorker,
  getRegisteredProviders,
  determineModelCapability,
  publishStudioProgress,
} from './studio-tools';
import type { StudioGenerationJobData, StudioProvider, ModelCapability } from './studio-tools/types';

console.log('[Studio Worker] Starting...');
console.log(`[Studio Worker] Registered providers: ${getRegisteredProviders().join(', ')}`);

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
    } = job.data;

    // Determine model capability from job data or infer from provider/model
    const modelCapability: ModelCapability = jobModelCapability || determineModelCapability(provider as StudioProvider, model);

    console.log(`\n[Studio Worker] Processing generation ${messageId} for provider "${provider}" (model: ${model}, capability: ${modelCapability})`);

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
        console.log(`[Studio Worker] Rate limited (${rlResult.reason}) for provider "${providerName}", delaying job ${job.id}`);
        await job.moveToDelayed(Date.now() + (rlResult.retryAfterMs ?? 5000), job.token);
        throw new DelayedError();
      }
      rlAcquired = true;
    }

    try {
      // Get the provider-specific worker
      const providerWorker = getStudioProviderWorker(provider as StudioProvider);

      if (!providerWorker) {
        throw new Error(`No worker found for provider: ${provider}. Available: ${getRegisteredProviders().join(', ')}`);
      }

      // Execute the provider worker
      const result = await providerWorker.execute({
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
      });

      if (!result.success) {
        throw new Error(result.error || 'Provider execution failed');
      }

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
        console.log(`[Studio Worker] Stored OpenAI response ID for project ${projectId}`);
      }

      console.log(`[Studio Worker] Generation ${messageId} completed successfully`);
      return result;

    } catch (error) {
      // Handle provider 429 errors: reschedule instead of failing
      if (rlConfig?.retryOn429 !== false && isProvider429Error(error)) {
        const maxRetries = rlConfig?.maxRetries ?? 3;
        if (job.attemptsMade < maxRetries) {
          const backoff = calculateBackoff(job.attemptsMade, rlConfig?.baseBackoffMs ?? 1000);
          console.log(`[Studio Worker] Provider 429 for "${providerName}", rescheduling in ${backoff}ms (attempt ${job.attemptsMade + 1}/${maxRetries})`);
          await job.moveToDelayed(Date.now() + backoff, job.token);
          throw new DelayedError();
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Studio Worker] Generation ${messageId} failed:`, errorMessage);

      // Update generation as failed
      await db.update(studioGenerations)
        .set({
          status: 'failed',
          error: errorMessage,
          completedAt: new Date(),
        })
        .where(eq(studioGenerations.id, messageId));

      // Publish failure event
      await publishStudioProgress(redis, messageId, {
        type: 'error',
        error: errorMessage,
      });

      throw error;
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
  console.log(`[Studio Worker] Job ${job.id} completed`);
});

studioWorker.on('failed', (job, err) => {
  console.error(`[Studio Worker] Job ${job?.id} failed:`, err.message);
});

studioWorker.on('error', (err) => {
  console.error('[Studio Worker] Error:', err);
});

console.log('[Studio Worker] Started and listening for jobs on "studio-tasks" queue');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing studio worker...');
  await studioWorker.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing studio worker...');
  await studioWorker.close();
  await redis.quit();
  process.exit(0);
});
