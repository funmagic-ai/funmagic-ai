import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, tasks, tools, users } from '@funmagic/database';
import { eq, desc, and, sql } from 'drizzle-orm';

const TaskSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string().nullable(),
  userEmail: z.string(),
  status: z.string(),
  creditsCost: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  parentTaskId: z.string().uuid().nullable().optional(),
  childCount: z.number().optional(),
  tool: z.object({
    id: z.string().uuid(),
    title: z.string(),
    slug: z.string(),
  }).nullable(),
}).openapi('AdminTaskItem');

const TasksListSchema = z.object({
  tasks: z.array(TaskSchema),
  total: z.number(),
}).openapi('AdminTasksList');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('AdminTasksError');

const listTasksRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Tasks'],
  request: {
    query: z.object({
      status: z.string().optional(),
      limit: z.string().transform(v => parseInt(v)).optional(),
      offset: z.string().transform(v => parseInt(v)).optional(),
      parentTaskId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TasksListSchema } },
      description: 'List of all tasks across users',
    },
  },
});

export const adminTasksRoutes = new OpenAPIHono()
  .openapi(listTasksRoute, async (c) => {
    const { status, limit, offset, parentTaskId } = c.req.valid('query');

    const queryLimit = limit ?? 50;
    const queryOffset = offset ?? 0;

    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(tasks.status, status));
    }
    if (parentTaskId) {
      conditions.push(eq(tasks.parentTaskId, parentTaskId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allTasks, countResult] = await Promise.all([
      db.query.tasks.findMany({
        where: whereClause,
        with: { tool: true },
        orderBy: desc(tasks.createdAt),
        limit: queryLimit,
        offset: queryOffset,
      }),
      db.select({ count: sql<number>`count(*)::int` })
        .from(tasks)
        .where(whereClause),
    ]);

    // Fetch user info for all tasks
    const userIds = [...new Set(allTasks.map(t => t.userId))];
    const usersData = userIds.length > 0
      ? await db.query.users.findMany({
          where: sql`${users.id} IN ${userIds}`,
        })
      : [];
    const usersMap = new Map(usersData.map(u => [u.id, u]));

    // Fetch child task counts for all tasks
    const taskIds = allTasks.map(t => t.id);
    const childCounts = taskIds.length > 0
      ? await db.select({
          parentTaskId: tasks.parentTaskId,
          count: sql<number>`count(*)::int`,
        })
        .from(tasks)
        .where(sql`${tasks.parentTaskId} IN ${taskIds}`)
        .groupBy(tasks.parentTaskId)
      : [];
    const childCountMap = new Map(
      childCounts.map(c => [c.parentTaskId, c.count])
    );

    return c.json({
      tasks: allTasks.map(t => {
        const user = usersMap.get(t.userId);
        return {
          id: t.id,
          userId: t.userId,
          userName: user?.name ?? null,
          userEmail: user?.email ?? '',
          status: t.status,
          creditsCost: t.creditsCost,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          parentTaskId: t.parentTaskId ?? null,
          childCount: childCountMap.get(t.id) ?? 0,
          tool: t.tool ? { id: t.tool.id, title: t.tool.title, slug: t.tool.slug } : null,
        };
      }),
      total: countResult[0]?.count ?? 0,
    }, 200);
  });
