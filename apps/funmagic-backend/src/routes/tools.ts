import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, tools, toolTypes } from '@funmagic/database';
import { eq, and, ilike, or, sql, count, isNull } from 'drizzle-orm';
import { ToolsListSchema, ToolDetailSchema, ErrorSchema } from '../schemas';

const listToolsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tools'],
  request: {
    query: z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(12),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ToolsListSchema } },
      description: 'List of active tools',
    },
  },
});

const getToolRoute = createRoute({
  method: 'get',
  path: '/{slug}',
  tags: ['Tools'],
  request: {
    params: z.object({ slug: z.string() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: ToolDetailSchema } },
      description: 'Tool details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Tool not found',
    },
  },
});

export const toolsRoutes = new OpenAPIHono()
  .openapi(listToolsRoute, async (c) => {
    try {
      const { q, category, page, limit } = c.req.valid('query');
      const offset = (page - 1) * limit;

      // Build where conditions - only show active, non-deleted tools
      const conditions = [eq(tools.isActive, true), isNull(tools.deletedAt)];

      if (q) {
        conditions.push(
          or(
            ilike(tools.title, `%${q}%`),
            ilike(tools.description, `%${q}%`)
          ) as typeof conditions[0]
        );
      }

      // Get all tool types for categories filter
      const allToolTypes = await db.query.toolTypes.findMany();

      // If category filter, find the tool type ID
      if (category) {
        const toolType = allToolTypes.find(t => t.name === category);
        if (toolType) {
          conditions.push(eq(tools.toolTypeId, toolType.id));
        }
      }

      // Get total count for pagination
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(tools)
        .where(whereClause);

      // Get paginated tools
      const allTools = await db.query.tools.findMany({
        where: whereClause,
        with: {
          toolType: true,
        },
        limit,
        offset,
      });

      const totalPages = Math.ceil(totalCount / limit);

      return c.json({
        tools: allTools.map((t) => ({
          id: t.id,
          slug: t.slug,
          title: t.title,
          description: t.description,
          thumbnail: t.thumbnail,
          category: t.toolType?.displayName,
        })),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
      },
        categories: allToolTypes.map(t => ({
          id: t.id,
          name: t.name,
          displayName: t.displayName,
        })),
      });
    } catch (error) {
      console.error('Failed to fetch tools:', error);
      return c.json({
        tools: [],
        pagination: { total: 0, page: 1, limit: 12, totalPages: 0 },
        categories: [],
      });
    }
  })
  .openapi(getToolRoute, async (c) => {
    const { slug } = c.req.valid('param');

    const tool = await db.query.tools.findFirst({
      where: and(eq(tools.slug, slug), isNull(tools.deletedAt)),
      with: {
        toolType: true,
      },
    });

    if (!tool) {
      return c.json({ error: 'Tool not found' }, 404);
    }

    return c.json({
      tool: {
        id: tool.id,
        slug: tool.slug,
        title: tool.title,
        description: tool.description,
        shortDescription: tool.shortDescription,
        thumbnail: tool.thumbnail,
        config: tool.config,
        isActive: tool.isActive,
        isFeatured: tool.isFeatured,
        usageCount: tool.usageCount,
      },
    }, 200);
  });
