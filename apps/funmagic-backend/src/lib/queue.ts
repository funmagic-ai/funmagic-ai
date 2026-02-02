import { Queue } from 'bullmq';
import { createRedisConnection } from '@funmagic/services';

const JOB_BACKOFF_DELAY = parseInt(process.env.JOB_BACKOFF_DELAY_MS ?? '1000', 10);

export const QUEUE_NAMES = {
  AI_TASKS: 'ai-tasks',
  CLEANUP: 'cleanup',
} as const;

// Lazy-initialized queues
let _aiTasksQueue: Queue | null = null;
let _cleanupQueue: Queue | null = null;

export function getAITasksQueue(): Queue {
  if (!_aiTasksQueue) {
    _aiTasksQueue = new Queue(QUEUE_NAMES.AI_TASKS, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: JOB_BACKOFF_DELAY },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });
  }
  return _aiTasksQueue;
}

export function getCleanupQueue(): Queue {
  if (!_cleanupQueue) {
    _cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, {
      connection: createRedisConnection(),
    });
  }
  return _cleanupQueue;
}

// Backward-compatible exports using lazy proxies
export const aiTasksQueue = new Proxy({} as Queue, {
  get(_, prop) { return (getAITasksQueue() as any)[prop]; }
});

export const cleanupQueue = new Proxy({} as Queue, {
  get(_, prop) { return (getCleanupQueue() as any)[prop]; }
});

// Job types
export interface AITaskJobData {
  taskId: string;
  toolSlug: string;
  stepId?: string;  // Optional step ID for multi-step tools
  input: Record<string, unknown>;
  userId: string;
  parentTaskId?: string;  // For child tasks (e.g., 3D gen after image gen)
}

// Add job helper
export async function addAITaskJob(data: AITaskJobData) {
  // Include stepId in job ID for multi-step tools
  const jobIdSuffix = data.stepId ? `-${data.stepId}` : '';
  return aiTasksQueue.add('process', data, {
    jobId: `task-${data.taskId}${jobIdSuffix}`,
  });
}
