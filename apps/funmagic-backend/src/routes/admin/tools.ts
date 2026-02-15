import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, tools, toolTypes, tasks } from '@funmagic/database';
import { eq, asc, isNull, and, count } from 'drizzle-orm';
import {
  ToolTranslationsSchema,
  type ToolTranslations,
  ERROR_CODES,
} from '@funmagic/shared';
import { getPublicCdnUrl } from '@funmagic/services/storage';
import { notFound, conflict } from '../../lib/errors';
import { ErrorSchema } from '../../schemas';

// Schemas
const ToolAdminSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  toolTypeId: z.string().uuid(),
  config: z.any(),
  translations: ToolTranslationsSchema,
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  usageCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  toolType: z.object({
    id: z.string().uuid(),
    name: z.string(),
    title: z.string(),
  }).optional(),
}).openapi('ToolAdmin');

const ToolsAdminListSchema = z.object({
  tools: z.array(ToolAdminSchema),
}).openapi('ToolsAdminList');

const CreateToolSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  toolTypeId: z.string().uuid('Tool type ID must be a valid UUID'),
  config: z.any().default({}),
  translations: ToolTranslationsSchema.optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
}).openapi('CreateTool');

const UpdateToolSchema = CreateToolSchema.partial().openapi('UpdateTool');

const ToolAdminDetailSchema = z.object({
  tool: ToolAdminSchema,
}).openapi('ToolAdminDetail');

// Routes
const listToolsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Tools'],
  request: {
    query: z.object({
      includeInactive: z.string().transform(v => v === 'true').optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ToolsAdminListSchema } },
      description: 'List of all tools',
    },
  },
});

const getToolRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Admin - Tools'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ToolAdminDetailSchema } },
      description: 'Tool details with full config',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool not found',
    },
  },
});

const createToolRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Admin - Tools'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateToolSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: ToolAdminDetailSchema } },
      description: 'Tool created',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool type not found',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool slug already exists',
    },
  },
});

const updateToolRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Admin - Tools'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateToolSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ToolAdminDetailSchema } },
      description: 'Tool updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool not found',
    },
  },
});

const deleteToolRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Admin - Tools'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }).openapi('DeleteToolSuccess') } },
      description: 'Tool deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool not found',
    },
    409: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool is still referenced by active tasks',
    },
  },
});

const toggleActiveRoute = createRoute({
  method: 'patch',
  path: '/{id}/toggle-active',
  tags: ['Admin - Tools'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ isActive: z.boolean() }).openapi('ToggleActiveResponse') } },
      description: 'Tool active status toggled',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool not found',
    },
  },
});

const toggleFeaturedRoute = createRoute({
  method: 'patch',
  path: '/{id}/toggle-featured',
  tags: ['Admin - Tools'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ isFeatured: z.boolean() }).openapi('ToggleFeaturedResponse') } },
      description: 'Tool featured status toggled',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool not found',
    },
  },
});

// Helper function
function formatTool(t: typeof tools.$inferSelect & { toolType?: typeof toolTypes.$inferSelect | null }) {
  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    thumbnail: t.thumbnail ? getPublicCdnUrl(t.thumbnail) : null,
    toolTypeId: t.toolTypeId,
    config: t.config,
    translations: t.translations as ToolTranslations,
    isActive: t.isActive,
    isFeatured: t.isFeatured,
    usageCount: t.usageCount,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    toolType: t.toolType ? {
      id: t.toolType.id,
      name: t.toolType.name,
      title: t.toolType.title,
    } : undefined,
  };
}

// Helper to build translations from legacy fields
function buildTranslationsFromLegacy(
  title: string,
  description?: string,
  existingTranslations?: ToolTranslations
): ToolTranslations {
  return {
    ...existingTranslations,
    en: {
      ...existingTranslations?.en,
      title,
      description: description ?? existingTranslations?.en?.description ?? '',
    },
  };
}

