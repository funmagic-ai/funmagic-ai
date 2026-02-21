import type { Redis } from 'ioredis';
import type { StudioProgressEvent, GeneratedImage } from './types';
import { getUserStreamKey } from '@funmagic/services/progress';

/**
 * Publish a studio progress event to the user's Redis Stream.
 *
 * All events for a user flow through a single per-user stream.
 * The SSE endpoint reads from this stream via XREAD BLOCK.
 */
export async function publishStudioProgress(
  redis: Redis,
  messageId: string,
  event: Omit<StudioProgressEvent, 'timestamp' | 'messageId'>,
  userId?: string
): Promise<void> {
  const fullEvent: StudioProgressEvent = {
    ...event,
    messageId,
    timestamp: new Date().toISOString(),
  };

  const eventJson = JSON.stringify(fullEvent);

  if (userId) {
    const streamKey = getUserStreamKey(userId);
    await redis.xadd(streamKey, 'MAXLEN', '~', '1000', '*', 'data', eventJson);
    await redis.expire(streamKey, 300);
  }
}

/**
 * Studio progress tracker for streaming text and images
 */
export class StudioProgressTracker {
  private redis: Redis;
  private messageId: string;
  private userId?: string;

  constructor(redis: Redis, messageId: string, userId?: string) {
    this.redis = redis;
    this.messageId = messageId;
    this.userId = userId;
  }

  /**
   * Send a text delta chunk (for typewriter effect)
   */
  async textDelta(chunk: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'text_delta',
      chunk,
    }, this.userId);
  }

  /**
   * Send the final complete text
   */
  async textDone(content: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'text_done',
      content,
    }, this.userId);
  }

  /**
   * Send a partial image (for progress preview)
   */
  async partialImage(index: number, base64Data: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'partial_image',
      index,
      data: base64Data,
    }, this.userId);
  }

  /**
   * Send a completed image with storageKey only
   */
  async imageDone(index: number, storageKey: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'image_done',
      index,
      storageKey,
    }, this.userId);
  }

  /**
   * Send completion event with all images
   */
  async complete(images: GeneratedImage[], text?: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'complete',
      images,
      content: text,
    }, this.userId);
  }

  /**
   * Send error event
   */
  async error(errorMessage: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'error',
      error: errorMessage,
    }, this.userId);
  }
}

/**
 * Create a studio progress tracker for a generation
 */
export function createStudioProgressTracker(
  redis: Redis,
  messageId: string,
  userId?: string
): StudioProgressTracker {
  return new StudioProgressTracker(redis, messageId, userId);
}
