import type { Redis } from 'ioredis';

// Progress event types
export type ProgressEventType =
  | 'connected'
  | 'step_started'
  | 'progress'
  | 'step_completed'
  | 'completed'
  | 'failed';

export interface ProgressEvent {
  type: ProgressEventType;
  taskId?: string;
  stepId?: string;
  progress?: number;
  message?: string;
  output?: unknown;
  error?: string;
  timestamp: string;
}

export interface StepStartedEvent extends ProgressEvent {
  type: 'step_started';
  stepId: string;
  stepName?: string;
}

export interface ProgressUpdateEvent extends ProgressEvent {
  type: 'progress';
  stepId?: string;
  progress: number; // 0-100
  message?: string;
}

export interface StepCompletedEvent extends ProgressEvent {
  type: 'step_completed';
  stepId: string;
  output?: unknown;
}

export interface TaskCompletedEvent extends ProgressEvent {
  type: 'completed';
  output?: unknown;
}

export interface TaskFailedEvent extends ProgressEvent {
  type: 'failed';
  error: string;
}

/**
 * Get the Redis channel name for a task
 */
export function getTaskChannel(taskId: string): string {
  return `task:${taskId}`;
}

/**
 * Get the Redis Stream key for a task
 */
export function getTaskStreamKey(taskId: string): string {
  return `stream:task:${taskId}`;
}

/**
 * Publish a progress event to Redis
 *
 * Uses Redis Streams + Pub/Sub hybrid pattern:
 * 1. Store event in Redis Stream (persistent, auto-trim at 1000 events)
 * 2. Set TTL on stream (5 minutes)
 * 3. Publish to Pub/Sub for real-time delivery
 *
 * This ensures events are not lost if SSE connects after worker starts publishing.
 */
export async function publishProgress(
  redis: Redis,
  taskId: string,
  event: Omit<ProgressEvent, 'timestamp'>
): Promise<void> {
  const channel = getTaskChannel(taskId);
  const streamKey = getTaskStreamKey(taskId);

  const fullEvent: ProgressEvent = {
    ...event,
    taskId,
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
 * Publish step started event
 */
export async function publishStepStarted(
  redis: Redis,
  taskId: string,
  stepId: string,
  stepName?: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'step_started',
    stepId,
    message: stepName ? `Starting ${stepName}` : `Starting step ${stepId}`,
  });
}

/**
 * Publish progress update event
 */
export async function publishProgressUpdate(
  redis: Redis,
  taskId: string,
  progress: number,
  message?: string,
  stepId?: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'progress',
    stepId,
    progress: Math.min(100, Math.max(0, progress)),
    message,
  });
}

/**
 * Publish step completed event
 */
export async function publishStepCompleted(
  redis: Redis,
  taskId: string,
  stepId: string,
  output?: unknown
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'step_completed',
    stepId,
    output,
  });
}

/**
 * Publish task completed event
 */
export async function publishTaskCompleted(
  redis: Redis,
  taskId: string,
  output?: unknown
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'completed',
    output,
  });
}

/**
 * Publish task failed event
 */
export async function publishTaskFailed(
  redis: Redis,
  taskId: string,
  error: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'failed',
    error,
  });
}

/**
 * Create an async iterator that subscribes to task progress events
 */
export function subscribeProgress(
  redis: Redis,
  taskId: string
): {
  iterator: AsyncIterableIterator<ProgressEvent>;
  unsubscribe: () => Promise<void>;
} {
  const channel = getTaskChannel(taskId);
  const eventQueue: ProgressEvent[] = [];
  let resolveNext: ((value: IteratorResult<ProgressEvent, void>) => void) | null = null;
  let isCompleted = false;

  // Subscribe to the channel
  redis.subscribe(channel);

  // Handle incoming messages
  const messageHandler = (ch: string, message: string) => {
    if (ch !== channel) return;

    try {
      const event = JSON.parse(message) as ProgressEvent;

      if (resolveNext) {
        resolveNext({ value: event, done: false });
        resolveNext = null;
      } else {
        eventQueue.push(event);
      }

      // Mark as completed on final events
      if (event.type === 'completed' || event.type === 'failed') {
        isCompleted = true;
      }
    } catch (e) {
      console.error('Failed to parse progress event:', e);
    }
  };

  redis.on('message', messageHandler);

  const iterator = {
    async next(): Promise<IteratorResult<ProgressEvent, void>> {
      if (eventQueue.length > 0) {
        return { value: eventQueue.shift()!, done: false };
      }

      if (isCompleted) {
        return { value: undefined, done: true };
      }

      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    },

    async return(): Promise<IteratorResult<ProgressEvent, void>> {
      isCompleted = true;
      redis.off('message', messageHandler);
      await redis.unsubscribe(channel);
      return { value: undefined, done: true };
    },

    async throw(e: unknown): Promise<never> {
      isCompleted = true;
      redis.off('message', messageHandler);
      await redis.unsubscribe(channel);
      throw e;
    },

    [Symbol.asyncIterator](): AsyncIterableIterator<ProgressEvent> {
      return this as AsyncIterableIterator<ProgressEvent>;
    },
  };

  const unsubscribe = async () => {
    isCompleted = true;
    redis.off('message', messageHandler);
    await redis.unsubscribe(channel);
  };

  return { iterator, unsubscribe };
}

/**
 * Simple progress tracker that can be used within a worker
 */
export class ProgressTracker {
  private redis: Redis;
  private taskId: string;
  private currentStepId?: string;

  constructor(redis: Redis, taskId: string) {
    this.redis = redis;
    this.taskId = taskId;
  }

  async startStep(stepId: string, stepName?: string): Promise<void> {
    this.currentStepId = stepId;
    await publishStepStarted(this.redis, this.taskId, stepId, stepName);
  }

  async updateProgress(progress: number, message?: string): Promise<void> {
    await publishProgressUpdate(this.redis, this.taskId, progress, message, this.currentStepId);
  }

  async completeStep(output?: unknown): Promise<void> {
    if (this.currentStepId) {
      await publishStepCompleted(this.redis, this.taskId, this.currentStepId, output);
    }
  }

  async complete(output?: unknown): Promise<void> {
    await publishTaskCompleted(this.redis, this.taskId, output);
  }

  async fail(error: string): Promise<void> {
    await publishTaskFailed(this.redis, this.taskId, error);
  }
}
