import { fal } from '@fal-ai/client';
import Replicate from 'replicate';
import { ERROR_CODES } from '@funmagic/shared';
import { isProvider429Error } from '../lib/provider-errors';
import { TaskError } from '../lib/task-error';
import { db, tasks, providers } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import type { ToolWorker, WorkerContext, StepResult, StepConfig, ToolConfig } from '../types';
import { decryptCredentials } from '../lib/credentials';
import { uploadFromUrl, uploadBuffer, getDownloadUrl, getAssetDownloadUrl } from '../lib/storage';
import { createProgressTracker } from '../lib/progress';
import sharp from 'sharp';

/**
 * Crystal Memory Tool Config Structure (stored in tool.config)
 *
 * {
 *   "steps": [
 *     {
 *       "id": "background-remove",
 *       "name": "Remove Background",
 *       "provider": {
 *         "name": "fal",
 *         "model": "fal-ai/bria/background/remove",
 *         "providerOptions": { "sync_mode": false }
 *       },
 *       "cost": 5
 *     },
 *     {
 *       "id": "vggt",
 *       "name": "Generate Point Cloud",
 *       "provider": {
 *         "name": "replicate",
 *         "model": "vufinder/vggt-1b:...",
 *         "providerOptions": {
 *           "pcd_source": "point_head",
 *           "return_pcd": true,
 *           "output_image_size": 518,
 *           "scale_extent": 10
 *         }
 *       },
 *       "cost": 15
 *     }
 *   ]
 * }
 */

interface CrystalMemoryInput {
  imageUrl?: string;
  imageStorageKey?: string;
  parentTaskId?: string;
  sourceAssetId?: string;
}

interface VGGTOptions {
  pcdSource: string;
  returnPcd: boolean;
  outputImageSize: number;
  scaleExtent: number;
}

interface StepConfigWithProvider extends StepConfig {
  provider?: {
    name: string;
    model: string;
    providerOptions?: Record<string, unknown>;
    customProviderOptions?: Record<string, unknown>;
  };
}

function getProviderModel(step: StepConfigWithProvider): string {
  const model = step.provider?.model;
  if (!model) {
    throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `No model configured for step "${step.id}"`);
  }
  return model;
}

function getMergedProviderOptions(step: StepConfigWithProvider): Record<string, unknown> {
  return {
    ...(step.provider?.providerOptions ?? {}),
    ...(step.provider?.customProviderOptions ?? {}),
  };
}

interface CrystalMemoryConfig extends ToolConfig {
  steps: StepConfigWithProvider[];
}

interface VGGTOutput {
  txt: string;
  conf: number[];
}

interface FalResult {
  image: { url: string };
}

/**
 * Crystal Memory tool worker
 * Two-step tool: background-remove -> vggt
 */
export const crystalMemoryWorker: ToolWorker = {
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
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'Task or tool not found');
      }

      const config = task.tool.config as CrystalMemoryConfig;
      const crystalInput = input as CrystalMemoryInput;

      // Determine which step to execute
      const currentStepId = stepId || config.steps[0]?.id;
      if (!currentStepId) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'No steps configured for this tool');
      }

      // Find step config
      const stepConfig = config.steps.find(s => s.id === currentStepId);
      if (!stepConfig) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, `Step "${currentStepId}" not configured`);
      }

      // Get provider by name from step config
      const providerName = stepConfig.provider?.name;
      if (!providerName) {
        throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `No provider configured for step "${currentStepId}"`);
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

      const toolSlug = task.tool.slug;

      // Route by provider name to determine execution path
      if (providerName === 'fal') {
        return await executeBackgroundRemoveStep({
          taskId,
          userId,
          input: crystalInput,
          stepConfig,
          apiKey: credentials.apiKey,
          progress,
          toolSlug,
        });
      }

      if (providerName === 'replicate') {
        return await executeVGGTStep({
          taskId,
          userId,
          input: crystalInput,
          stepConfig,
          apiKey: credentials.apiKey,
          progress,
          toolSlug,
        });
      }

      throw new TaskError(ERROR_CODES.TASK_SERVICE_UNAVAILABLE, `Unsupported provider "${providerName}" for step "${currentStepId}"`);

    } catch (error) {
      // Rethrow 429 errors so the parent worker can reschedule via DelayedError
      if (isProvider429Error(error)) throw error;

      const userFacingError = error instanceof TaskError
        ? error.code
        : ERROR_CODES.TASK_PROCESSING_FAILED;
      const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`[crystal-memory] Task ${taskId} failed: ${technicalMessage}`);

      await progress.fail(userFacingError);
      return {
        success: false,
        error: userFacingError,
      };
    }
  },
};

