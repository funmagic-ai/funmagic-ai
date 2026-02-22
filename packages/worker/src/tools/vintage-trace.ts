import OpenAI from 'openai';
import { ERROR_CODES } from '@funmagic/shared';
import { isProvider429Error } from '../lib/provider-errors';
import { TaskError } from '../lib/task-error';
import { db, tasks, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import type { ToolWorker, WorkerContext, StepResult, StepConfig, ToolConfig } from '../types';
import { decryptCredentials } from '../lib/credentials';
import { uploadFromUrl, getDownloadUrl, getAssetDownloadUrl } from '../lib/storage';
import { getPublicCdnUrl } from '@funmagic/services/storage';
import { createProgressTracker } from '../lib/progress';

/**
 * Vintage Trace Tool Config Structure (stored in tool.config)
 *
 * Admin defines:
 * - A single image-gen step with provider links, cost, and a base prompt
 * - Style references (up to 8 images) on the image-gen step
 *
 * {
 *   "steps": [
 *     {
 *       "id": "image-gen",
 *       "prompt": "Transform this image into the given style...",
 *       "styleReferences": [
 *         { "imageUrl": "storage-key-or-url" }
 *       ],
 *       "provider": { "name": "openai", "model": "gpt-image-1", ... },
 *       "cost": 20
 *     }
 *   ]
 * }
 */

interface VintageTraceInput {
  styleReferenceId?: string;  // Required - index into styleReferences array
  imageUrl?: string;  // User uploaded image URL (direct URL)
  imageStorageKey?: string;  // User uploaded image storage key (S3 key)
  assetId?: string;   // User uploaded asset ID
}

interface StyleReference {
  imageUrl: string;  // Reference image for this style
  prompt?: string;   // Custom prompt for this style (overrides step-level prompt)
  useStyleImage?: boolean;  // Whether to send style image to AI (default: true)
}

interface StepConfigWithOptions extends StepConfig {
  provider?: {
    name: string;
    model: string;
    providerOptions?: Record<string, unknown>;
    customProviderOptions?: Record<string, unknown>;
  };
}

/** Image-gen step config with vintage-trace-specific fields */
interface VintageTraceImageGenStep extends StepConfigWithOptions {
  prompt?: string;
  styleReferences?: StyleReference[];
}

function getMergedProviderOptions(step: StepConfigWithOptions): Record<string, unknown> {
  return {
    ...(step.provider?.providerOptions ?? {}),
    ...(step.provider?.customProviderOptions ?? {}),
  };
}

function getProviderModel(step: StepConfigWithOptions): string {
  const model = step.provider?.model;
  if (!model) {
    throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `No model configured for step "${step.id}"`);
  }
  return model;
}

interface VintageTraceConfig extends ToolConfig {
  steps: StepConfigWithOptions[];
}

// OpenAI image generation supports these sizes
type OpenAIGenerateSize = '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792' | 'auto';
// OpenAI image edit supports a more limited set
type OpenAIEditSize = '256x256' | '512x512' | '1024x1024' | '1536x1024' | '1024x1536' | 'auto';

/**
 * Vintage Trace tool worker
 * Handles image generation only (single step)
 */
