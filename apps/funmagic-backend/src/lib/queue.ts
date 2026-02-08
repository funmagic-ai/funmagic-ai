import { Queue } from 'bullmq';
import { createRedisConnection } from '@funmagic/services';

const JOB_BACKOFF_DELAY = parseInt(process.env.JOB_BACKOFF_DELAY_MS ?? '1000', 10);

export const QUEUE_NAMES = {
  AI_TASKS: 'ai-tasks',
  ADMIN_AI_TASKS: 'admin-ai-tasks',
  CLEANUP: 'cleanup',
} as const;

// Lazy-initialized queues
let _aiTasksQueue: Queue | null = null;
let _adminAITasksQueue: Queue | null = null;
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

export function getAdminAITasksQueue(): Queue {
  if (!_adminAITasksQueue) {
    _adminAITasksQueue = new Queue(QUEUE_NAMES.ADMIN_AI_TASKS, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: JOB_BACKOFF_DELAY },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });
  }
  return _adminAITasksQueue;
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

export const adminAITasksQueue = new Proxy({} as Queue, {
  get(_, prop) { return (getAdminAITasksQueue() as any)[prop]; }
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

// Provider types
export type AdminProvider = 'openai' | 'google' | 'fal';

// Model capability types
export type ModelCapability = 'chat-image' | 'image-only' | 'utility';

// Session data for multi-turn conversations
export interface AdminSessionData {
  openaiResponseId?: string;
}

// Admin AI Studio job data - messageId is the primary identifier
export interface AdminMessageJobData {
  messageId: string;
  chatId: string;
  adminId: string;
  provider: AdminProvider;
  model?: string;
  modelCapability?: ModelCapability;
  input: {
    prompt?: string;
    quotedImages?: Array<{ url: string; storageKey?: string }>;
    [key: string]: unknown;
  };
  // Session data for multi-turn conversations
  session?: AdminSessionData;
  // Decrypted API key for the provider
  apiKey: string;
}

// Backwards compatibility alias
export type AdminAITaskJobData = AdminMessageJobData;

// Add job helper
export async function addAITaskJob(data: AITaskJobData) {
  // Include stepId in job ID for multi-step tools
  const jobIdSuffix = data.stepId ? `-${data.stepId}` : '';
  return aiTasksQueue.add('process', data, {
    jobId: `task-${data.taskId}${jobIdSuffix}`,
  });
}

// Add admin AI message job helper
export async function addAdminMessageJob(data: AdminMessageJobData) {
  return adminAITasksQueue.add('process', data, {
    jobId: `admin-msg-${data.messageId}`,
  });
}

// Backwards compatibility alias
export const addAdminAITaskJob = addAdminMessageJob;

// Remove admin AI message job from queue (for cleanup on chat deletion)
export async function removeAdminMessageJob(messageId: string): Promise<boolean> {
  const queue = getAdminAITasksQueue();
  const jobId = `admin-msg-${messageId}`;
  const job = await queue.getJob(jobId);
  if (job) {
    const state = await job.getState();
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      return true;
    }
  }
  return false;
}

// Backwards compatibility alias
export const removeAdminAITaskJob = removeAdminMessageJob;
