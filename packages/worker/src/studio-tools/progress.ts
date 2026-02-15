import type { Redis } from 'ioredis';
import type { StudioProgressEvent, GeneratedImage } from './types';

/**
 * Get the Redis channel name for a studio generation
 */
export function getStudioGenerationChannel(messageId: string): string {
  return `studio-gen:${messageId}`;
}

/**
 * Get the Redis Stream key for a studio generation
 */
export function getStudioGenerationStreamKey(messageId: string): string {
  return `stream:studio-gen:${messageId}`;
}

/**
 * Publish a studio progress event to Redis
 *
 * Uses Redis Streams + Pub/Sub hybrid pattern:
 * 1. Store event in Redis Stream (persistent, auto-trim at 1000 events)
 * 2. Set TTL on stream (5 minutes)
 * 3. Publish to Pub/Sub for real-time delivery
 *
 * This ensures events are not lost if SSE connects after worker starts publishing.
 */
export async function publishStudioProgress(
  redis: Redis,
  messageId: string,
  event: Omit<StudioProgressEvent, 'timestamp' | 'messageId'>
): Promise<void> {
  const channel = getStudioGenerationChannel(messageId);
  const streamKey = getStudioGenerationStreamKey(messageId);

  const fullEvent: StudioProgressEvent = {
    ...event,
    messageId,
    timestamp: new Date().toISOString(),
  };

  const eventJson = JSON.stringify(fullEvent);

  // 1. Store in Redis Stream (persistent, auto-trim at ~1000 events)
  await redis.xadd(streamKey, 'MAXLEN', '~', '1000', '*', 'data', eventJson);

  // 2. Set TTL on stream (5 minutes) - refreshes on each event
  await redis.expire(streamKey, 300);

  // 3. Publish to Pub/Sub for real-time delivery
  const subscribers = await redis.publish(channel, eventJson);
  console.log(`[Progress] Published ${event.type} to ${channel}, subscribers: ${subscribers}`);
}

/**
 * Studio progress tracker for streaming text and images
 */
export class StudioProgressTracker {
  private redis: Redis;
  private messageId: string;

  constructor(redis: Redis, messageId: string) {
    this.redis = redis;
    this.messageId = messageId;
  }

  /**
   * Send a text delta chunk (for typewriter effect)
   */
  async textDelta(chunk: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'text_delta',
      chunk,
    });
  }

  /**
   * Send the final complete text
   */
  async textDone(content: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'text_done',
      content,
    });
  }

  /**
   * Send a partial image (for progress preview)
   */
  async partialImage(index: number, base64Data: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'partial_image',
      index,
      data: base64Data,
    });
  }

  /**
   * Send a completed image with storageKey only
   */
  async imageDone(index: number, storageKey: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'image_done',
      index,
      storageKey,
    });
  }

  /**
   * Send completion event with all images
   */
  async complete(images: GeneratedImage[], text?: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'complete',
      images,
      content: text,
    });
  }

  /**
   * Send error event
   */
  async error(errorMessage: string): Promise<void> {
    await publishStudioProgress(this.redis, this.messageId, {
      type: 'error',
      error: errorMessage,
    });
  }
}

/**
 * Create a studio progress tracker for a generation
 */
export function createStudioProgressTracker(
  redis: Redis,
  messageId: string
): StudioProgressTracker {
  return new StudioProgressTracker(redis, messageId);
}
