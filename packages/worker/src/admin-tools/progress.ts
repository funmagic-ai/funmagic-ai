import type { Redis } from 'ioredis';
import type { AdminProgressEvent, GeneratedImage } from './types';

/**
 * Get the Redis channel name for an admin message
 */
export function getAdminMessageChannel(messageId: string): string {
  return `admin-msg:${messageId}`;
}

/**
 * Get the Redis Stream key for an admin message
 */
export function getAdminMessageStreamKey(messageId: string): string {
  return `stream:admin-msg:${messageId}`;
}

/**
 * Publish an admin progress event to Redis
 *
 * Uses Redis Streams + Pub/Sub hybrid pattern:
 * 1. Store event in Redis Stream (persistent, auto-trim at 1000 events)
 * 2. Set TTL on stream (5 minutes)
 * 3. Publish to Pub/Sub for real-time delivery
 *
 * This ensures events are not lost if SSE connects after worker starts publishing.
 */
export async function publishAdminProgress(
  redis: Redis,
  messageId: string,
  event: Omit<AdminProgressEvent, 'timestamp' | 'messageId'>
): Promise<void> {
  const channel = getAdminMessageChannel(messageId);
  const streamKey = getAdminMessageStreamKey(messageId);

  const fullEvent: AdminProgressEvent = {
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
 * Admin progress tracker for streaming text and images
 */
export class AdminProgressTracker {
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
    await publishAdminProgress(this.redis, this.messageId, {
      type: 'text_delta',
      chunk,
    });
  }

  /**
   * Send the final complete text
   */
  async textDone(content: string): Promise<void> {
    await publishAdminProgress(this.redis, this.messageId, {
      type: 'text_done',
      content,
    });
  }

  /**
   * Send a partial image (for progress preview)
   */
  async partialImage(index: number, base64Data: string): Promise<void> {
    await publishAdminProgress(this.redis, this.messageId, {
      type: 'partial_image',
      index,
      data: base64Data,
    });
  }

  /**
   * Send a completed image with storageKey only
   */
  async imageDone(index: number, storageKey: string): Promise<void> {
    await publishAdminProgress(this.redis, this.messageId, {
      type: 'image_done',
      index,
      storageKey,
    });
  }

  /**
   * Send completion event with all images
   */
  async complete(images: GeneratedImage[], text?: string): Promise<void> {
    await publishAdminProgress(this.redis, this.messageId, {
      type: 'complete',
      images,
      content: text,
    });
  }

  /**
   * Send error event
   */
  async error(errorMessage: string): Promise<void> {
    await publishAdminProgress(this.redis, this.messageId, {
      type: 'error',
      error: errorMessage,
    });
  }
}

/**
 * Create an admin progress tracker for a message
 */
export function createAdminProgressTracker(
  redis: Redis,
  messageId: string
): AdminProgressTracker {
  return new AdminProgressTracker(redis, messageId);
}