/**
 * Execute background-remove step using FAL SDK
 */
async function executeBackgroundRemoveStep(params: {
  taskId: string;
  userId: string;
  input: CrystalMemoryInput;
  stepConfig: StepConfigWithProvider;
  apiKey: string;
  progress: ReturnType<typeof createProgressTracker>;
  toolSlug: string;
}): Promise<StepResult> {
  const { taskId, userId, input, stepConfig, apiKey, progress, toolSlug } = params;

  await progress.startStep(stepConfig.id, stepConfig.name || stepConfig.id);

  // Get image URL - either directly provided or from storage key
  let imageUrl = input.imageUrl;

  if (!imageUrl && input.imageStorageKey) {
    imageUrl = await getDownloadUrl(input.imageStorageKey);
  }

  if (!imageUrl) {
    throw new TaskError(ERROR_CODES.TASK_INPUT_INVALID, 'Image URL or storage key is required');
  }

  await progress.updateProgress(5, 'Preparing image');

  // Configure FAL client with API key
  fal.config({ credentials: apiKey });

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
  const modelId = getProviderModel(stepConfig);

  // Build provider request
  const providerInput = { image_url: falImageUrl };

  // Use fal.subscribe for async operation with progress updates
  const result = await fal.subscribe(modelId, {
    input: providerInput,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        const logsCount = update.logs?.length ?? 0;
        const progressPercent = Math.min(30 + logsCount * 10, 80);
        progress.updateProgress(progressPercent, 'Processing background removal...');
      }
    },
  }) as { data: FalResult; requestId?: string };

  if (!result.data?.image?.url) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No image URL in fal.ai response');
  }

  await progress.updateProgress(90, 'Saving result');

  // Upload to S3
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
    providerRequest: { model: modelId, input: providerInput },
    providerResponse: { data: result.data },
    providerMeta: { provider: 'fal', model: modelId, stepId: stepConfig.id, requestId: result.requestId },
  };
}

/**
 * Execute VGGT step using Replicate SDK
 */
