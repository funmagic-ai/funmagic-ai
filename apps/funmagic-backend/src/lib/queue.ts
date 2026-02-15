import { Queue } from 'bullmq';
import { createRedisConnection } from '@funmagic/services';

const JOB_BACKOFF_DELAY = parseInt(process.env.JOB_BACKOFF_DELAY_MS!, 10);

export const QUEUE_NAMES = {
  AI_TASKS: 'ai-tasks',
  STUDIO_TASKS: 'studio-tasks',
} as const;

// Lazy-initialized queues
let _aiTasksQueue: Queue | null = null;
let _studioTasksQueue: Queue | null = null;

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

export function getStudioTasksQueue(): Queue {
  if (!_studioTasksQueue) {
    _studioTasksQueue = new Queue(QUEUE_NAMES.STUDIO_TASKS, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: JOB_BACKOFF_DELAY },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });
  }
  return _studioTasksQueue;
}

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
export type StudioProvider = 'openai' | 'google' | 'fal';

// Model capability types
export type ModelCapability = 'chat-image' | 'image-only' | 'utility';

// Session data for multi-turn conversations
export interface StudioSessionData {
  openaiResponseId?: string;
}

// Studio generation job data - generationId (messageId) is the primary identifier
export interface StudioGenerationJobData {
  messageId: string;
  projectId: string;
  adminId: string;
  provider: StudioProvider;
  model?: string;
  modelCapability?: ModelCapability;
  input: {
    prompt?: string;
    quotedImages?: Array<{ url: string; storageKey?: string }>;
    [key: string]: unknown;
  };
  // Session data for multi-turn conversations
  session?: StudioSessionData;
  // Decrypted API key for the provider
  apiKey: string;
}


// Add job helper
export async function addAITaskJob(data: AITaskJobData) {
  // Include stepId in job ID for multi-step tools
  const jobIdSuffix = data.stepId ? `-${data.stepId}` : '';
  return getAITasksQueue().add('process', data, {
    jobId: `task-${data.taskId}${jobIdSuffix}`,
  });
}

// Add studio generation job helper
export async function addStudioGenerationJob(data: StudioGenerationJobData) {
  return getStudioTasksQueue().add('process', data, {
    jobId: `studio-gen-${data.messageId}`,
  });
}

// Remove studio generation job from queue (for cleanup on project deletion)
export async function removeStudioGenerationJob(messageId: string): Promise<boolean> {
  const queue = getStudioTasksQueue();
  const jobId = `studio-gen-${messageId}`;
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

// Add batch studio generation jobs (up to 8 images with shared prompt/provider/options)
export async function addStudioBatchJob(
  jobs: StudioGenerationJobData[],
): Promise<void> {
  for (const job of jobs) {
    await addStudioGenerationJob(job);
  }
}
