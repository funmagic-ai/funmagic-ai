import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, studioProjects, studioGenerations } from '@funmagic/database';
import { eq, desc, and, inArray, sql } from 'drizzle-orm';
import { removeStudioGenerationJob } from '../../../lib/queue';
import { notFound } from '../../../lib/errors';
import { ErrorSchema } from '../../../schemas';
import {
  ProjectSchema,
  ProjectsListSchema,
  ProjectsSummaryListSchema,
  ProjectWithGenerationsSchema,
  CreateProjectSchema,
  GenerationSchema,
} from './schemas';
import type { StudioImage } from '@funmagic/database';

// Route definitions
const listProjectsRoute = createRoute({
  method: 'get',
  path: '/projects',
  tags: ['Admin - Studio'],
  responses: {
    200: {
      content: { 'application/json': { schema: ProjectsListSchema } },
      description: 'List of projects',
    },
  },
});

const listProjectsSummaryRoute = createRoute({
  method: 'get',
  path: '/projects/summary',
  tags: ['Admin - Studio'],
  responses: {
    200: {
      content: { 'application/json': { schema: ProjectsSummaryListSchema } },
      description: 'List of projects with generation counts',
    },
  },
});

const createProjectRoute = createRoute({
  method: 'post',
  path: '/projects',
  tags: ['Admin - Studio'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateProjectSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: z.object({ project: ProjectSchema }) } },
      description: 'Project created',
    },
  },
});

const getProjectRoute = createRoute({
  method: 'get',
  path: '/projects/{projectId}',
  tags: ['Admin - Studio'],
  request: {
    params: z.object({ projectId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ProjectWithGenerationsSchema } },
      description: 'Project with generations',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Project not found',
    },
  },
});

const deleteProjectRoute = createRoute({
  method: 'delete',
  path: '/projects/{projectId}',
  tags: ['Admin - Studio'],
  request: {
    params: z.object({ projectId: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
      description: 'Project deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Project not found',
    },
  },
});

export const projectsRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  // List projects
  .openapi(listProjectsRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const projects = await db.query.studioProjects.findMany({
      where: eq(studioProjects.adminId, userId),
      orderBy: desc(studioProjects.updatedAt),
    });

    return c.json({
      projects: projects.map(p => ({
        id: p.id,
        title: p.title,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    }, 200);
  })

  // List projects with generation counts (fixes N+1 query)
  .openapi(listProjectsSummaryRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const results = await db.select({
      id: studioProjects.id,
      title: studioProjects.title,
      createdAt: studioProjects.createdAt,
      updatedAt: studioProjects.updatedAt,
      generationCount: sql<number>`count(${studioGenerations.id})::int`,
    })
      .from(studioProjects)
      .leftJoin(studioGenerations, and(
        eq(studioGenerations.projectId, studioProjects.id),
        eq(studioGenerations.role, 'assistant'),
      ))
      .where(eq(studioProjects.adminId, userId))
      .groupBy(studioProjects.id)
      .orderBy(desc(studioProjects.updatedAt));

    return c.json({
      projects: results.map(r => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        generationCount: r.generationCount,
      })),
    }, 200);
  })

  // Create project
  .openapi(createProjectRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { title } = c.req.valid('json');

    const [project] = await db.insert(studioProjects).values({
      adminId: userId,
      title: title || null,
    }).returning();

    return c.json({
      project: {
        id: project.id,
        title: project.title,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
    }, 201);
  })

  // Get project with generations
  .openapi(getProjectRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { projectId } = c.req.valid('param');

    const project = await db.query.studioProjects.findFirst({
      where: eq(studioProjects.id, projectId),
    });

    if (!project || project.adminId !== userId) {
      throw notFound('Project');
    }

    const generations = await db.query.studioGenerations.findMany({
      where: eq(studioGenerations.projectId, projectId),
      orderBy: desc(studioGenerations.createdAt),
    });

    return c.json({
      project: {
        id: project.id,
        title: project.title,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
      generations: generations.map(gen => ({
        id: gen.id,
        projectId: gen.projectId,
        role: gen.role as 'user' | 'assistant',
        content: gen.content,
        quotedImageIds: gen.quotedImageIds as string[] | null,
        provider: gen.provider,
        model: gen.model,
        providerOptions: gen.providerOptions ?? null,
        images: gen.images as StudioImage[] | null,
        status: gen.status,
        error: gen.error,
        input: gen.input ?? null,
        rawRequest: gen.rawRequest ?? null,
        rawResponse: gen.rawResponse ?? null,
        createdAt: gen.createdAt.toISOString(),
      })),
    }, 200);
  })

  // Delete project
  .openapi(deleteProjectRoute, async (c) => {
    const user = c.get('user');
    const userId = user?.id || '';

    const { projectId } = c.req.valid('param');

    const project = await db.query.studioProjects.findFirst({
      where: eq(studioProjects.id, projectId),
    });

    if (!project || project.adminId !== userId) {
      throw notFound('Project');
    }

    // Find pending/processing generations to cancel their BullMQ jobs
    const generationsToCancel = await db.query.studioGenerations.findMany({
      where: and(
        eq(studioGenerations.projectId, projectId),
        inArray(studioGenerations.status, ['pending', 'processing'])
      ),
    });

    // Cancel pending BullMQ jobs
    await Promise.all(
      generationsToCancel.map(gen => removeStudioGenerationJob(gen.id))
    );

    // Delete project (generations cascade due to foreign keys)
    await db.delete(studioProjects).where(eq(studioProjects.id, projectId));

    return c.json({ success: true }, 200);
  });
