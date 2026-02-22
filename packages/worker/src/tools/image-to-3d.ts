import {
  Magi3DClient, TripoProvider, HunyuanProvider, TaskType,
  TaskError as Magi3DTaskError, ApiError as Magi3DApiError,
  type TripoOptions, type HunyuanOptions,
} from 'magi-3d/server';
import { ERROR_CODES } from '@funmagic/shared';
import { isProvider429Error } from '../lib/provider-errors';
import { TaskError } from '../lib/task-error';
import { db, tasks, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import type { ToolWorker, WorkerContext, StepResult, StepConfig, ToolConfig } from '../types';
import { decryptCredentials } from '../lib/credentials';
import { uploadFromUrl, getAssetDownloadUrl } from '../lib/storage';
import { createProgressTracker } from '../lib/progress';

/**
 * Image to 3D Tool
 *
 * Single-step tool that converts images to 3D models.
 * Supports runtime provider selection (Tripo or Hunyuan) via task input.
 *
 * Input shape:
 * {
 *   "sourceAssetId": "asset-id",        // Required: uploaded image asset
 *   "providerName": "tripo" | "hunyuan", // Optional: overrides step config default
 *   "providerOptions": { ... }           // Optional: provider-specific options
 * }
 */

interface ImageTo3dInput {
  sourceAssetId?: string;
  imageStorageKey?: string;
  providerName?: 'tripo' | 'hunyuan';
  providerOptions?: Record<string, unknown>;
}

interface StepConfigWithOptions extends StepConfig {
  provider?: {
    name: string;
    model: string;
    providerOptions?: Record<string, unknown>;
    customProviderOptions?: Record<string, unknown>;
  };
}

interface ImageTo3dConfig extends ToolConfig {
  steps: StepConfigWithOptions[];
}

function getProviderModel(step: StepConfigWithOptions): string {
  const model = step.provider?.model;
  if (!model) {
    throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `No model configured for step "${step.id}"`);
  }
  return model;
}

/**
 * Image to 3D tool worker
 * Routes to Tripo or Hunyuan based on input.providerName (falls back to step config default)
 */
export const imageTo3dWorker: ToolWorker = {
  async execute(context: WorkerContext): Promise<StepResult> {
    const { taskId, stepId, userId, input, redis } = context;
    const progress = createProgressTracker(redis, taskId, userId);

    try {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
        with: { tool: true },
      });

      if (!task || !task.tool) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'Task or tool not found');
      }

      const config = task.tool.config as ImageTo3dConfig;
      const toolInput = input as ImageTo3dInput;

      const currentStepId = stepId || config.steps[0]?.id;
      if (!currentStepId) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'No steps configured for this tool');
      }

      const step = config.steps.find(s => s.id === currentStepId);
      if (!step) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `Step "${currentStepId}" not found in tool config`);
      }

      // Provider selection: input overrides step config default
      const providerName = toolInput.providerName || step.provider?.name;
      if (!providerName) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, 'No provider specified');
      }

      // Look up provider credentials from database
      const allProviders = await db.query.providers.findMany();
      const provider = allProviders.find(
        (p) => p.name.toLowerCase() === providerName.toLowerCase() && p.isActive
      );

      if (!provider) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `Provider "${providerName}" not found or inactive`);
      }

      const credentials = decryptCredentials(provider);

      await progress.startStep(currentStepId, step.name || currentStepId);

      const toolSlug = task.tool.slug;

      if (providerName === 'tripo') {
        if (!credentials.apiKey) {
          throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `No API key configured for provider "${provider.displayName}"`);
        }
        return await executeTripo3D({
          taskId, userId, step, input: toolInput,
          apiKey: credentials.apiKey, progress, toolSlug,
        });
      } else if (providerName === 'hunyuan') {
        const secretId = credentials.apiKey;
        const secretKey = credentials.apiSecret;
        if (!secretId || !secretKey) {
          throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `Missing credentials for Hunyuan provider (requires apiKey and apiSecret)`);
        }
        return await executeHunyuan3D({
          taskId, userId, step, input: toolInput,
          secretId, secretKey, progress, toolSlug,
        });
      }

      throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `Unsupported provider "${providerName}"`);

    } catch (error) {
      if (isProvider429Error(error)) throw error;

      const userFacingError = error instanceof TaskError
        ? error.code
        : ERROR_CODES.TASK_PROCESSING_FAILED;
      const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`[image-to-3d] Task ${taskId} failed: ${technicalMessage}`);

      await progress.fail(userFacingError);
      return {
        success: false,
        error: userFacingError,
      };
    }
  },
};

