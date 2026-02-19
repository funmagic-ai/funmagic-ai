import { GoogleGenAI, type Content, type Part } from '@google/genai';
import { isProvider429Error } from '../../lib/provider-errors';
import { TaskError } from '../../lib/task-error';
import { ERROR_CODES } from '@funmagic/shared';
import { createLogger } from '@funmagic/services';
import { db, studioGenerations } from '@funmagic/database';
import type { StudioImage } from '@funmagic/database';
import { eq, asc } from 'drizzle-orm';
import type {
  StudioProviderWorker,
  StudioWorkerContext,
  StudioResult,
  StudioRawRequest,
  StudioRawResponse,
  GeneratedImage,
} from '../types';
import {
  fetchImageAsBase64,
  uploadBase64Image,
  createProgressTracker,
} from '../utils';

const log = createLogger('GoogleWorker');

/**
 * Build Google chat history from studioGenerations table.
 * We reconstruct the history by fetching images from S3 on each turn.
 */
async function buildGoogleHistory(projectId: string): Promise<Content[]> {
  const generations = await db.query.studioGenerations.findMany({
    where: eq(studioGenerations.projectId, projectId),
    orderBy: asc(studioGenerations.createdAt),
  });

  const history: Content[] = [];

  for (const gen of generations) {
    // Only include completed generations in history
    if (gen.status !== 'completed') continue;

    const parts: Part[] = [];
    const isUser = gen.role === 'user';

    // Only include images for user turns in history.
    // Model-generated images require a thought_signature when replayed,
    // which we don't store. Since projects are now single-provider
    // (switching providers auto-creates a new project), model images
    // are always from Google itself and still can't be replayed without
    // the signature. The model follows context via its own text output.
    if (isUser) {
      const genImages = gen.images as StudioImage[] | null;
      if (genImages && genImages.length > 0) {
        for (const img of genImages) {
          try {
            const base64 = await fetchImageAsBase64({ url: img.storageKey, storageKey: img.storageKey });
            parts.push({
              inlineData: {
                mimeType: 'image/png',
                data: base64,
              },
            });
          } catch (e) {
            log.warn({ err: e, storageKey: img.storageKey }, 'Failed to fetch image for history');
          }
        }
      }
    }

    // Add text content
    if (gen.content) {
      parts.push({ text: gen.content });
    }

    // Only add to history if we have parts
    if (parts.length > 0) {
      history.push({
        role: isUser ? 'user' : 'model',
        parts,
      });
    }
  }

  return history;
}

/**
 * Google Provider Worker
 * Supports text-to-image and image-to-image with multi-turn conversations
 * Uses Google GenAI SDK with chat sessions and streaming
 */
export const googleWorker: StudioProviderWorker = {
  provider: 'google',
  capabilities: ['chat-image'],

  async execute(context: StudioWorkerContext): Promise<StudioResult> {
    const { projectId, model, input, apiKey, messageId } = context;
    const progress = createProgressTracker(context);
    const taskLog = log.child({ messageId });

    try {
      const ai = new GoogleGenAI({ apiKey });
      const hasImages = input.quotedImages && input.quotedImages.length > 0;

      if (!model) {
        throw new TaskError(ERROR_CODES.TASK_CONFIG_ERROR, 'Model is required for Google');
      }

      taskLog.info({ model, hasImages }, 'Executing with streaming');

      // Get Google-specific options
      const googleOptions = input.options?.google || {};

      // Build config with image generation options
      const config: {
        responseModalities: ('TEXT' | 'IMAGE')[];
        imageConfig?: { aspectRatio?: string; outputImageSize?: string };
      } = {
        responseModalities: ['TEXT', 'IMAGE'],
      };

      if (googleOptions.aspectRatio || googleOptions.imageSize) {
        config.imageConfig = {};
        if (googleOptions.aspectRatio) {
          config.imageConfig.aspectRatio = googleOptions.aspectRatio;
        }
        if (googleOptions.imageSize) {
          config.imageConfig.outputImageSize = googleOptions.imageSize;
        }
      }

      taskLog.debug({ config }, 'Image config');

      // Reconstruct chat history from studioGenerations (avoids storing base64 in DB)
      const history = await buildGoogleHistory(projectId);
      if (history.length > 0) {
        taskLog.info({ historyLength: history.length }, 'Reconstructed chat history');
      }

      const chat = ai.chats.create({
        model: model,
        config,
        history,
      });

      // Build message parts
      const messageParts: Part[] = [];

      // Add images first
      if (hasImages) {
        for (const img of input.quotedImages!) {
          const base64 = await fetchImageAsBase64(img);
          messageParts.push({
            inlineData: {
              mimeType: 'image/png',
              data: base64,
            },
          });
        }
      }

      // Add the prompt
      if (input.prompt) {
        messageParts.push({ text: input.prompt });
      }

      // Capture raw request for debugging (exclude base64 image data)
      const startTime = Date.now();
      const rawRequest: StudioRawRequest = {
        url: `https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent`,
        method: 'POST',
        body: {
          model,
          config,
          prompt: input.prompt,
          imageCount: hasImages ? input.quotedImages!.length : 0,
          historyLength: history.length,
        },
        timestamp: new Date().toISOString(),
      };

      // Use streaming for per-token text output
      const stream = await chat.sendMessageStream({ message: messageParts });

      // Process streaming response
      const images: GeneratedImage[] = [];
      let textContent = '';
      let imageIndex = 0;

      taskLog.debug('Starting stream processing');

      for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
          if (part.text) {
            // Stream text tokens for typewriter effect
            textContent += part.text;
            await progress.textDelta(part.text);
          } else if (part.inlineData) {
            // Images come as complete base64 data
            const base64Data = part.inlineData.data;
            if (!base64Data) continue;

            taskLog.info({ imageIndex }, 'Image received, uploading');
            const image = await uploadBase64Image(base64Data, context, imageIndex, 'generated');
            images.push(image);
            await progress.imageDone(imageIndex, image.storageKey);
            imageIndex++;
          }
        }
      }

      taskLog.info({ textLength: textContent.length, imageCount: images.length }, 'Stream completed');

      // Only error if BOTH image and text are empty
      if (images.length === 0 && !textContent) {
        throw new TaskError(ERROR_CODES.TASK_PROCESSING_FAILED, 'No response from Google (no image or text)');
      }

      // Capture raw response for debugging
      const rawResponse: StudioRawResponse = {
        status: 200,
        body: {
          model,
          textLength: textContent.length,
          imageCount: images.length,
        },
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      // If text only (no images), return text response
      if (images.length === 0) {
        taskLog.info({ textPreview: textContent.slice(0, 100) }, 'Text-only response');
        await progress.complete([], textContent);
        return {
          success: true,
          images: [],
          text: textContent,
          rawRequest,
          rawResponse,
        };
      }

      await progress.complete(images, textContent || undefined);

      return {
        success: true,
        images,
        text: textContent || undefined,
        rawRequest,
        rawResponse,
      };

    } catch (error) {
      // Rethrow 429 errors so the parent worker can reschedule via DelayedError
      if (isProvider429Error(error)) throw error;

      const userFacingError = error instanceof TaskError
        ? error.code
        : ERROR_CODES.TASK_PROCESSING_FAILED;
      const technicalMessage = error instanceof Error ? error.message : 'Unknown error';

      taskLog.error({ err: technicalMessage }, 'Failed');
      await progress.error(userFacingError);
      return {
        success: false,
        error: userFacingError,
      };
    }
  },
};