async function executeVGGTStep(params: {
  taskId: string;
  userId: string;
  input: CrystalMemoryInput;
  stepConfig: StepConfigWithProvider;
  apiKey: string;
  progress: ReturnType<typeof createProgressTracker>;
  toolSlug: string;
}): Promise<StepResult> {
  const { taskId, userId, input, stepConfig, apiKey, progress, toolSlug } = params;

  await progress.startStep(stepConfig.id, stepConfig.name || stepConfig.id);

  // Resolve the bg-removed image URL from the asset saved in step 1
  if (!input.sourceAssetId) {
    throw new TaskError(ERROR_CODES.TASK_INPUT_INVALID, 'sourceAssetId is required for VGGT step');
  }
  const imageUrl = await getAssetDownloadUrl(input.sourceAssetId);

  // Get VGGT options from step provider options
  const providerOptions = getMergedProviderOptions(stepConfig);
  const vggtOptions: VGGTOptions = {
    pcdSource: (providerOptions.pcd_source as string) || (providerOptions.pcdSource as string) || 'point_head',
    returnPcd: (providerOptions.return_pcd as boolean) ?? (providerOptions.returnPcd as boolean) ?? true,
    outputImageSize: (providerOptions.output_image_size as number) || (providerOptions.outputImageSize as number) || 518,
    scaleExtent: (providerOptions.scale_extent as number) || (providerOptions.scaleExtent as number) || 10,
  };

  await progress.updateProgress(5, 'Preparing image for VGGT');

  // Fetch image and convert to base64 data URI (like Python reference)
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, `Failed to fetch image: ${imageResponse.status}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/png';
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  const imageDataUri = `data:${contentType};base64,${base64Image}`;

  await progress.updateProgress(10, 'Initializing Replicate client');

  // Initialize Replicate SDK
  const replicate = new Replicate({ auth: apiKey });

  // Get model from step config
  const modelId = getProviderModel(stepConfig);

  await progress.updateProgress(15, 'Calling VGGT API');

  // Build provider request
  const replicateInput = {
    images: [imageDataUri],
    pcd_source: vggtOptions.pcdSource,
    return_pcd: vggtOptions.returnPcd,
  };

  // Run VGGT prediction using Replicate SDK - it handles polling automatically
  const output = await replicate.run(modelId as `${string}/${string}:${string}`, {
    input: replicateInput,
  }) as {
    data?: string[];
  };

  await progress.updateProgress(70, 'Processing VGGT output');

  if (!output.data || output.data.length === 0) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No data in VGGT output');
  }

  // Fetch the data JSON file (contains world_points and world_points_conf)
  const dataResponse = await fetch(output.data[0]);
  if (!dataResponse.ok) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'Failed to fetch VGGT data file');
  }
  const vggtData = await dataResponse.json() as {
    world_points?: number[][][];
    world_points_conf?: number[][];
  };

  if (!vggtData.world_points) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No world_points in VGGT data');
  }

  const worldPoints = vggtData.world_points;
  const confidence = vggtData.world_points_conf ?? [];

  await progress.updateProgress(85, 'Processing point cloud data');

  // Reshape points from (H, W, 3) to (N, 3)
  const { points: rawPoints, height, width } = reshapePoints(worldPoints);

  // Rotate 180 degrees around Y axis
  const rotatedPoints = rotateAroundZ(rawPoints);

  // Center and scale to [-extent, extent]
  const scaledPoints = centerAndScale(rotatedPoints, vggtOptions.scaleExtent);

  await progress.updateProgress(90, 'Extracting colors');

  // Extract colors from source image
  const colors = await extractColorsWithSharp({
    imageUrl,
    height,
    width,
    outputSize: vggtOptions.outputImageSize,
  });

  // Flatten confidence
  const flatConfidence = flattenConfidence(confidence);

  await progress.updateProgress(95, 'Generating output');

  // Generate output
  const outputData = generateOutput({
    points: scaledPoints,
    colors,
    confidence: flatConfidence,
  });

  // Save output as JSON
  const outputJson = JSON.stringify(outputData);
  const asset = await uploadBuffer({
    buffer: Buffer.from(outputJson, 'utf-8'),
    userId,
    module: toolSlug,
    taskId,
    filename: `point_cloud_${Date.now()}.json`,
    contentType: 'application/json',
  });

  await progress.updateProgress(100, 'Complete');
  await progress.completeStep({ assetId: asset.id });

  return {
    success: true,
    assetId: asset.id,
    output: {
      assetId: asset.id,
      storageKey: asset.storageKey,
      pointCount: scaledPoints.length,
      dimensions: { height, width },
    },
    providerRequest: { model: modelId, input: { ...replicateInput, images: ['[data_uri]'] } },
    providerResponse: { data: output.data },
    providerMeta: { provider: 'replicate', model: modelId, stepId: stepConfig.id },
  };
}

/**
 * Reshape world_points from (H, W, 3) to (N, 3) flat array
 */
function reshapePoints(worldPoints: number[][][]): { points: number[][]; height: number; width: number } {
  // Validate input array
  if (!Array.isArray(worldPoints) || worldPoints.length === 0) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'Invalid world_points: array is empty or not an array');
  }

  const height = worldPoints.length;
  const width = worldPoints[0]?.length;

  if (!width || width === 0) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'Invalid world_points: first row is empty');
  }

  const points: number[][] = [];

  for (let y = 0; y < height; y++) {
    const row = worldPoints[y];
    if (!row) continue;

    for (let x = 0; x < width; x++) {
      const point = row[x];
      if (point && point.length === 3) {
        points.push([point[0], point[1], point[2]]);
      }
    }
  }

  if (points.length === 0) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'Invalid world_points: no valid 3D points found');
  }

  return { points, height, width };
}

/**
 * Rotate points 180 degrees around Z axis (matches Python reference)
 * Transform: (x, y, z) → (-x, -y, z)
 */
function rotateAroundZ(points: number[][]): number[][] {
  return points.map(([x, y, z]) => [-x, -y, z]);
}

/**
 * Center and scale points to [-extent, extent] range
 */
function centerAndScale(points: number[][], extent: number): number[][] {
  if (points.length === 0) return points;

  // Find bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const [x, y, z] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  // Center
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Scale to fit in [-extent, extent]
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const rangeZ = maxZ - minZ;
  const maxRange = Math.max(rangeX, rangeY, rangeZ);
  const scale = maxRange > 0 ? (2 * extent) / maxRange : 1;

  return points.map(([x, y, z]) => [
    (x - centerX) * scale,
    (y - centerY) * scale,
    (z - centerZ) * scale,
  ]);
}

/**
 * Extract colors from image for each point using Sharp
 */
async function extractColorsWithSharp(params: {
  imageUrl: string;
  height: number;
  width: number;
  outputSize: number;
}): Promise<{ r: number; g: number; b: number }[]> {
  const { imageUrl, height, width, outputSize } = params;

  // Fetch and resize image
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'Failed to fetch image for color extraction');
  }

  const imageBuffer = await response.arrayBuffer();

  // Resize to output size and get raw pixel data
  const { data, info } = await sharp(Buffer.from(imageBuffer))
    .resize(outputSize, outputSize, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const colors: { r: number; g: number; b: number }[] = [];

  // Map each point to its color
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Map point coordinates to image coordinates with bounds clamping
      const imgX = Math.min(Math.floor((x / width) * info.width), info.width - 1);
      const imgY = Math.min(Math.floor((y / height) * info.height), info.height - 1);

      const pixelIndex = (imgY * info.width + imgX) * 3;

      // Validate pixel index is within bounds
      if (pixelIndex >= 0 && pixelIndex + 2 < data.length) {
        colors.push({
          r: data[pixelIndex]!,
          g: data[pixelIndex + 1]!,
          b: data[pixelIndex + 2]!,
        });
      } else {
        // Fallback for out-of-bounds (should not happen with clamping)
        colors.push({ r: 0, g: 0, b: 0 });
      }
    }
  }

  return colors;
}

/**
 * Flatten confidence from (H, W) to (N,) array
 */
function flattenConfidence(confidence: number[][]): number[] {
  const flat: number[] = [];
  for (const row of confidence) {
    for (const val of row) {
      flat.push(val);
    }
  }
  return flat;
}

/**
 * Generate output CSV string and confidence array
 */
function generateOutput(params: {
  points: number[][];
  colors: { r: number; g: number; b: number }[];
  confidence: number[];
}): VGGTOutput {
  const { points, colors, confidence } = params;

  const lines: string[] = [];

  for (let i = 0; i < points.length; i++) {
    const [x, y, z] = points[i];
    const color = colors[i] || { r: 0, g: 0, b: 0 };

    // Format: id,x,y,z,r,g,b
    lines.push(
      `${i + 1},${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)},${color.r},${color.g},${color.b}`
    );
  }

  return {
    txt: lines.join('\n'),
    conf: confidence,
  };
}
