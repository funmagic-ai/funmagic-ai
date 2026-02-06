import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, toolTypes, tools } from '@funmagic/database';
import { eq, asc, isNull, and, count } from 'drizzle-orm';
import {
  ToolTypeTranslationsSchema,
  type ToolTypeTranslations,
} from '@funmagic/shared';

// Schemas
const ToolTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  translations: ToolTypeTranslationsSchema,
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
  translations: ToolTypeTranslationsSchema.optional(),
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
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool type is still referenced by active tools',
    },
  },
});

const toggleActiveRoute = createRoute({
  method: 'patch',
  path: '/{id}/toggle-active',
  tags: ['Admin - Tool Types'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ isActive: z.boolean(), deactivatedToolsCount: z.number().optional() }).openapi('ToggleToolTypeActiveResponse') } },
      description: 'Tool type active status toggled',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool type not found',
    },
  },
});

const getActiveToolsCountRoute = createRoute({
  method: 'get',
  path: '/{id}/active-tools-count',
  tags: ['Admin - Tool Types'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ count: z.number() }).openapi('ActiveToolsCountResponse') } },
      description: 'Count of active tools for this tool type',
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
    translations: t.translations as ToolTypeTranslations,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

// Helper to build translations from legacy fields
function buildTranslationsFromLegacy(
  displayName: string,
  description?: string,
  existingTranslations?: ToolTypeTranslations
): ToolTypeTranslations {
  return {
    ...existingTranslations,
    en: {
      displayName,
      description: description ?? existingTranslations?.en?.description ?? '',
    },
  };
}

export const toolTypesRoutes = new OpenAPIHono()
  .openapi(listToolTypesRoute, async (c) => {
    const allToolTypes = await db.query.toolTypes.findMany({
      where: isNull(toolTypes.deletedAt),
      orderBy: asc(toolTypes.createdAt),
    });

    return c.json({
      toolTypes: allToolTypes.map(formatToolType),
    }, 200);
  })
  .openapi(getToolTypeRoute, async (c) => {
    const { id } = c.req.valid('param');

    const toolType = await db.query.toolTypes.findFirst({
      where: and(eq(toolTypes.id, id), isNull(toolTypes.deletedAt)),
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

    // Check if name already exists (among non-deleted tool types)
    const existing = await db.query.toolTypes.findFirst({
      where: and(eq(toolTypes.name, data.name), isNull(toolTypes.deletedAt)),
    });

    if (existing) {
      return c.json({ error: 'Tool type name already exists' }, 409);
    }

    // Build translations: use provided translations or build from legacy fields
    const translations = data.translations ?? buildTranslationsFromLegacy(
      data.displayName,
      data.description
    );

    const [toolType] = await db.insert(toolTypes).values({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      translations,
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
      where: and(eq(toolTypes.id, id), isNull(toolTypes.deletedAt)),
    });

    if (!existing) {
      return c.json({ error: 'Tool type not found' }, 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.translations !== undefined) updateData.translations = data.translations;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Sync legacy fields to translations.en if legacy fields change but translations don't
    if (!data.translations && (data.displayName !== undefined || data.description !== undefined)) {
      const existingTranslations = existing.translations as ToolTypeTranslations;
      updateData.translations = buildTranslationsFromLegacy(
        data.displayName ?? existing.displayName,
        data.description ?? existing.description ?? undefined,
        existingTranslations
      );
    }

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
      where: and(eq(toolTypes.id, id), isNull(toolTypes.deletedAt)),
    });

    if (!existing) {
      return c.json({ error: 'Tool type not found' }, 404);
    }

    // Check for active tools referencing this tool type
    const [{ count: toolCount }] = await db
      .select({ count: count() })
      .from(tools)
      .where(and(eq(tools.toolTypeId, id), isNull(tools.deletedAt)));

    if (Number(toolCount) > 0) {
      return c.json({
        error: `Cannot delete tool type: ${toolCount} tool(s) still use this type`
      }, 409);
    }

    // Soft delete by setting deletedAt timestamp
    await db.update(toolTypes)
      .set({ deletedAt: new Date() })
      .where(eq(toolTypes.id, id));

    return c.json({ success: true }, 200);
  })
  .openapi(getActiveToolsCountRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.toolTypes.findFirst({
      where: and(eq(toolTypes.id, id), isNull(toolTypes.deletedAt)),
    });

    if (!existing) {
      return c.json({ error: 'Tool type not found' }, 404);
    }

    const [{ count: activeToolsCount }] = await db
      .select({ count: count() })
      .from(tools)
      .where(and(
        eq(tools.toolTypeId, id),
        eq(tools.isActive, true),
        isNull(tools.deletedAt)
      ));

    return c.json({ count: Number(activeToolsCount) }, 200);
  })
  .openapi(toggleActiveRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.toolTypes.findFirst({
      where: and(eq(toolTypes.id, id), isNull(toolTypes.deletedAt)),
    });

    if (!existing) {
      return c.json({ error: 'Tool type not found' }, 404);
    }

    const newIsActive = !existing.isActive;

    const [updated] = await db.update(toolTypes)
      .set({ isActive: newIsActive })
      .where(eq(toolTypes.id, id))
      .returning();

    // When deactivating, also deactivate all related active tools
    let deactivatedToolsCount: number | undefined;
    if (!newIsActive) {
      const result = await db.update(tools)
        .set({ isActive: false })
        .where(and(
          eq(tools.toolTypeId, id),
          eq(tools.isActive, true),
          isNull(tools.deletedAt)
        ))
        .returning({ id: tools.id });

      deactivatedToolsCount = result.length;
    }

    return c.json({ isActive: updated.isActive, deactivatedToolsCount }, 200);
  });
