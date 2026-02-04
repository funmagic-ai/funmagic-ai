import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, toolTypes } from '@funmagic/database';
import { eq, asc } from 'drizzle-orm';

// Schemas
const ToolTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('ToolType');

const ToolTypesListSchema = z.object({
  toolTypes: z.array(ToolTypeSchema),
}).openapi('ToolTypesList');

const CreateToolTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  displayName: z.string().min(1, 'Display name is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
}).openapi('CreateToolType');

const UpdateToolTypeSchema = CreateToolTypeSchema.partial().openapi('UpdateToolType');

const ToolTypeDetailSchema = z.object({
  toolType: ToolTypeSchema,
}).openapi('ToolTypeDetail');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('ToolTypeError');

// Routes
const listToolTypesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Tool Types'],
  responses: {
    200: {
      content: { 'application/json': { schema: ToolTypesListSchema } },
      description: 'List of all tool types',
    },
  },
});

const getToolTypeRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Admin - Tool Types'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ToolTypeDetailSchema } },
      description: 'Tool type details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool type not found',
    },
  },
});

const createToolTypeRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Admin - Tool Types'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateToolTypeSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: ToolTypeDetailSchema } },
      description: 'Tool type created',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool type name already exists',
    },
  },
});

const updateToolTypeRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Admin - Tool Types'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateToolTypeSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ToolTypeDetailSchema } },
      description: 'Tool type updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool type not found',
    },
  },
});

const deleteToolTypeRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Admin - Tool Types'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }).openapi('DeleteToolTypeSuccess') } },
      description: 'Tool type deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool type not found',
    },
  },
});

// Helper function to format tool type response
function formatToolType(t: typeof toolTypes.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    displayName: t.displayName,
    description: t.description,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export const toolTypesRoutes = new OpenAPIHono()
  .openapi(listToolTypesRoute, async (c) => {
    const allToolTypes = await db.query.toolTypes.findMany({
      orderBy: asc(toolTypes.createdAt),
    });

    return c.json({
      toolTypes: allToolTypes.map(formatToolType),
    }, 200);
  })
  .openapi(getToolTypeRoute, async (c) => {
    const { id } = c.req.valid('param');

    const toolType = await db.query.toolTypes.findFirst({
      where: eq(toolTypes.id, id),
    });

    if (!toolType) {
      return c.json({ error: 'Tool type not found' }, 404);
    }

    return c.json({
      toolType: formatToolType(toolType),
    }, 200);
  })
  .openapi(createToolTypeRoute, async (c) => {
    const data = c.req.valid('json');

    // Check if name already exists
    const existing = await db.query.toolTypes.findFirst({
      where: eq(toolTypes.name, data.name),
    });

    if (existing) {
      return c.json({ error: 'Tool type name already exists' }, 409);
    }

    const [toolType] = await db.insert(toolTypes).values({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      isActive: data.isActive ?? true,
    }).returning();

    return c.json({
      toolType: formatToolType(toolType),
    }, 201);
  })
  .openapi(updateToolTypeRoute, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const existing = await db.query.toolTypes.findFirst({
      where: eq(toolTypes.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Tool type not found' }, 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [toolType] = await db.update(toolTypes)
      .set(updateData)
      .where(eq(toolTypes.id, id))
      .returning();

    return c.json({
      toolType: formatToolType(toolType),
    }, 200);
  })
  .openapi(deleteToolTypeRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.toolTypes.findFirst({
      where: eq(toolTypes.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Tool type not found' }, 404);
    }

    await db.delete(toolTypes).where(eq(toolTypes.id, id));

    return c.json({ success: true }, 200);
  });
