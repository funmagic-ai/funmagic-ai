import type { Redis } from 'ioredis';
import {
  ProgressTracker,
  publishStepStarted,
  publishProgressUpdate,
  publishStepCompleted,
  publishTaskCompleted,
  publishTaskFailed,
} from '@funmagic/services/progress';

export {
  publishStepStarted,
  publishProgressUpdate,
  publishStepCompleted,
  publishTaskCompleted,
  publishTaskFailed,
};

/**
 * Create a progress tracker for a task
 */
export function createProgressTracker(redis: Redis, taskId: string, userId?: string): ProgressTracker {
  return new ProgressTracker(redis, taskId, userId);
}