/**
 * Execute 3D generation using Tripo provider
 */
async function executeTripo3D(params: {
  taskId: string;
  userId: string;
  step: StepConfigWithOptions;
  input: ImageTo3dInput;
  apiKey: string;
  progress: ReturnType<typeof createProgressTracker>;
  toolSlug: string;
}): Promise<StepResult> {
  const { taskId, userId, step, input, apiKey, progress, toolSlug } = params;

  let providerRequest: Record<string, unknown> | undefined;
  let providerMeta: Record<string, unknown> | undefined;

  try {
    if (!input.sourceAssetId) {
      throw new TaskError(ERROR_CODES.TASK_INPUT_INVALID, 'sourceAssetId is required for 3D generation');
    }
    const sourceImageUrl = await getAssetDownloadUrl(input.sourceAssetId);

    await progress.updateProgress(10, 'Initializing 3D generation');

    const provider = new TripoProvider({ apiKey, stsUpload: true });
    const client = new Magi3DClient(provider);

    // Merge options: step config model -> user overrides
    const modelVersion = (input.providerOptions?.model_version as string) || getProviderModel(step);
    const tripoOptions: TripoOptions = {
      model_version: modelVersion as TripoOptions['model_version'],
      pbr: (input.providerOptions?.pbr as boolean) ?? true,
    };

    if (input.providerOptions?.face_limit != null) {
      tripoOptions.face_limit = input.providerOptions.face_limit as number;
    }

    await progress.updateProgress(15, 'Creating 3D generation task');

    providerRequest = { type: 'IMAGE_TO_3D', input: sourceImageUrl, providerOptions: tripoOptions };
    providerMeta = { provider: 'tripo', model: modelVersion, stepId: step.id };

    const tripoTaskId = await client.createTask({
      type: TaskType.IMAGE_TO_3D,
      input: sourceImageUrl,
      providerOptions: tripoOptions,
    });

    providerRequest.tripoTaskId = tripoTaskId;
    providerMeta.tripoTaskId = tripoTaskId;

    await progress.updateProgress(20, 'Processing 3D model');

    const result = await client.pollUntilDone(tripoTaskId, {
      interval: 3000,
      timeout: 600000,
      onProgress: (task) => {
        const mappedProgress = 20 + Math.round((task.progress / 100) * 70);
        const detail = task.progressDetail || `Processing (${task.progress}%)`;
        progress.updateProgress(mappedProgress, detail);
      },
    });

    if (!result.result?.modelGlb) {
      throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No 3D model in Tripo response');
    }

    await progress.updateProgress(95, 'Saving 3D model');

    const modelAsset = await uploadFromUrl({
      url: result.result.modelGlb,
      userId,
      module: toolSlug,
      taskId,
      filename: `${toolSlug}_3d_${Date.now()}.glb`,
    });

    let previewAsset;
    if (result.result?.thumbnail) {
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
      previewAssetId: previewAsset?.id,
    });

    return {
      success: true,
      assetId: modelAsset.id,
      output: {
        stepId: step.id,
        modelAssetId: modelAsset.id,
        modelStorageKey: modelAsset.storageKey,
        previewAssetId: previewAsset?.id,
        previewStorageKey: previewAsset?.storageKey,
      },
      providerRequest,
      providerResponse: { status: result.status, result: result.result },
      providerMeta,
    };
  } catch (error) {
    if (isProvider429Error(error)) throw error;

    const userFacingError = error instanceof TaskError
      ? error.code
      : ERROR_CODES.TASK_PROCESSING_FAILED;
    const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[image-to-3d] tripo task ${taskId} failed: ${technicalMessage}`);

    let providerResponse: Record<string, unknown> | undefined;
    if (error instanceof Magi3DTaskError) {
      providerResponse = {
        errorCode: error.code,
        taskStatus: error.task?.status,
        taskError: error.task?.error,
      };
    } else if (error instanceof Magi3DApiError) {
      providerResponse = {
        errorCode: error.code,
        httpStatus: error.httpStatus,
        raw: error.raw,
      };
    }

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

/**
 * Execute 3D generation using Hunyuan (Tencent Cloud) provider
 */
async function executeHunyuan3D(params: {
  taskId: string;
  userId: string;
  step: StepConfigWithOptions;
  input: ImageTo3dInput;
  secretId: string;
  secretKey: string;
  progress: ReturnType<typeof createProgressTracker>;
  toolSlug: string;
}): Promise<StepResult> {
  const { taskId, userId, step, input, secretId, secretKey, progress, toolSlug } = params;

  let providerRequest: Record<string, unknown> | undefined;
  let providerMeta: Record<string, unknown> | undefined;

  try {
    if (!input.sourceAssetId) {
      throw new TaskError(ERROR_CODES.TASK_INPUT_INVALID, 'sourceAssetId is required for 3D generation');
    }
    const sourceImageUrl = await getAssetDownloadUrl(input.sourceAssetId);

    await progress.updateProgress(10, 'Initializing Hunyuan 3D generation');

    const provider = new HunyuanProvider({
      secretId,
      secretKey,
      region: 'ap-guangzhou',
    });
    const client = new Magi3DClient(provider);

    const hunyuanOptions: Record<string, unknown> = {
      EnablePBR: (input.providerOptions?.EnablePBR as boolean) ?? false,
    };

    if (input.providerOptions?.FaceCount != null) {
      hunyuanOptions.FaceCount = input.providerOptions.FaceCount;
    }
    if (input.providerOptions?.GenerateType != null) {
      hunyuanOptions.GenerateType = input.providerOptions.GenerateType;
    }

    await progress.updateProgress(15, 'Creating Hunyuan 3D task');

    providerRequest = { type: 'IMAGE_TO_3D', input: sourceImageUrl, providerOptions: hunyuanOptions };
    providerMeta = { provider: 'hunyuan', stepId: step.id };

    const hunyuanTaskId = await client.createTask({
      type: TaskType.IMAGE_TO_3D,
      input: sourceImageUrl,
      providerOptions: hunyuanOptions as HunyuanOptions,
    });

    providerRequest.hunyuanTaskId = hunyuanTaskId;
    providerMeta.hunyuanTaskId = hunyuanTaskId;

    await progress.updateProgress(20, 'Processing 3D model');

    const result = await client.pollUntilDone(hunyuanTaskId, {
      interval: 5000,
      timeout: 600000,
      onProgress: (task) => {
        const mappedProgress = 20 + Math.round((task.progress / 100) * 70);
        const detail = task.progressDetail || `Processing (${task.progress}%)`;
        progress.updateProgress(mappedProgress, detail);
      },
    });

    // Hunyuan returns model URL in result.model or result.modelGlb
    const modelUrl = result.result?.modelGlb || result.result?.model;
    if (!modelUrl) {
      throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No 3D model in Hunyuan response');
    }

    await progress.updateProgress(95, 'Saving 3D model');

    const modelAsset = await uploadFromUrl({
      url: modelUrl,
      userId,
      module: toolSlug,
      taskId,
      filename: `${toolSlug}_3d_${Date.now()}.glb`,
    });

    let previewAsset;
    if (result.result?.thumbnail) {
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
      previewAssetId: previewAsset?.id,
    });

    return {
      success: true,
      assetId: modelAsset.id,
      output: {
        stepId: step.id,
        modelAssetId: modelAsset.id,
        modelStorageKey: modelAsset.storageKey,
        previewAssetId: previewAsset?.id,
        previewStorageKey: previewAsset?.storageKey,
      },
      providerRequest,
      providerResponse: { status: result.status, result: result.result },
      providerMeta,
    };
  } catch (error) {
    if (isProvider429Error(error)) throw error;

    const userFacingError = error instanceof TaskError
      ? error.code
      : ERROR_CODES.TASK_PROCESSING_FAILED;
    const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

    console.error(`[image-to-3d] hunyuan task ${taskId} failed: ${technicalMessage}`);

    let providerResponse: Record<string, unknown> | undefined;
    if (error instanceof Magi3DTaskError) {
      providerResponse = {
        errorCode: error.code,
        taskStatus: error.task?.status,
        taskError: error.task?.error,
      };
    } else if (error instanceof Magi3DApiError) {
      providerResponse = {
        errorCode: error.code,
        httpStatus: error.httpStatus,
        raw: error.raw,
      };
    }

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
