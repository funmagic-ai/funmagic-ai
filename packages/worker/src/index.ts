import { Worker, Job } from 'bullmq';
import { db, tasks, taskPayloads, credits, creditTransactions } from '@funmagic/database';
import { eq } from 'drizzle-orm';
import { createRedisConnection, redis } from './lib/redis';
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

    try {
      // Get the tool-specific worker
      const toolWorker = getToolWorker(toolSlug);

      if (!toolWorker) {
        throw new Error(`No worker found for tool: ${toolSlug}. Available: ${getRegisteredTools().join(', ')}`);
      }

      // Execute the tool worker with step context
      const result = await toolWorker.execute({
        taskId,
        stepId,
        userId,
        input: { ...input, parentTaskId },
        redis,
      });

      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed');
      }

      // Update task as completed
      await db.update(tasks)
        .set({
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update payload with output
      await db.update(taskPayloads)
        .set({ output: result.output })
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

      // Publish completion event
      await publishTaskCompleted(redis, taskId, result.output);

      console.log(`[Worker] Task ${taskId} completed successfully`);
      return result.output;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Worker] Task ${taskId} failed:`, errorMessage);

      // Update task as failed
      await db.update(tasks)
        .set({
          status: 'failed',
          completedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));

      // Update payload with error
      await db.update(taskPayloads)
        .set({ error: errorMessage })
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

      throw error;
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
