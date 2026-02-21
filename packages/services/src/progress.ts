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
 * Get the Redis Stream key for a user's event stream
 */
export function getUserStreamKey(userId: string): string {
  return `stream:user:${userId}`;
}

/**
 * Publish a progress event to the user's Redis Stream.
 *
 * All events for a user flow through a single per-user stream.
 * The SSE endpoint reads from this stream via XREAD BLOCK.
 */
export async function publishProgress(
  redis: Redis,
  taskId: string,
  event: Omit<ProgressEvent, 'timestamp'>,
  userId?: string
): Promise<void> {
  const fullEvent: ProgressEvent = {
    ...event,
    taskId,
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
 * Publish step started event
 */
export async function publishStepStarted(
  redis: Redis,
  taskId: string,
  stepId: string,
  stepName?: string,
  userId?: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'step_started',
    stepId,
    stepName,
    message: stepName ? `Starting ${stepName}` : `Starting step ${stepId}`,
  } as Omit<StepStartedEvent, 'timestamp'>, userId);
}

/**
 * Publish progress update event
 */
export async function publishProgressUpdate(
  redis: Redis,
  taskId: string,
  progress: number,
  message?: string,
  stepId?: string,
  userId?: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'progress',
    stepId,
    progress: Math.min(100, Math.max(0, progress)),
    message,
  }, userId);
}

/**
 * Publish step completed event
 */
export async function publishStepCompleted(
  redis: Redis,
  taskId: string,
  stepId: string,
  output?: unknown,
  userId?: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'step_completed',
    stepId,
    output,
  }, userId);
}

/**
 * Publish task completed event
 */
export async function publishTaskCompleted(
  redis: Redis,
  taskId: string,
  output?: unknown,
  userId?: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'completed',
    output,
  }, userId);
}

/**
 * Publish task failed event
 */
export async function publishTaskFailed(
  redis: Redis,
  taskId: string,
  error: string,
  userId?: string
): Promise<void> {
  await publishProgress(redis, taskId, {
    type: 'failed',
    error,
  }, userId);
}

/**
 * Simple progress tracker that can be used within a worker
 */
export class ProgressTracker {
  private redis: Redis;
  private taskId: string;
  private userId?: string;
  private currentStepId?: string;

  constructor(redis: Redis, taskId: string, userId?: string) {
    this.redis = redis;
    this.taskId = taskId;
    this.userId = userId;
  }

  async startStep(stepId: string, stepName?: string): Promise<void> {
    this.currentStepId = stepId;
    await publishStepStarted(this.redis, this.taskId, stepId, stepName, this.userId);
  }

  async updateProgress(progress: number, message?: string): Promise<void> {
    await publishProgressUpdate(this.redis, this.taskId, progress, message, this.currentStepId, this.userId);
  }

  async completeStep(output?: unknown): Promise<void> {
    if (this.currentStepId) {
      await publishStepCompleted(this.redis, this.taskId, this.currentStepId, output, this.userId);
    }
  }

  async complete(output?: unknown): Promise<void> {
    await publishTaskCompleted(this.redis, this.taskId, output, this.userId);
  }

  async fail(error: string): Promise<void> {
    await publishTaskFailed(this.redis, this.taskId, error, this.userId);
  }
}
