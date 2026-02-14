import OpenAI from 'openai';
import { Magi3DClient, TripoProvider, TaskType, type TripoOptions } from 'magi-3d/server';
import { db, tasks, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import type { ToolWorker, WorkerContext, StepResult, StepConfig, ToolConfig } from '../types';
import { decryptCredentials } from '../lib/credentials';
import { uploadFromUrl, getDownloadUrl } from '../lib/storage';
import { createProgressTracker } from '../lib/progress';

/**
 * FigMe Tool Config Structure (stored in tool.config)
 *
 * Admin defines:
 * - Steps with provider links and costs
 * - Style references with prompts (up to 8 images)
 * - Each style has a name, thumbnail, and AI prompt
 *
 * {
 *   "steps": [
 *     {
 *       "id": "image-gen",
 *       "name": "Image Generation",
 *       "provider": {
 *         "name": "openai",
 *         "model": "gpt-image-1",
 *         "providerOptions": { "size": "1024x1024" }
 *       },
 *       "cost": 20
 *     },
 *     {
 *       "id": "3d-gen",
 *       "name": "3D Generation",
 *       "provider": {
 *         "name": "tripo",
 *         "model": "v2.0-20240919"
 *       },
 *       "cost": 30
 *     }
 *   ],
 *   "styleReferences": [
 *     {
 *       "id": "style-1",
 *       "name": "Anime",
 *       "imageUrl": "https://...",
 *       "prompt": "Transform this image into anime style..."
 *     }
 *   ]
 * }
 */

interface FigmeInput {
  // Step 1 (Image Generation)
  styleReferenceId?: string;  // Required for step 1 - user must select a style
  imageUrl?: string;  // User uploaded image URL (direct URL)
  imageStorageKey?: string;  // User uploaded image storage key (S3 key)
  assetId?: string;   // User uploaded asset ID

  // Step 2 (3D Generation) - only when stepId is '3d-gen'
  parentTaskId?: string;  // Reference to step 1 task
  sourceImageUrl?: string;  // Image from step 1
}

interface StyleReference {
  id: string;
  name: string;
  imageUrl: string;  // Thumbnail shown to user
  prompt: string;    // AI prompt defined by admin
}

interface StepConfigWithOptions extends StepConfig {
  provider?: {
    name: string;
    model: string;
    providerOptions?: Record<string, unknown>;
    customProviderOptions?: Record<string, unknown>;
  };
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
    throw new Error(`No model configured for step "${step.id}"`);
  }
  return model;
}

interface FigmeConfig extends ToolConfig {
  steps: StepConfigWithOptions[];
  styleReferences?: StyleReference[];
  maxStyleReferences?: number;
  defaultPrompt?: string;  // Fallback prompt if style doesn't have one
}

// OpenAI image generation supports these sizes
type OpenAIGenerateSize = '1024x1024' | '1536x1024' | '1024x1536' | '1792x1024' | '1024x1792' | 'auto';
// OpenAI image edit supports a more limited set
type OpenAIEditSize = '256x256' | '512x512' | '1024x1024' | '1536x1024' | '1024x1536' | 'auto';

/**
 * FigMe tool worker
 * Handles both image generation (step 1) and 3D generation (step 2)
 */
