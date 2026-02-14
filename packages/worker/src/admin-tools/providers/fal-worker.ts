import { fal } from '@fal-ai/client';
import type {
  AdminProviderWorker,
  AdminWorkerContext,
  AdminToolResult,
  GeneratedImage,
} from '../types';
import {
  getPresignedUrl,
  createProgressTracker,
} from '../utils';
import { uploadFromUrlAdmin } from '../../lib/storage';
import { ASSET_MODULE } from '@funmagic/shared';

/**
 * Fal.ai Provider Worker
 * Supports utility capabilities like background removal
 * Uses Fal.ai REST API with polling
 */
export const falWorker: AdminProviderWorker = {
  provider: 'fal',
  capabilities: ['utility'],

  async execute(context: AdminWorkerContext): Promise<AdminToolResult> {
    const { input, adminId, messageId, apiKey } = context;
    const progress = createProgressTracker(context);

    try {
      const quotedImages = input.quotedImages;

      if (!quotedImages || quotedImages.length === 0) {
        throw new Error('At least one image is required for background removal');
      }

      console.log(`[Fal Worker] Executing background removal: images=${quotedImages.length}`);

      // Configure Fal.ai client with API key from database
      fal.config({ credentials: apiKey });

      const images: GeneratedImage[] = [];

      // Process each image
      for (let i = 0; i < quotedImages.length; i++) {
        const img = quotedImages[i];
        const imageUrl = await getPresignedUrl(img);

        console.log(`[Fal Worker] Processing image ${i + 1}/${quotedImages.length}`);

        // Call Fal.ai RMBG
        const result = await fal.subscribe('fal-ai/bria/background/remove', {
          input: { image_url: imageUrl },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === 'IN_PROGRESS') {
              const logsCount = update.logs?.length ?? 0;
              console.log(`[Fal Worker] Background remove progress: ${logsCount} logs`);
            }
          },
        }) as { data: { image: { url: string } } };

        if (!result.data?.image?.url) {
          throw new Error('No image URL in fal.ai response');
        }

        // Upload result to S3 with asset record
        const asset = await uploadFromUrlAdmin({
          url: result.data.image.url,
          userId: adminId,
          module: ASSET_MODULE.AI_STUDIO,
          taskId: messageId, // Use messageId as the task reference
          filename: `bg_removed_${Date.now()}_${i}.png`,
        });

        // Return only storageKey - URL is generated on-demand
        images.push({
          storageKey: asset.storageKey,
          type: 'generated',
        });

        await progress.imageDone(i, asset.storageKey);
      }

      await progress.complete(images);

      // Fal.ai doesn't support multi-turn, so no session data
      return {
        success: true,
        images,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Fal Worker] Failed:`, errorMessage);
      await progress.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
