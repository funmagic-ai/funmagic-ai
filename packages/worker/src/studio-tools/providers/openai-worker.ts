import OpenAI from 'openai';
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
  uploadBase64Image,
  createProgressTracker,
} from '../utils';

const log = createLogger('OpenAIWorker');

/**
 * OpenAI Provider Worker
 * Supports text-to-image and image-to-image with multi-turn conversations
 * Uses Responses API with image_generation tool and streaming
 */
export const openaiWorker: StudioProviderWorker = {
  provider: 'openai',
  capabilities: ['chat-image'],

  async execute(context: StudioWorkerContext): Promise<StudioResult> {
    const { model, input, session, apiKey, messageId } = context;
    const progress = createProgressTracker(context);
    const taskLog = log.child({ messageId });

    try {
      const openai = new OpenAI({ apiKey });
      const hasImages = input.quotedImages && input.quotedImages.length > 0;

      taskLog.info({ model, hasImages }, 'Executing with streaming');

      // Build input content
      const content: Array<{ type: string; text?: string; image_url?: string }> = [];

      // Add prompt text
      if (input.prompt) {
        content.push({ type: 'input_text', text: input.prompt });
      }

      // Add quoted images as base64 data URIs (providers can't access local/presigned URLs)
      if (hasImages) {
        for (const img of input.quotedImages!) {
          const dataUri = await fetchImageAsDataUri(img);
          content.push({
            type: 'input_image',
            image_url: dataUri,
          });
        }
      }

      // Get OpenAI-specific options
      const openaiOptions = input.options?.openai || {};

      // Build image_generation tool config with options
      const imageGenConfig: Record<string, unknown> = {
        type: 'image_generation',
        model: openaiOptions.imageModel || 'gpt-image-1.5',
      };

      if (openaiOptions.size) {
        imageGenConfig.size = openaiOptions.size;
      }
      if (openaiOptions.quality) {
        imageGenConfig.quality = openaiOptions.quality;
      }
      if (openaiOptions.format) {
        imageGenConfig.output_format = openaiOptions.format;
      }
      if (openaiOptions.background) {
        imageGenConfig.background = openaiOptions.background;
      }

      taskLog.debug({ imageGenConfig }, 'Image options');

      const orchestratorModel = model || 'gpt-5-mini';

      // Build API request for streaming
      const requestParams: Record<string, unknown> = {
        model: orchestratorModel,
        input: hasImages || content.length > 1
          ? [{ role: 'user', content }]
          : input.prompt,
        tools: [imageGenConfig as { type: 'image_generation' }],
      };

      // Multi-turn: continue from previous response
      if (session?.openaiResponseId) {
        requestParams.previous_response_id = session.openaiResponseId;
        taskLog.info({ previousResponseId: session.openaiResponseId }, 'Continuing conversation');
      }

      // Capture raw request for debugging
      const startTime = Date.now();
      const rawRequest: StudioRawRequest = {
        url: 'https://api.openai.com/v1/responses',
        method: 'POST',
        body: requestParams,
        timestamp: new Date().toISOString(),
      };

      // Use the stream() method for proper async iteration
      const stream = openai.responses.stream(requestParams as any);

      // Accumulate results from stream
      let fullText = '';
      let responseId = '';
      const images: GeneratedImage[] = [];
      let imageIndex = 0;

      taskLog.debug('Starting stream processing');

      // Process streaming events
      for await (const event of stream as AsyncIterable<any>) {
        const eventType = event.type;

        // Track response ID for multi-turn conversations
        if (eventType === 'response.created') {
          responseId = event.response?.id || '';
          taskLog.info({ responseId }, 'Stream started');
        }

        // Text token streaming - emit per-token for typewriter effect
        if (eventType === 'response.output_text.delta') {
          const token = event.delta || '';
          if (token) {
            fullText += token;
            await progress.textDelta(token);
          }
        }

        // Image generation completed - upload and notify
        if (eventType === 'response.output_item.done') {
          const item = event.item;
          if (item?.type === 'image_generation_call' && item.result) {
            taskLog.info({ imageIndex }, 'Image generation complete, uploading');
            const image = await uploadBase64Image(item.result, context, imageIndex, 'generated');
            images.push(image);
            await progress.imageDone(imageIndex, image.storageKey);
            imageIndex++;
          }
        }

        // Handle stream errors
        if (eventType === 'error') {
          const errorMsg = event.error?.message || 'Stream error';
          taskLog.error({ err: errorMsg }, 'Stream error');
          throw new Error(errorMsg);
        }

        // Response completed - log final state
        if (eventType === 'response.completed') {
          taskLog.info({ textLength: fullText.length, imageCount: images.length }, 'Stream completed');
        }
      }

      // Only error if BOTH image and text are empty
      if (images.length === 0 && !fullText) {
        taskLog.error('No content received from stream');
        throw new Error('No response from OpenAI (no image or text)');
      }

      // Send completion event
      await progress.complete(images, fullText || undefined);

      // Capture raw response for debugging
      const rawResponse: StudioRawResponse = {
        status: 200,
        body: {
          responseId,
          model: orchestratorModel,
          textLength: fullText.length,
          imageCount: images.length,
        },
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      // Return result with session data for multi-turn support
      return {
        success: true,
        images,
        text: fullText || undefined,
        session: { openaiResponseId: responseId },
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
