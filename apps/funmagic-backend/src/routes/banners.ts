import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, banners } from '@funmagic/database';
import { eq, and, or, isNull, lte, gte, asc, sql } from 'drizzle-orm';

// Schemas
const BannerSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string(),
  link: z.string().nullable(),
  linkText: z.string().nullable(),
  linkTarget: z.string().nullable(),
  type: z.string(),
  position: z.number().nullable(),
  badge: z.string().nullable(),
  badgeColor: z.string().nullable(),
}).openapi('Banner');

const BannersListSchema = z.object({
  banners: z.array(BannerSchema),
}).openapi('BannersList');

const CreateBannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  thumbnail: z.string().url('Thumbnail must be a valid URL'),
  link: z.string().url().optional(),
  linkText: z.string().optional(),
  linkTarget: z.enum(['_self', '_blank']).optional(),
  type: z.enum(['main', 'side']).default('main'),
  position: z.number().optional(),
  badge: z.string().optional(),
  badgeColor: z.string().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
}).openapi('CreateBanner');

const UpdateBannerSchema = CreateBannerSchema.partial().openapi('UpdateBanner');

const BannerDetailSchema = z.object({
  banner: BannerSchema.extend({
    isActive: z.boolean(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
}).openapi('BannerDetail');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('BannerError');

// Public route: List active banners
const listActiveBannersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Banners'],
  request: {
    query: z.object({
      type: z.enum(['main', 'side']).optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: BannersListSchema } },
      description: 'List of active banners',
    },
  },
});

// Schema for admin list (includes all fields)
const AdminBannerSchema = BannerSchema.extend({
  isActive: z.boolean(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('AdminBanner');

const AdminBannersListSchema = z.object({
  banners: z.array(AdminBannerSchema),
}).openapi('AdminBannersList');

// Admin routes
const listAllBannersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Banners'],
  responses: {
    200: {
      content: { 'application/json': { schema: AdminBannersListSchema } },
      description: 'List of all banners (admin)',
    },
  },
});

const getBannerRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Banners'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: BannerDetailSchema } },
      description: 'Banner details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Banner not found',
    },
  },
});

const createBannerRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Banners'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateBannerSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: BannerDetailSchema } },
      description: 'Banner created',
    },
  },
});

const updateBannerRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Banners'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateBannerSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: BannerDetailSchema } },
      description: 'Banner updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Banner not found',
    },
  },
});

const deleteBannerRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Banners'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }).openapi('DeleteSuccess') } },
      description: 'Banner deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Banner not found',
    },
  },
});

// Public routes - List active banners with scheduling filter
export const bannersPublicRoutes = new OpenAPIHono()
  .openapi(listActiveBannersRoute, async (c) => {
    const { type } = c.req.valid('query');
    const now = new Date();

    const conditions = [
      eq(banners.isActive, true),
      // Scheduling: either no dates set, or current time is within range
      or(
        and(isNull(banners.startsAt), isNull(banners.endsAt)),
        and(
          or(isNull(banners.startsAt), lte(banners.startsAt, now)),
          or(isNull(banners.endsAt), gte(banners.endsAt, now))
        )
      ),
    ];

    if (type) {
      conditions.push(eq(banners.type, type));
    }

    const activeBanners = await db.query.banners.findMany({
      where: and(...conditions),
      orderBy: [
        // Main banners first, then side
        asc(sql`CASE WHEN ${banners.type} = 'main' THEN 0 ELSE 1 END`),
        asc(banners.position),
      ],
    });

    return c.json({
      banners: activeBanners.map((b) => ({
        id: b.id,
        title: b.title,
        description: b.description,
        thumbnail: b.thumbnail,
        link: b.link,
        linkText: b.linkText,
        linkTarget: b.linkTarget,
        type: b.type,
        position: b.position,
        badge: b.badge,
        badgeColor: b.badgeColor,
      })),
    });
  });

// Helper to format banner for admin responses
function formatBannerAdmin(b: typeof banners.$inferSelect) {
  return {
    id: b.id,
    title: b.title,
    description: b.description,
    thumbnail: b.thumbnail,
    link: b.link,
    linkText: b.linkText,
    linkTarget: b.linkTarget,
    type: b.type,
    position: b.position,
    badge: b.badge,
    badgeColor: b.badgeColor,
    isActive: b.isActive,
    startsAt: b.startsAt?.toISOString() ?? null,
    endsAt: b.endsAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

// Admin routes - Full CRUD
export const bannersAdminRoutes = new OpenAPIHono()
  .openapi(listAllBannersRoute, async (c) => {
    const allBanners = await db.query.banners.findMany({
      orderBy: [
        asc(sql`CASE WHEN ${banners.type} = 'main' THEN 0 ELSE 1 END`),
        asc(banners.position),
      ],
    });

    return c.json({
      banners: allBanners.map(formatBannerAdmin),
    }, 200);
  })
  .openapi(getBannerRoute, async (c) => {
    const { id } = c.req.valid('param');

    const banner = await db.query.banners.findFirst({
      where: eq(banners.id, id),
    });

    if (!banner) {
      return c.json({ error: 'Banner not found' }, 404);
    }

    return c.json({
      banner: formatBannerAdmin(banner),
    }, 200);
  })
  .openapi(createBannerRoute, async (c) => {
    const data = c.req.valid('json');

    const [banner] = await db.insert(banners).values({
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      link: data.link,
      linkText: data.linkText,
      linkTarget: data.linkTarget,
      type: data.type,
      position: data.position,
      badge: data.badge,
      badgeColor: data.badgeColor,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    }).returning();

    return c.json({
      banner: formatBannerAdmin(banner),
    }, 201);
  })
  .openapi(updateBannerRoute, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    // Check if banner exists
    const existing = await db.query.banners.findFirst({
      where: eq(banners.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Banner not found' }, 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
    if (data.link !== undefined) updateData.link = data.link;
    if (data.linkText !== undefined) updateData.linkText = data.linkText;
    if (data.linkTarget !== undefined) updateData.linkTarget = data.linkTarget;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.badge !== undefined) updateData.badge = data.badge;
    if (data.badgeColor !== undefined) updateData.badgeColor = data.badgeColor;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    if (data.endsAt !== undefined) updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;

    const [banner] = await db.update(banners)
      .set(updateData)
      .where(eq(banners.id, id))
      .returning();

    return c.json({
      banner: formatBannerAdmin(banner),
    }, 200);
  })
  .openapi(deleteBannerRoute, async (c) => {
    const { id } = c.req.valid('param');

    // Check if banner exists
    const existing = await db.query.banners.findFirst({
      where: eq(banners.id, id),
    });

    if (!existing) {
      return c.json({ error: 'Banner not found' }, 404);
    }

    await db.delete(banners).where(eq(banners.id, id));

    return c.json({ success: true }, 200);
  });