export const vintageTraceWorker: ToolWorker = {
  async execute(context: WorkerContext): Promise<StepResult> {
    const { taskId, stepId, userId, input, redis } = context;
    const progress = createProgressTracker(redis, taskId, userId);

    try {
      // Get task with tool config
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        with: { tool: true },
      });

      if (!task || !task.tool) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'Task or tool not found');
      }

      const config = task.tool.config as VintageTraceConfig;
      const vintageTraceInput = input as VintageTraceInput;

      // Determine which step to execute
      const currentStepId = stepId || config.steps[0]?.id;
      if (!currentStepId) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'No steps configured for this tool');
      }

      const step = config.steps.find(s => s.id === currentStepId);

      if (!step) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `Step "${currentStepId}" not found in tool config`);
      }

      // Get provider by name from step config
      const providerName = step.provider?.name;
      if (!providerName) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `No provider configured for step "${step.name}"`);
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

      await progress.startStep(currentStepId, step.name || currentStepId);

      const toolSlug = task.tool.slug;

      if (providerName === 'openai') {
        return await executeImageGenStep({
          taskId,
          userId,
          step,
          config,
          input: vintageTraceInput,
          apiKey: credentials.apiKey,
          progress,
          toolSlug,
        });
      }

      throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `Unsupported provider "${providerName}" for step "${currentStepId}"`);

    } catch (error) {
      // Rethrow 429 errors so the parent worker can reschedule via DelayedError
      if (isProvider429Error(error)) throw error;

      // TaskError carries a user-facing code; plain errors are unexpected
      const userFacingError = error instanceof TaskError
        ? error.code
        : ERROR_CODES.TASK_PROCESSING_FAILED;
      const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log the technical detail for admin debugging
      console.error(`[vintage-trace] Task ${taskId} failed: ${technicalMessage}`);

      await progress.fail(userFacingError);
      return {
        success: false,
        error: userFacingError,
      };
    }
  },
};

/**
 * Execute image generation step using OpenAI SDK
 */
