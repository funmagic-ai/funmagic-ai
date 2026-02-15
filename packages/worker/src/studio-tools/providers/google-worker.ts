import { GoogleGenAI, type Content, type Part } from '@google/genai';
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
            console.warn(`[Google Worker] Failed to fetch image for history: ${img.storageKey}`, e);
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
    const { projectId, model, input, apiKey } = context;
    const progress = createProgressTracker(context);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const hasImages = input.quotedImages && input.quotedImages.length > 0;

      if (!model) {
        throw new Error('Model is required for Google');
      }

      console.log(`[Google Worker] Executing with streaming: model=${model}, hasImages=${hasImages}`);

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

      console.log(`[Google Worker] Image config:`, JSON.stringify(config));

      // Reconstruct chat history from studioGenerations (avoids storing base64 in DB)
      const history = await buildGoogleHistory(projectId);
      if (history.length > 0) {
        console.log(`[Google Worker] Reconstructed chat history with ${history.length} messages`);
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

      console.log(`[Google Worker] Starting stream processing...`);

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

            console.log(`[Google Worker] Image received, uploading...`);
            const image = await uploadBase64Image(base64Data, context, imageIndex, 'generated');
            images.push(image);
            await progress.imageDone(imageIndex, image.storageKey);
            imageIndex++;
          }
        }
      }

      console.log(`[Google Worker] Stream completed. Text length: ${textContent.length}, Images: ${images.length}`);

      // Only error if BOTH image and text are empty
      if (images.length === 0 && !textContent) {
        throw new Error('No response from Google (no image or text)');
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
        console.log(`[Google Worker] Text-only response: ${textContent.slice(0, 100)}...`);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Google Worker] Failed:`, errorMessage);
      await progress.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
