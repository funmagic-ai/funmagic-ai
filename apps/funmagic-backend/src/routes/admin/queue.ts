import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { getAITasksQueue, getStudioTasksQueue, QUEUE_NAMES } from '../../lib/queue';
import type { Job } from 'bullmq';

const QueueStatsSchema = z.object({
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
  delayed: z.number(),
}).openapi('QueueStats');

const JobStatusEnum = z.enum(['waiting', 'active', 'completed', 'failed', 'delayed']);

const QueueJobSchema = z.object({
  id: z.string(),
  queue: z.string(),
  name: z.string(),
  status: z.string(),
  data: z.record(z.string(), z.unknown()),
  progress: z.number(),
  attemptsMade: z.number(),
  failedReason: z.string().nullable(),
  timestamp: z.number(),
  processedOn: z.number().nullable(),
  finishedOn: z.number().nullable(),
  delay: z.number(),
}).openapi('QueueJob');

const QueueJobsResponseSchema = z.object({
  jobs: z.array(QueueJobSchema),
  total: z.number(),
}).openapi('QueueJobsResponse');

const getQueueStatsRoute = createRoute({
  method: 'get',
  path: '/stats',
  tags: ['Admin - Queue'],
  request: {
    query: z.object({
      queue: z.enum(['all', 'ai-tasks', 'studio-tasks']).default('all'),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: QueueStatsSchema } },
      description: 'Queue statistics, optionally filtered by queue',
    },
  },
});

const getQueueJobsRoute = createRoute({
  method: 'get',
  path: '/jobs',
  tags: ['Admin - Queue'],
  request: {
    query: z.object({
      status: JobStatusEnum,
      queue: z.enum(['all', 'ai-tasks', 'studio-tasks']).default('all'),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: QueueJobsResponseSchema } },
      description: 'List of jobs filtered by status and queue',
    },
  },
});

/** Strip sensitive fields (apiKey, apiSecret) from job data */
function sanitiseJobData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitised = { ...data };
  delete sanitised.apiKey;
  delete sanitised.apiSecret;
  return sanitised;
}

function mapJob(job: Job, queueName: string) {
  return {
    id: job.id ?? '',
    queue: queueName,
    name: job.name,
    status: '', // filled by caller
    data: sanitiseJobData((job.data ?? {}) as Record<string, unknown>),
    progress: typeof job.progress === 'number' ? job.progress : 0,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason ?? null,
    timestamp: job.timestamp,
    processedOn: job.processedOn ?? null,
    finishedOn: job.finishedOn ?? null,
    delay: job.delay ?? 0,
  };
}

export const queueRoutes = new OpenAPIHono()
  .openapi(getQueueStatsRoute, async (c) => {
    const { queue } = c.req.valid('query');

    const countsList = await Promise.all(
      [
        queue === 'all' || queue === QUEUE_NAMES.AI_TASKS
          ? getAITasksQueue().getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
          : null,
        queue === 'all' || queue === QUEUE_NAMES.STUDIO_TASKS
          ? getStudioTasksQueue().getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed')
          : null,
      ].filter(Boolean),
    );

    const sum = (key: string) =>
      countsList.reduce((acc, counts) => acc + ((counts as Record<string, number>)[key] ?? 0), 0);

    return c.json({
      waiting: sum('waiting'),
      active: sum('active'),
      completed: sum('completed'),
      failed: sum('failed'),
      delayed: sum('delayed'),
    }, 200);
  })
  .openapi(getQueueJobsRoute, async (c) => {
    const { status, queue, limit, offset } = c.req.valid('query');

    const queues: Array<{ q: ReturnType<typeof getAITasksQueue>; name: string }> = [];
    if (queue === 'all' || queue === QUEUE_NAMES.AI_TASKS) {
      queues.push({ q: getAITasksQueue(), name: QUEUE_NAMES.AI_TASKS });
    }
    if (queue === 'all' || queue === QUEUE_NAMES.STUDIO_TASKS) {
      queues.push({ q: getStudioTasksQueue(), name: QUEUE_NAMES.STUDIO_TASKS });
    }

    // Fetch jobs and counts from each queue in parallel
    const results = await Promise.all(
      queues.map(async ({ q, name }) => {
        const counts = await q.getJobCounts(status);
        const total = counts[status] ?? 0;
        // BullMQ getJobs uses start/end indices (inclusive)
        const jobs = await q.getJobs(status, 0, total);
        return { name, jobs, total };
      }),
    );

    // Merge, map, and sort all jobs by timestamp descending
    let allJobs = results.flatMap(({ name, jobs }) =>
      jobs.map((job) => ({ ...mapJob(job, name), status })),
    );
    allJobs.sort((a, b) => b.timestamp - a.timestamp);

    // Total across selected queues
    const total = results.reduce((sum, r) => sum + r.total, 0);

    // Paginate the merged list
    const paginated = allJobs.slice(offset, offset + limit);

    return c.json({ jobs: paginated, total }, 200);
  });
