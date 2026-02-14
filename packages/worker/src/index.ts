import 'dotenv/config';

import { Worker, Job } from 'bullmq';
import { db, tasks, taskPayloads, credits, creditTransactions } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import { createRedisConnection, redis } from '@funmagic/services';
import { publishTaskCompleted, publishTaskFailed } from './lib/progress';
import { getToolWorker, getRegisteredTools } from './tools';
import { confirmCharge, releaseCredits } from '@funmagic/services/credit';
import type { AITaskJobData } from './types';

console.log('[Worker] Starting...');
console.log(`[Worker] Registered tools: ${getRegisteredTools().join(', ')}`);

// AI Task Worker
const aiTaskWorker = new Worker<AITaskJobData>(
  'ai-tasks',
  async (job: Job<AITaskJobData>) => {
    const { taskId, toolSlug, stepId, input, userId, parentTaskId } = job.data;

    console.log(`\n[Worker] Processing task ${taskId} for tool "${toolSlug}"${stepId ? ` (step: ${stepId})` : ''}`);

    // Update task status to processing
    await db.update(tasks)
      .set({ status: 'processing', startedAt: new Date() })
      .where(eq(tasks.id, taskId));

    // Get the tool-specific worker
    const toolWorker = getToolWorker(toolSlug);

    if (!toolWorker) {
      throw new Error(`No worker found for tool: ${toolSlug}. Available: ${getRegisteredTools().join(', ')}`);
    }

    // Execute the tool worker with step context
    let result: import('./types').StepResult;
    try {
      result = await toolWorker.execute({
        taskId,
        stepId,
        userId,
        input: { ...input, parentTaskId },
        redis,
      });
    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Provider data to persist regardless of outcome
    const providerData = {
      providerRequest: result.providerRequest,
      providerResponse: result.providerResponse,
      providerMeta: result.providerMeta,
    };

    if (result.success) {
      // Update task as completed
      await db.update(tasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update payload with output and provider data
      await db.update(taskPayloads)
        .set({ output: result.output, ...providerData })
        .where(eq(taskPayloads.taskId, taskId));

      // Confirm credit charge if credits were reserved
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (task?.creditsCost && task.creditsCost > 0) {
        await confirmCharge(db as any, credits, creditTransactions, {
          userId,
          amount: task.creditsCost,
          taskId,
          description: `Completed task for ${toolSlug}`,
        });
      }

      // Publish completion signal (no output — it can be massive, e.g. 13MB
      // point cloud data). Client fetches full output via REST after receiving
      // this notification. Output is already persisted in taskPayloads above.
      await publishTaskCompleted(redis, taskId);

      console.log(`[Worker] Task ${taskId} completed successfully`);
      return result.output;

    } else {
      const errorMessage = result.error || 'Tool execution failed';
      console.error(`[Worker] Task ${taskId} failed:`, errorMessage);

      // Update task as failed
      await db.update(tasks)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update payload with error and any provider data captured before failure
      await db.update(taskPayloads)
        .set({ error: errorMessage, ...providerData })
        .where(eq(taskPayloads.taskId, taskId));

      // Release reserved credits if task failed
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (task?.creditsCost && task.creditsCost > 0) {
        await releaseCredits(db as any, credits, creditTransactions, {
          userId,
          amount: task.creditsCost,
          taskId,
          reason: `Task failed: ${errorMessage}`,
        });
      }

      // Publish failure event
      await publishTaskFailed(redis, taskId, errorMessage);

      throw new Error(errorMessage);
    }
  },
  {
    connection: createRedisConnection(),
    concurrency: 5,
  }
);

aiTaskWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

aiTaskWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

aiTaskWorker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('[Worker] Started and listening for jobs');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing worker...');
  await aiTaskWorker.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing worker...');
  await aiTaskWorker.close();
  await redis.quit();
  process.exit(0);
});
