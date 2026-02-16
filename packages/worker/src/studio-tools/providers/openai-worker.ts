import OpenAI from 'openai';
import { isProvider429Error } from '../../lib/provider-errors';
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

/**
 * OpenAI Provider Worker
 * Supports text-to-image and image-to-image with multi-turn conversations
 * Uses Responses API with image_generation tool and streaming
 */
export const openaiWorker: StudioProviderWorker = {
  provider: 'openai',
  capabilities: ['chat-image'],

  async execute(context: StudioWorkerContext): Promise<StudioResult> {
    const { model, input, session, apiKey } = context;
    const progress = createProgressTracker(context);

    try {
      const openai = new OpenAI({ apiKey });
      const hasImages = input.quotedImages && input.quotedImages.length > 0;

      console.log(`[OpenAI Worker] Executing with streaming: model=${model}, hasImages=${hasImages}`);

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

      console.log(`[OpenAI Worker] Image options:`, JSON.stringify(imageGenConfig));

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
        console.log(`[OpenAI Worker] Continuing conversation from response: ${session.openaiResponseId}`);
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

      console.log(`[OpenAI Worker] Starting stream processing...`);

      // Process streaming events
      for await (const event of stream as AsyncIterable<any>) {
        const eventType = event.type;

        // Track response ID for multi-turn conversations
        if (eventType === 'response.created') {
          responseId = event.response?.id || '';
          console.log(`[OpenAI Worker] Stream started, response ID: ${responseId}`);
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
            console.log(`[OpenAI Worker] Image generation complete, uploading...`);
            const image = await uploadBase64Image(item.result, context, imageIndex, 'generated');
            images.push(image);
            await progress.imageDone(imageIndex, image.storageKey);
            imageIndex++;
          }
        }

        // Handle stream errors
        if (eventType === 'error') {
          const errorMsg = event.error?.message || 'Stream error';
          console.error(`[OpenAI Worker] Stream error:`, errorMsg);
          throw new Error(errorMsg);
        }

        // Response completed - log final state
        if (eventType === 'response.completed') {
          console.log(`[OpenAI Worker] Stream completed. Text length: ${fullText.length}, Images: ${images.length}`);
        }
      }

      // Only error if BOTH image and text are empty
      if (images.length === 0 && !fullText) {
        console.error(`[OpenAI Worker] No content received from stream`);
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
      console.error(`[OpenAI Worker] Failed:`, errorMessage);
      await progress.error(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};
