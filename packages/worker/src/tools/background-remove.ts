import { fal } from '@fal-ai/client';
import { ERROR_CODES } from '@funmagic/shared';
import { isProvider429Error } from '../lib/provider-errors';
import { TaskError } from '../lib/task-error';
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
 *       "provider": {
 *         "name": "fal",
 *         "model": "fal-ai/bria/background/remove"
 *       },
 *       "cost": 5
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

function getProviderModel(step: StepConfigWithProvider): string {
  const model = step.provider?.model;
  if (!model) {
    throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `No model configured for step "${step.id}"`);
  }
  return model;
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
    const progress = createProgressTracker(redis, taskId, userId);

    let providerRequest: Record<string, unknown> | undefined;
    let providerMeta: Record<string, unknown> | undefined;

    try {
      // Get task with tool config
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        with: { tool: true },
      });

      if (!task || !task.tool) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'Task or tool not found');
      }

      const config = task.tool.config as BackgroundRemoveConfig;
      const bgInput = input as BackgroundRemoveInput;

      // Get the step config (single step tool)
      const step = config.steps[0];

      if (!step) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'No step configured for background remove tool');
      }

      // Get provider by name from step config
      const providerName = step.provider?.name;
      if (!providerName) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, 'No provider configured for background removal');
      }

      const allProviders = await db.query.providers.findMany();
      const provider = allProviders.find(
        (p) => p.name.toLowerCase() === providerName.toLowerCase() && p.isActive
      );

      if (!provider) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `Provider "${providerName}" not found or inactive`);
      }

      const credentials = decryptCredentials(provider);

      if (!credentials.apiKey) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `No API key configured for provider "${provider.displayName}"`);
      }

      await progress.startStep(step.id, step.name || 'Processing');

      // Get image URL - either directly provided or from storage key
      let imageUrl = bgInput.imageUrl;
      if (!imageUrl && bgInput.imageStorageKey) {
        imageUrl = await getDownloadUrl(bgInput.imageStorageKey);
      }

      if (!imageUrl) {
        throw new TaskError(ERROR_CODES.TASK_INPUT_INVALID, 'Image URL or storage key is required');
      }

      await progress.updateProgress(5, 'Preparing image');

      // Configure FAL client with API key
      fal.config({ credentials: credentials.apiKey });

      // Upload image to fal.ai storage first (required for non-public URLs like S3 presigned URLs)
      await progress.updateProgress(10, 'Uploading to processing server');
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, `Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBlob = await imageResponse.blob();
      const falImageUrl = await fal.storage.upload(imageBlob);

      await progress.updateProgress(20, 'Starting background removal');

      // Get model from step config
      const modelId = getProviderModel(step);

      // Build provider request
      const providerInput = { image_url: falImageUrl };
      providerRequest = { model: modelId, input: providerInput };
      providerMeta = { provider: 'fal', model: modelId };

      // Use fal.subscribe for async operation with progress updates
      const result = await fal.subscribe(modelId, {
        input: providerInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            // Map queue position/logs to progress percentage
            const logsCount = update.logs?.length ?? 0;
            const progressPercent = Math.min(30 + logsCount * 10, 90);
            progress.updateProgress(progressPercent, 'Processing...');
          }
        },
      }) as { data: FalResult; requestId?: string };

      if (!result.data?.image?.url) {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No image URL in fal.ai response');
      }

      await progress.updateProgress(90, 'Saving result');

      // Upload to S3
      const toolSlug = task.tool.slug;
      const asset = await uploadFromUrl({
        url: result.data.image.url,
        userId,
        module: toolSlug,
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
        },
        providerRequest,
        providerResponse: { data: result.data },
        providerMeta: { ...providerMeta, requestId: result.requestId },
      };

    } catch (error) {
      // Rethrow 429 errors so the parent worker can reschedule via DelayedError
      if (isProvider429Error(error)) throw error;

      const userFacingError = error instanceof TaskError
        ? error.code
        : ERROR_CODES.TASK_PROCESSING_FAILED;
      const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

      // Extract raw provider response from SDK errors
      const providerResponse: Record<string, unknown> = {};
      if (error instanceof Error) {
        if ('status' in error) providerResponse.status = (error as any).status;
        if ('response' in error) {
          const resp = (error as any).response;
          providerResponse.statusCode = resp?.status;
          providerResponse.body = resp?.body ?? resp?.data ?? resp?.text;
        }
      }

      console.error(`[background-remove] Task ${taskId} failed: ${technicalMessage}`, {
        providerResponse: Object.keys(providerResponse).length > 0 ? providerResponse : undefined,
      });

      await progress.fail(userFacingError);
      return {
        success: false,
        error: userFacingError,
        providerRequest,
        providerResponse: Object.keys(providerResponse).length > 0 ? providerResponse : undefined,
        providerMeta,
      };
    }
  },
};