export const toolsAdminRoutes = new OpenAPIHono()
  .openapi(listToolsRoute, async (c) => {
    const { includeInactive } = c.req.valid('query');

    const allTools = await db.query.tools.findMany({
      where: isNull(tools.deletedAt),
      with: { toolType: true },
      orderBy: asc(tools.title),
    });

    const filteredTools = includeInactive
      ? allTools
      : allTools.filter(t => t.isActive);

    return c.json({
      tools: filteredTools.map(formatTool),
    }, 200);
  })
  .openapi(getToolRoute, async (c) => {
    const { id } = c.req.valid('param');

    const tool = await db.query.tools.findFirst({
      where: and(eq(tools.id, id), isNull(tools.deletedAt)),
      with: { toolType: true },
    });

    if (!tool) {
      throw notFound('Tool');
    }

    return c.json({
      tool: formatTool(tool),
    }, 200);
  })
  .openapi(createToolRoute, async (c) => {
    const data = c.req.valid('json');

    // Check if slug already exists (among non-deleted tools)
    const existing = await db.query.tools.findFirst({
      where: and(eq(tools.slug, data.slug), isNull(tools.deletedAt)),
    });

    if (existing) {
      throw conflict(ERROR_CODES.TOOL_SLUG_EXISTS, 'Tool slug already exists');
    }

    // Verify tool type exists
    const toolType = await db.query.toolTypes.findFirst({
      where: eq(toolTypes.id, data.toolTypeId),
    });

    if (!toolType) {
      throw notFound('Tool type');
    }

    // Build translations: use provided translations or build from legacy fields
    const translations = data.translations ?? buildTranslationsFromLegacy(
      data.title,
      data.description
    );

    const [tool] = await db.insert(tools).values({
      slug: data.slug,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      toolTypeId: data.toolTypeId,
      config: data.config,
      translations,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
    }).returning();

    const fullTool = await db.query.tools.findFirst({
      where: eq(tools.id, tool.id),
      with: { toolType: true },
    });

    return c.json({
      tool: formatTool(fullTool!),
    }, 201);
  })
  .openapi(updateToolRoute, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const existing = await db.query.tools.findFirst({
      where: and(eq(tools.id, id), isNull(tools.deletedAt)),
    });

    if (!existing) {
      throw notFound('Tool');
    }

    const updateData: Record<string, unknown> = {};
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.toolTypeId !== undefined) updateData.toolTypeId = data.toolTypeId;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.translations !== undefined) updateData.translations = data.translations;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    // Sync legacy fields to translations.en if legacy fields change but translations don't
    if (!data.translations && (data.title !== undefined || data.description !== undefined)) {
      const existingTranslations = existing.translations as ToolTranslations;
      updateData.translations = buildTranslationsFromLegacy(
        data.title ?? existing.title,
        data.description ?? existing.description ?? undefined,
        existingTranslations
      );
    }

    await db.update(tools)
      .set(updateData)
      .where(eq(tools.id, id));

    const tool = await db.query.tools.findFirst({
      where: eq(tools.id, id),
      with: { toolType: true },
    });

    return c.json({
      tool: formatTool(tool!),
    }, 200);
  })
  .openapi(deleteToolRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.tools.findFirst({
      where: and(eq(tools.id, id), isNull(tools.deletedAt)),
    });

    if (!existing) {
      throw notFound('Tool');
    }

    // Check for active tasks referencing this tool
    const [{ count: taskCount }] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(eq(tasks.toolId, id), isNull(tasks.deletedAt)));

    if (Number(taskCount) > 0) {
      throw conflict(ERROR_CODES.TOOL_HAS_ACTIVE_TASKS, `Cannot delete tool: ${taskCount} task(s) still reference this tool`);
    }

    // Soft delete by setting deletedAt timestamp
    await db.update(tools)
      .set({ deletedAt: new Date() })
      .where(eq(tools.id, id));

    return c.json({ success: true }, 200);
  })
  .openapi(toggleActiveRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.tools.findFirst({
      where: and(eq(tools.id, id), isNull(tools.deletedAt)),
    });

    if (!existing) {
      throw notFound('Tool');
    }

    const [updated] = await db.update(tools)
      .set({ isActive: !existing.isActive })
      .where(eq(tools.id, id))
      .returning();

    return c.json({ isActive: updated.isActive }, 200);
  })
  .openapi(toggleFeaturedRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.tools.findFirst({
      where: and(eq(tools.id, id), isNull(tools.deletedAt)),
    });

    if (!existing) {
      throw notFound('Tool');
    }

    const [updated] = await db.update(tools)
      .set({ isFeatured: !existing.isFeatured })
      .where(eq(tools.id, id))
      .returning();

    return c.json({ isFeatured: updated.isFeatured }, 200);
  });
