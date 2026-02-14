import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, tools, toolTypes } from '@funmagic/database';
import { eq, and, ilike, or, count, isNull } from 'drizzle-orm';
import { ToolsListSchema, ToolDetailSchema, ErrorSchema } from '../schemas';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type SupportedLocale,
  type TranslationsRecord,
  type ToolTranslationContent,
  type ToolTypeTranslationContent,
  getLocalizedToolContent,
  getLocalizedToolTypeContent,
} from '@funmagic/shared';
import type { SavedToolConfig } from '@funmagic/shared/tool-registry';
import { getPublicCdnUrl } from '@funmagic/services/storage';

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
      locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
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
    query: z.object({
      locale: z.enum(SUPPORTED_LOCALES).default(DEFAULT_LOCALE),
    }),
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
      const { q, category, page, limit, locale } = c.req.valid('query');
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
        tools: allTools.map((t) => {
          const localizedContent = getLocalizedToolContent(
            t.translations as TranslationsRecord<ToolTranslationContent>,
            locale as SupportedLocale
          );
          const toolTypeTranslations = t.toolType?.translations as TranslationsRecord<ToolTypeTranslationContent> | undefined;
          const localizedToolType = toolTypeTranslations
            ? getLocalizedToolTypeContent(toolTypeTranslations, locale as SupportedLocale)
            : null;

          return {
            id: t.id,
            slug: t.slug,
            title: localizedContent.title,
            description: localizedContent.description ?? null,
            thumbnail: t.thumbnail ? getPublicCdnUrl(t.thumbnail) : null,
            category: localizedToolType?.title ?? t.toolType?.title,
          };
        }),
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages,
      },
        categories: allToolTypes.map(t => {
          const localizedToolType = getLocalizedToolTypeContent(
            t.translations as TranslationsRecord<ToolTypeTranslationContent>,
            locale as SupportedLocale
          );
          return {
            id: t.id,
            name: t.name,
            title: localizedToolType.title,
          };
        }),
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
    const { locale } = c.req.valid('query');

    const tool = await db.query.tools.findFirst({
      where: and(eq(tools.slug, slug), isNull(tools.deletedAt)),
      with: {
        toolType: true,
      },
    });

    if (!tool) {
      return c.json({ error: 'Tool not found' }, 404);
    }

    const localizedContent = getLocalizedToolContent(
      tool.translations as TranslationsRecord<ToolTranslationContent>,
      locale as SupportedLocale
    );

    // Inject localized step names into config
    const savedConfig = tool.config as SavedToolConfig | undefined;
    const localizedConfig = savedConfig ? {
      ...savedConfig,
      steps: (savedConfig.steps ?? []).map(s => ({
        ...s,
        name: localizedContent.steps?.[s.id]?.name ?? s.id,
        description: localizedContent.steps?.[s.id]?.description,
      })),
    } : tool.config;

    return c.json({
      tool: {
        id: tool.id,
        slug: tool.slug,
        title: localizedContent.title,
        description: localizedContent.description ?? null,
        thumbnail: tool.thumbnail ? getPublicCdnUrl(tool.thumbnail) : null,
        config: localizedConfig,
        isActive: tool.isActive,
        isFeatured: tool.isFeatured,
        usageCount: tool.usageCount,
      },
    }, 200);
  });
