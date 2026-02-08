import { fal } from '@fal-ai/client';
import { db, tasks, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import type { ToolWorker, WorkerContext, StepResult, StepConfig, ToolConfig } from '../types';
import { decryptCredentials } from '../lib/credentials';
import { uploadFromUrl, getDownloadUrl } from '../lib/storage';
import { createProgressTracker } from '../lib/progress';

/**
 * Background Remove Tool Config Structure (stored in tool.config)
 *
 * {
 *   "steps": [
 *     {
 *       "id": "remove-bg",
 *       "name": "Remove Background",
 *       "type": "background-remove",
 *       "providerId": "uuid-fal",  // Admin links this
 *       "providerModel": "fal-ai/bria/background/remove",
 *       "cost": 5  // Credits
 *     }
 *   ]
 * }
 */

interface BackgroundRemoveInput {
  imageUrl?: string;  // Direct image URL
  imageStorageKey?: string;  // User uploaded image storage key (S3 key)
  assetId?: string;   // User's uploaded asset ID
}

interface StepConfigWithProvider extends StepConfig {
  providerModel?: string;
  // New nested provider structure (from admin UI)
  provider?: {
    name: string;
    model: string;
    providerOptions?: Record<string, unknown>;
    customProviderOptions?: Record<string, unknown>;
  };
}

interface BackgroundRemoveConfig extends ToolConfig {
  steps: StepConfigWithProvider[];
}

/**
 * Helper to get model from step config.
 * Supports both old flat structure and new nested provider structure.
 */
function getProviderModel(step: StepConfigWithProvider, defaultModel: string): string {
  // New nested structure
  if (step.provider?.model) {
    return step.provider.model;
  }
  // Old flat structure
  return step.providerModel ?? defaultModel;
}

interface FalResult {
  image: { url: string };
}

/**
 * Background Remove tool worker
 * Single-step tool using fal.ai bria/background/remove via SDK
 */
export const backgroundRemoveWorker: ToolWorker = {
  async execute(context: WorkerContext): Promise<StepResult> {
    const { taskId, userId, input, redis } = context;
    const progress = createProgressTracker(redis, taskId);

    try {
      // Get task with tool config
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        with: { tool: true },
      });

      if (!task || !task.tool) {
        throw new Error('Task or tool not found');
      }

      const config = task.tool.config as BackgroundRemoveConfig;
      const bgInput = input as BackgroundRemoveInput;

      // Get the step config (single step tool)
      const step = config.steps[0];

      if (!step) {
        throw new Error('No step configured for background remove tool');
      }

      // Get provider name from step config
      const providerName = step.provider?.name;
      if (!providerName) {
        throw new Error('No provider configured for background removal');
      }

      // Look up provider by name (case-insensitive)
      const allProviders = await db.query.providers.findMany();
      const provider = allProviders.find(
        (p) => p.name.toLowerCase() === providerName.toLowerCase() && p.isActive
      );

      if (!provider) {
        throw new Error(`Provider "${providerName}" not found or inactive`);
      }

      const credentials = decryptCredentials(provider);

      if (!credentials.apiKey) {
        throw new Error(`No API key configured for provider "${provider.displayName}"`);
      }

      await progress.startStep('remove-bg', 'Removing Background');

      // Get image URL - either directly provided or from storage key
      let imageUrl = bgInput.imageUrl;
      if (!imageUrl && bgInput.imageStorageKey) {
        imageUrl = await getDownloadUrl(bgInput.imageStorageKey);
      }

      if (!imageUrl) {
        throw new Error('Image URL or storage key is required');
      }

      await progress.updateProgress(5, 'Preparing image');

      // Configure FAL client with API key
      fal.config({ credentials: credentials.apiKey });

      // Upload image to fal.ai storage first (required for non-public URLs like S3 presigned URLs)
      await progress.updateProgress(10, 'Uploading to processing server');
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBlob = await imageResponse.blob();
      const falImageUrl = await fal.storage.upload(imageBlob);

      await progress.updateProgress(20, 'Starting background removal');

      // Get model from step config or default
      const modelId = getProviderModel(step, 'fal-ai/bria/background/remove');

      // Use fal.subscribe for async operation with progress updates
      const result = await fal.subscribe(modelId, {
        input: { image_url: falImageUrl },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            // Map queue position/logs to progress percentage
            const logsCount = update.logs?.length ?? 0;
            const progressPercent = Math.min(30 + logsCount * 10, 90);
            progress.updateProgress(progressPercent, 'Processing...');
          }
        },
      }) as { data: FalResult };

      if (!result.data?.image?.url) {
        throw new Error('No image URL in fal.ai response');
      }

      await progress.updateProgress(90, 'Saving result');

      // Upload to S3
      const asset = await uploadFromUrl({
        url: result.data.image.url,
        userId,
        module: 'background-remove',
        taskId,
        filename: `bg_removed_${Date.now()}.png`,
      });

      await progress.updateProgress(100, 'Complete');
      await progress.completeStep({ assetId: asset.id });

      return {
        success: true,
        assetId: asset.id,
        output: {
          assetId: asset.id,
          storageKey: asset.storageKey,
          originalUrl: imageUrl,
          processedUrl: result.data.image.url,
        },
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await progress.fail(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
