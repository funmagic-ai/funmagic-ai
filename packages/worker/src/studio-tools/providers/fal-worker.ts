import { fal } from '@fal-ai/client';
import { isProvider429Error } from '../../lib/provider-errors';
import { createLogger } from '@funmagic/services';
import type {
  StudioProviderWorker,
  StudioWorkerContext,
  StudioResult,
  StudioRawRequest,
  StudioRawResponse,
  GeneratedImage,
} from '../types';
import {
  fetchImageAsDataUri,
  createProgressTracker,
} from '../utils';
import { uploadFromUrlAdmin } from '../../lib/storage';
import { ASSET_MODULE } from '@funmagic/shared';

const log = createLogger('FalWorker');

// Tool configuration: Fal model ID, required inputs, and result parsing
interface FalToolConfig {
  modelId: string;
  requiresImage: boolean;
  filenamePrefix: string;
  parseResult: (data: any) => string | undefined;
}

const FAL_TOOLS: Record<string, FalToolConfig> = {
  'background-remove': {
    modelId: 'fal-ai/bria/background/remove',
    requiresImage: true,
    filenamePrefix: 'bg_removed',
    parseResult: (data) => data?.image?.url,
  },
  'upscale': {
    modelId: 'fal-ai/clarity-upscaler',
    requiresImage: true,
    filenamePrefix: 'upscaled',
    parseResult: (data) => data?.image?.url,
  },
};

/**
 * Fal.ai Provider Worker
 * Supports utility capabilities like background removal and upscaling
 * Uses Fal.ai REST API with polling
 */
export const falWorker: StudioProviderWorker = {
  provider: 'fal',
  capabilities: ['utility'],

  async execute(context: StudioWorkerContext): Promise<StudioResult> {
    const { input, adminId, messageId, apiKey } = context;
    const progress = createProgressTracker(context);
    const taskLog = log.child({ messageId });

    try {
      const falOptions = input.options?.fal || {};
      const toolName = falOptions.tool || 'background-remove';
      const toolConfig = FAL_TOOLS[toolName];

      if (!toolConfig) {
        throw new Error(`Unknown Fal tool: ${toolName}. Available: ${Object.keys(FAL_TOOLS).join(', ')}`);
      }

      const quotedImages = input.quotedImages;

      if (toolConfig.requiresImage && (!quotedImages || quotedImages.length === 0)) {
        throw new Error(`At least one image is required for ${toolName}`);
      }

      taskLog.info({ tool: toolName, imageCount: quotedImages?.length ?? 0 }, 'Executing');

      // Configure Fal.ai client with API key from database
      fal.config({ credentials: apiKey });

      const startTime = Date.now();
      const rawRequestInputs: Array<{ imageIndex: number; tool: string }> = [];
      const rawResponseOutputs: Array<{ imageIndex: number; resultUrl: string }> = [];

      const images: GeneratedImage[] = [];

      // Process each image
      for (let i = 0; i < (quotedImages?.length ?? 0); i++) {
        const img = quotedImages![i];
        const dataUri = await fetchImageAsDataUri(img);

        taskLog.info({ imageIndex: i, total: quotedImages!.length, tool: toolName }, 'Processing image');
        rawRequestInputs.push({ imageIndex: i, tool: toolName });

        const result = await fal.subscribe(toolConfig.modelId, {
          input: { image_url: dataUri },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              const logsCount = update.logs?.length ?? 0;
              taskLog.debug({ tool: toolName, logsCount }, 'Progress update');
            }
          },
        }) as { data: any };

        const resultUrl = toolConfig.parseResult(result.data);
        if (!resultUrl) {
          throw new Error(`No image URL in fal.ai ${toolName} response`);
        }

        rawResponseOutputs.push({ imageIndex: i, resultUrl });

        // Upload result to S3 with asset record
        const asset = await uploadFromUrlAdmin({
          url: resultUrl,
          userId: adminId,
          module: ASSET_MODULE.STUDIO,
          taskId: messageId,
          filename: `${toolConfig.filenamePrefix}_${Date.now()}_${i}.png`,
        });

        images.push({
          storageKey: asset.storageKey,
          type: 'generated',
        });

        await progress.imageDone(i, asset.storageKey);
      }

      await progress.complete(images);

      const rawRequest: StudioRawRequest = {
        url: `https://fal.run/${toolConfig.modelId}`,
        method: 'POST',
        body: { tool: toolName, images: rawRequestInputs },
        timestamp: new Date().toISOString(),
      };

      const rawResponse: StudioRawResponse = {
        status: 200,
        body: { images: rawResponseOutputs, imageCount: images.length },
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        images,
        rawRequest,
        rawResponse,
      };

    } catch (error) {
      // Rethrow 429 errors so the parent worker can reschedule via DelayedError
      if (isProvider429Error(error)) throw error;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      taskLog.error({ err: errorMessage }, 'Failed');
      await progress.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
