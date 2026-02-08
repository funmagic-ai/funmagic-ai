import 'dotenv/config';

import { Worker, Job } from 'bullmq';
import { db, adminMessages, adminChats } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import { createRedisConnection, redis } from '@funmagic/services';
import {
  getAdminProviderWorker,
  getRegisteredProviders,
  determineModelCapability,
  publishAdminProgress,
} from './admin-tools';
import type { AdminMessageJobData, AdminProvider, ModelCapability } from './admin-tools/types';

console.log('[Admin Worker] Starting...');
console.log(`[Admin Worker] Registered providers: ${getRegisteredProviders().join(', ')}`);

// Admin AI Task Worker
const adminAITaskWorker = new Worker<AdminMessageJobData>(
  'admin-ai-tasks',
  async (job: Job<AdminMessageJobData>) => {
    const {
      messageId,
      provider,
      model,
      modelCapability: jobModelCapability,
      input,
      adminId,
      chatId,
      session,
      apiKey,
    } = job.data;

    // Determine model capability from job data or infer from provider/model
    const modelCapability: ModelCapability = jobModelCapability || determineModelCapability(provider as AdminProvider, model);

    console.log(`\n[Admin Worker] Processing message ${messageId} for provider "${provider}" (model: ${model}, capability: ${modelCapability})`);

    // Update message status to processing
    await db.update(adminMessages)
      .set({ status: 'processing' })
      .where(eq(adminMessages.id, messageId));

    try {
      // Get the provider-specific worker
      const providerWorker = getAdminProviderWorker(provider as AdminProvider);

      if (!providerWorker) {
        throw new Error(`No worker found for provider: ${provider}. Available: ${getRegisteredProviders().join(', ')}`);
      }

      // Execute the provider worker
      const result = await providerWorker.execute({
        messageId,
        chatId,
        adminId,
        provider: provider as AdminProvider,
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

      // Update message with results - store only storageKey for images
      await db.update(adminMessages)
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
        .where(eq(adminMessages.id, messageId));

      // Store session data for multi-turn conversations (OpenAI only - Google reconstructs from messages)
      if (result.session?.openaiResponseId !== undefined) {
        await db.update(adminChats)
          .set({ openaiResponseId: result.session.openaiResponseId })
          .where(eq(adminChats.id, chatId));
        console.log(`[Admin Worker] Stored OpenAI response ID for chat ${chatId}`);
      }

      console.log(`[Admin Worker] Message ${messageId} completed successfully`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Admin Worker] Message ${messageId} failed:`, errorMessage);

      // Update message as failed
      await db.update(adminMessages)
        .set({
          status: 'failed',
          error: errorMessage,
          completedAt: new Date(),
        })
        .where(eq(adminMessages.id, messageId));

      // Publish failure event
      await publishAdminProgress(redis, messageId, {
        type: 'error',
        error: errorMessage,
      });

      throw error;
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 3, // Lower concurrency for admin tasks (image generation is resource-intensive)
  }
);

adminAITaskWorker.on('completed', (job) => {
  console.log(`[Admin Worker] Job ${job.id} completed`);
});

adminAITaskWorker.on('failed', (job, err) => {
  console.error(`[Admin Worker] Job ${job?.id} failed:`, err.message);
});

adminAITaskWorker.on('error', (err) => {
  console.error('[Admin Worker] Error:', err);
});

console.log('[Admin Worker] Started and listening for jobs on "admin-ai-tasks" queue');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing admin worker...');
  await adminAITaskWorker.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing admin worker...');
  await adminAITaskWorker.close();
  await redis.quit();
  process.exit(0);
});
