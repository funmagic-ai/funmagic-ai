import { fal } from '@fal-ai/client';
import { db, tasks, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import type { ToolWorker, WorkerContext, StepResult, StepConfig, ToolConfig } from '../types';
import { decryptCredentials } from '../lib/credentials';
import { uploadFromUrl } from '../lib/storage';
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
 *       "providerModel": "fal-ai/bria-rmbg",
 *       "cost": 5  // Credits
 *     }
 *   ]
 * }
 */

interface BackgroundRemoveInput {
  imageUrl?: string;  // Direct image URL
  assetId?: string;   // User's uploaded asset ID
}

interface BackgroundRemoveConfig extends ToolConfig {
  steps: StepConfig[];
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

      if (!step.providerId) {
        throw new Error('No provider configured for background removal');
      }

      // Get provider credentials
      const provider = await db.query.providers.findFirst({
        where: eq(providers.id, step.providerId),
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      const credentials = decryptCredentials(provider);

      if (!credentials.apiKey) {
        throw new Error(`No API key configured for provider "${provider.displayName}"`);
      }

      await progress.startStep('remove-bg', 'Removing Background');

      // Validate input
      const imageUrl = bgInput.imageUrl;

      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      await progress.updateProgress(10, 'Starting background removal');

      // Configure FAL client with API key
      fal.config({ credentials: credentials.apiKey });

      // Get model from step config or default
      const modelId = (step as { providerModel?: string }).providerModel || 'fal-ai/bria-rmbg';

      // Use fal.subscribe for async operation with progress updates
      const result = await fal.subscribe(modelId, {
        input: { image_url: imageUrl },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            // Map queue position/logs to progress percentage
            const logsCount = update.logs?.length ?? 0;
            const progressPercent = Math.min(20 + logsCount * 10, 90);
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
