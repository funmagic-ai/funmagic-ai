import { GoogleGenAI, type Content, type Part } from '@google/genai';
import { db, adminMessages } from '@funmagic/database';
import type { AdminMessageImage } from '@funmagic/database';
import { eq, asc } from 'drizzle-orm';
import type {
  AdminProviderWorker,
  AdminWorkerContext,
  AdminToolResult,
  GeneratedImage,
} from '../types';
import {
  fetchImageAsBase64,
  uploadBase64Image,
  createProgressTracker,
} from '../utils';

/**
 * Build Google chat history from adminMessages table.
 * We reconstruct the history by fetching images from S3 on each turn.
 */
async function buildGoogleHistory(chatId: string): Promise<Content[]> {
  const messages = await db.query.adminMessages.findMany({
    where: eq(adminMessages.chatId, chatId),
    orderBy: asc(adminMessages.createdAt),
  });

  const history: Content[] = [];

  for (const msg of messages) {
    // Only include completed messages in history
    if (msg.status !== 'completed') continue;

    const parts: Part[] = [];

    // Add images (fetch from S3 and convert to base64)
    const msgImages = msg.images as AdminMessageImage[] | null;
    if (msgImages && msgImages.length > 0) {
      for (const img of msgImages) {
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

    // Add text content
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    // Only add to history if we have parts
    if (parts.length > 0) {
      history.push({
        role: msg.role === 'user' ? 'user' : 'model',
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
export const googleWorker: AdminProviderWorker = {
  provider: 'google',
  capabilities: ['chat-image'],

  async execute(context: AdminWorkerContext): Promise<AdminToolResult> {
    const { chatId, model, input, apiKey } = context;
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

      // Reconstruct chat history from adminMessages (avoids storing base64 in DB)
      const history = await buildGoogleHistory(chatId);
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

      // If text only (no images), return text response
      if (images.length === 0) {
        console.log(`[Google Worker] Text-only response: ${textContent.slice(0, 100)}...`);
        await progress.complete([], textContent);
        return {
          success: true,
          images: [],
          text: textContent,
          // No session data needed - history is reconstructed from adminMessages
        };
      }

      await progress.complete(images, textContent || undefined);

      // Return result - no session data needed since history is reconstructed from adminMessages
      return {
        success: true,
        images,
        text: textContent || undefined,
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