async function executeImageGenStep(params: {
  taskId: string;
  userId: string;
  step: StepConfigWithOptions;
  config: VintageTraceConfig;
  input: VintageTraceInput;
  apiKey: string;
  progress: ReturnType<typeof createProgressTracker>;
  toolSlug: string;
}): Promise<StepResult> {
  const { taskId, userId, step, config, input, apiKey, progress, toolSlug } = params;

  let providerRequest: Record<string, unknown> | undefined;
  let providerResponse: Record<string, unknown> | undefined;
  let providerMeta: Record<string, unknown> | undefined;

  try {
    // Get image URL - either directly provided or from storage key
    let sourceImageUrl = input.imageUrl;
    if (!sourceImageUrl && input.imageStorageKey) {
      sourceImageUrl = await getDownloadUrl(input.imageStorageKey);
    }

    // Get style reference by index
    if (input.styleReferenceId == null || input.styleReferenceId === '') {
      throw new TaskError(ERROR_CODES.TASK_INPUT_INVALID, 'Style selection is required');
    }

    // styleReferences and prompt are stored on the step config
    const imageGenStep = step as VintageTraceImageGenStep;
    const styleReferences = imageGenStep.styleReferences ?? [];
    const styleIndex = parseInt(input.styleReferenceId, 10);
    const style = styleReferences[styleIndex];
    if (!style) {
      throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `Style index ${styleIndex} not found in tool config (${styleReferences.length} styles available)`);
    }

    // Resolve prompt: style-level overrides step-level
    const prompt = style.prompt || imageGenStep.prompt;
    if (!prompt) {
      throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'No prompt configured (neither style-level nor step-level)');
    }

    // Determine whether to include the style image in the API call
    const shouldUseStyleImage = style.useStyleImage !== false;

    // Validate style has an image URL when we need to send it
    if (sourceImageUrl && shouldUseStyleImage && !style.imageUrl) {
      throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `Style ${styleIndex} is missing a reference image (imageUrl)`);
    }

    await progress.updateProgress(20, 'Initializing OpenAI client');

    // Initialize OpenAI SDK
    const openai = new OpenAI({ apiKey });

    // Get merged provider options (providerOptions + customProviderOptions)
    const mergedOptions = getMergedProviderOptions(step);
    const configuredSize = (mergedOptions.size as string) || (mergedOptions.imageGenSize as string) || 'auto';
    const model = getProviderModel(step);

    providerMeta = { provider: 'openai', model, stepId: step.id };

    let resultImageUrl: string;

    if (sourceImageUrl) {
      // Image edit mode - transform existing image, optionally with style reference
      const imageFiles: File[] = [];

      if (shouldUseStyleImage) {
        await progress.updateProgress(25, 'Fetching style reference image');

        // Style images are in the public bucket (uploaded by admin with visibility: 'public')
        const styleImageUrl = getPublicCdnUrl(style.imageUrl);
        const styleImageResponse = await fetch(styleImageUrl);
        if (!styleImageResponse.ok) {
          throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, `Failed to fetch style reference image: ${styleImageResponse.status}`);
        }
        const styleImageBlob = await styleImageResponse.blob();
        imageFiles.push(new File([styleImageBlob], 'style.png', { type: 'image/png' }));
      }

      await progress.updateProgress(35, 'Fetching source image');

      // Fetch user uploaded image
      const userImageResponse = await fetch(sourceImageUrl);
      if (!userImageResponse.ok) {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, `Failed to fetch source image: ${userImageResponse.status}`);
      }
      const userImageBlob = await userImageResponse.blob();
      const userImageFile = new File([userImageBlob], 'source.png', { type: 'image/png' });

      if (shouldUseStyleImage) {
        // Style image first (higher fidelity), user image second
        imageFiles.push(userImageFile);
      }

      await progress.updateProgress(50, 'Sending to OpenAI for style transfer');

      // Image edit has more limited size options - map to valid sizes
      const editSize = (['256x256', '512x512', '1024x1024', '1536x1024', '1024x1536', 'auto'].includes(configuredSize)
        ? configuredSize
        : '1024x1024') as OpenAIEditSize;

      providerRequest = { method: 'images.edit', model, prompt, n: 1, size: editSize, imageCount: imageFiles.length || 1, useStyleImage: shouldUseStyleImage };

      // Pass image(s): array when using style image, single file when prompt-only
      const response = await openai.images.edit({
        model,
        image: shouldUseStyleImage ? imageFiles : userImageFile,
        prompt,
        n: 1,
        size: editSize,
      });

      providerResponse = { data: response.data?.map(d => ({ url: d.url ? '[url]' : undefined, b64_json: d.b64_json ? '[base64]' : undefined, revised_prompt: d.revised_prompt })) };

      const imageData = response.data?.[0];
      if (!imageData?.url && !imageData?.b64_json) {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No image returned from OpenAI');
      }

      // Handle both URL and base64 responses
      if (imageData.url) {
        resultImageUrl = imageData.url;
      } else if (imageData.b64_json) {
        // If base64, we'll need to convert it to a data URL for upload
        resultImageUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No image data in OpenAI response');
      }
    } else {
      // Text-to-image generation mode (no source image)
      await progress.updateProgress(40, 'Generating image from prompt');

      const generateSize = configuredSize as OpenAIGenerateSize;

      providerRequest = { method: 'images.generate', model, prompt, n: 1, size: generateSize };

      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size: generateSize,
      });

      providerResponse = { data: response.data?.map(d => ({ url: d.url ? '[url]' : undefined, b64_json: d.b64_json ? '[base64]' : undefined, revised_prompt: d.revised_prompt })) };

      const imageData = response.data?.[0];
      if (!imageData?.url && !imageData?.b64_json) {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No image returned from OpenAI');
      }

      if (imageData.url) {
        resultImageUrl = imageData.url;
      } else if (imageData.b64_json) {
        resultImageUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No image data in OpenAI response');
      }
    }

    await progress.updateProgress(80, 'Processing result');
    await progress.updateProgress(90, 'Saving generated image');

    // Upload to S3
    const asset = await uploadFromUrl({
      url: resultImageUrl,
      userId,
      module: toolSlug,
      taskId,
      filename: `${toolSlug}_image_${Date.now()}.png`,
    });

    await progress.updateProgress(100, 'Image generation complete');
    await progress.completeStep({ assetId: asset.id });

    return {
      success: true,
      assetId: asset.id,
      output: {
        stepId: step.id,
        assetId: asset.id,
        storageKey: asset.storageKey,
        styleIndex,
        canGenerate3D: false,
      },
      providerRequest,
      providerResponse,
      providerMeta,
    };
  } catch (error) {
    if (isProvider429Error(error)) throw error;

    const userFacingError = error instanceof TaskError
      ? error.code
      : ERROR_CODES.TASK_PROCESSING_FAILED;
    const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[vintage-trace] image-gen task ${taskId} failed: ${technicalMessage}`);

    await progress.fail(userFacingError);
    return {
      success: false,
      error: userFacingError,
      providerRequest,
      providerResponse,
      providerMeta,
    };
  }
}