export const figmeWorker: ToolWorker = {
  async execute(context: WorkerContext): Promise<StepResult> {
    const { taskId, stepId, userId, input, redis } = context;
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

      const config = task.tool.config as FigmeConfig;
      const figmeInput = input as FigmeInput;

      // Determine which step to execute
      const currentStepId = stepId || config.steps[0]?.id;
      if (!currentStepId) {
        throw new Error('No steps configured for this tool');
      }

      const step = config.steps.find(s => s.id === currentStepId);

      if (!step) {
        throw new Error(`Step "${currentStepId}" not found in tool config`);
      }

      // Get provider by name from step config
      const providerName = step.provider?.name;
      if (!providerName) {
        throw new Error(`No provider configured for step "${step.name}"`);
      }

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

      await progress.startStep(currentStepId, step.name || currentStepId);

      const toolSlug = task.tool.slug;

      // Route by provider name to determine execution path
      if (providerName === 'openai') {
        return await executeImageGenStep({
          taskId,
          userId,
          step,
          config,
          input: figmeInput,
          apiKey: credentials.apiKey,
          progress,
          toolSlug,
        });
      } else if (providerName === 'tripo') {
        return await execute3DGenStep({
          taskId,
          userId,
          step,
          input: figmeInput,
          apiKey: credentials.apiKey,
          progress,
          toolSlug,
        });
      }

      throw new Error(`Unsupported provider "${providerName}" for step "${currentStepId}"`);

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

/**
 * Execute image generation step using OpenAI SDK
 */
async function executeImageGenStep(params: {
  taskId: string;
  userId: string;
  step: StepConfigWithOptions;
  config: FigmeConfig;
  input: FigmeInput;
  apiKey: string;
  progress: ReturnType<typeof createProgressTracker>;
  toolSlug: string;
}): Promise<StepResult> {
  const { taskId, userId, step, config, input, apiKey, progress, toolSlug } = params;

  // Get image URL - either directly provided or from storage key
  let sourceImageUrl = input.imageUrl;
  if (!sourceImageUrl && input.imageStorageKey) {
    sourceImageUrl = await getDownloadUrl(input.imageStorageKey);
  }

  // Get prompt from style reference (admin-defined)
  if (!input.styleReferenceId) {
    throw new Error('Style selection is required');
  }

  const style = config.styleReferences?.find(s => s.id === input.styleReferenceId);
  if (!style) {
    throw new Error(`Style "${input.styleReferenceId}" not found in tool config`);
  }

  // Validate style has an image URL for image edit mode
  if (sourceImageUrl && !style.imageUrl) {
    throw new Error(`Style "${style.name}" is missing a reference image (imageUrl)`);
  }

  // Use prompt from style, fallback to config default prompt
  const prompt = style.prompt || config.defaultPrompt;
  if (!prompt) {
    throw new Error(`No prompt configured for style "${style.name}" and no default prompt set`);
  }

  await progress.updateProgress(20, 'Initializing OpenAI client');

  // Initialize OpenAI SDK
  const openai = new OpenAI({ apiKey });

  // Get merged provider options (providerOptions + customProviderOptions)
  const mergedOptions = getMergedProviderOptions(step);
  const configuredSize = (mergedOptions.size as string) || (mergedOptions.imageGenSize as string) || 'auto';
  const model = getProviderModel(step);

  let resultImageUrl: string;

  let providerRequest: Record<string, unknown>;
  let providerResponse: Record<string, unknown>;

  if (sourceImageUrl) {
    // Image edit mode - transform existing image with style reference
    await progress.updateProgress(25, 'Fetching style reference image');

    // Fetch style reference image FIRST (for higher fidelity preservation)
    const styleImageResponse = await fetch(style.imageUrl);
    if (!styleImageResponse.ok) {
      throw new Error(`Failed to fetch style reference image: ${styleImageResponse.status}`);
    }
    const styleImageBlob = await styleImageResponse.blob();
    const styleImageFile = new File([styleImageBlob], 'style.png', { type: 'image/png' });

    await progress.updateProgress(35, 'Fetching source image');

    // Fetch user uploaded image SECOND
    const userImageResponse = await fetch(sourceImageUrl);
    if (!userImageResponse.ok) {
      throw new Error(`Failed to fetch source image: ${userImageResponse.status}`);
    }
    const userImageBlob = await userImageResponse.blob();
    const userImageFile = new File([userImageBlob], 'source.png', { type: 'image/png' });

    await progress.updateProgress(50, 'Sending to OpenAI for style transfer');

    // Image edit has more limited size options - map to valid sizes
    const editSize = (['256x256', '512x512', '1024x1024', '1536x1024', '1024x1536', 'auto'].includes(configuredSize)
      ? configuredSize
      : '1024x1024') as OpenAIEditSize;

    providerRequest = { method: 'images.edit', model, prompt, n: 1, size: editSize, imageCount: 2 };

    // Pass as array: style reference FIRST (higher fidelity), user image SECOND
    const response = await openai.images.edit({
      model,
      image: [styleImageFile, userImageFile],
      prompt,
      n: 1,
      size: editSize,
    });

    providerResponse = { data: response.data?.map(d => ({ url: d.url ? '[url]' : undefined, b64_json: d.b64_json ? '[base64]' : undefined, revised_prompt: d.revised_prompt })) };

    const imageData = response.data?.[0];
    if (!imageData?.url && !imageData?.b64_json) {
      throw new Error('No image returned from OpenAI');
    }

    // Handle both URL and base64 responses
    if (imageData.url) {
      resultImageUrl = imageData.url;
    } else if (imageData.b64_json) {
      // If base64, we'll need to convert it to a data URL for upload
      resultImageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else {
      throw new Error('No image data in OpenAI response');
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
      throw new Error('No image returned from OpenAI');
    }

    if (imageData.url) {
      resultImageUrl = imageData.url;
    } else if (imageData.b64_json) {
      resultImageUrl = `data:image/png;base64,${imageData.b64_json}`;
    } else {
      throw new Error('No image data in OpenAI response');
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
  await progress.completeStep({ assetId: asset.id, imageUrl: resultImageUrl });

  return {
    success: true,
    assetId: asset.id,
    output: {
      stepId: step.id,
      assetId: asset.id,
      storageKey: asset.storageKey,
      imageUrl: resultImageUrl,
      styleId: style.id,
      styleName: style.name,
      // Flag indicating 3D generation is available as next step
      canGenerate3D: config.steps.length > 1,
    },
    providerRequest,
    providerResponse,
    providerMeta: { provider: 'openai', model, stepId: step.id },
  };
}

/**
 * Execute 3D generation step using magi-3d SDK (Tripo provider)
 */
async function execute3DGenStep(params: {
  taskId: string;
  userId: string;
  step: StepConfigWithOptions;
  input: FigmeInput;
  apiKey: string;
  progress: ReturnType<typeof createProgressTracker>;
  toolSlug: string;
}): Promise<StepResult> {
  const { taskId, userId, step, input, apiKey, progress, toolSlug } = params;

  const sourceImageUrl = input.sourceImageUrl;

  if (!sourceImageUrl) {
    throw new Error('Source image URL is required for 3D generation');
  }

  await progress.updateProgress(10, 'Initializing 3D generation');

  // Create Tripo provider with API key
  const provider = new TripoProvider({ apiKey });
  const client = new Magi3DClient(provider);

  // Get model version from step config
  const modelVersion = getProviderModel(step);

  await progress.updateProgress(15, 'Creating 3D generation task');

  const tripoProviderOptions = {
    model_version: modelVersion as TripoOptions['model_version'],
    pbr: true,
  };

  // Create task using magi-3d SDK
  const tripoTaskId = await client.createTask({
    type: TaskType.IMAGE_TO_3D,
    input: sourceImageUrl,
    providerOptions: tripoProviderOptions,
  });

  await progress.updateProgress(20, 'Processing 3D model');

  // Poll until done with progress callback
  const result = await client.pollUntilDone(tripoTaskId, {
    interval: 3000,
    timeout: 600000, // 10 minutes max
    onProgress: (task) => {
      // Map task progress (0-100) to our progress range (20-90)
      const mappedProgress = 20 + Math.round((task.progress / 100) * 70);
      const detail = task.progressDetail || `Processing (${task.progress}%)`;
      progress.updateProgress(mappedProgress, detail);
    },
  });

  if (!result.result?.modelGlb) {
    throw new Error('No 3D model in Tripo response');
  }

  await progress.updateProgress(95, 'Saving 3D model');

  // Upload 3D model to S3
  const modelAsset = await uploadFromUrl({
    url: result.result.modelGlb,
    userId,
    module: toolSlug,
    taskId,
    filename: `${toolSlug}_3d_${Date.now()}.glb`,
  });

  // Upload preview if available
  let previewAsset;
  if (result.result.thumbnail) {
    previewAsset = await uploadFromUrl({
      url: result.result.thumbnail,
      userId,
      module: toolSlug,
      taskId,
      filename: `${toolSlug}_3d_preview_${Date.now()}.png`,
    });
  }

  await progress.updateProgress(100, '3D generation complete');
  await progress.completeStep({
    modelAssetId: modelAsset.id,
    previewAssetId: previewAsset?.id
  });

  return {
    success: true,
    assetId: modelAsset.id,
    output: {
      stepId: step.id,
      modelAssetId: modelAsset.id,
      modelStorageKey: modelAsset.storageKey,
      modelUrl: result.result.modelGlb,
      previewAssetId: previewAsset?.id,
      previewStorageKey: previewAsset?.storageKey,
      parentTaskId: input.parentTaskId,
    },
    providerRequest: { type: 'IMAGE_TO_3D', input: sourceImageUrl, providerOptions: tripoProviderOptions, tripoTaskId },
    providerResponse: { status: result.status, result: { modelGlb: result.result.modelGlb, thumbnail: result.result.thumbnail } },
    providerMeta: { provider: 'tripo', model: modelVersion, stepId: step.id, tripoTaskId },
  };
}
