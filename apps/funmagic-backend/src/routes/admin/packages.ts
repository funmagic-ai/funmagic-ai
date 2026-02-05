import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, creditPackages } from '@funmagic/database';
import { eq, asc, isNull, and } from 'drizzle-orm';

// Schemas
const PackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  credits: z.number(),
  bonusCredits: z.number(),
  price: z.string(),
  currency: z.string(),
  isPopular: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('CreditPackage');

const PackagesListSchema = z.object({
  packages: z.array(PackageSchema),
}).openapi('CreditPackagesList');

const CreatePackageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  credits: z.number().min(1, 'Credits must be at least 1'),
  bonusCredits: z.number().min(0).optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  currency: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
}).openapi('CreateCreditPackage');

const UpdatePackageSchema = CreatePackageSchema.partial().openapi('UpdateCreditPackage');

const PackageDetailSchema = z.object({
  package: PackageSchema,
}).openapi('CreditPackageDetail');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('CreditPackageError');

// Routes
const listPackagesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Credit Packages'],
  responses: {
    200: {
      content: { 'application/json': { schema: PackagesListSchema } },
      description: 'List of all credit packages',
    },
  },
});

const getPackageRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Admin - Credit Packages'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PackageDetailSchema } },
      description: 'Credit package details',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Credit package not found',
    },
  },
});

const createPackageRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Admin - Credit Packages'],
  request: {
    body: {
      content: { 'application/json': { schema: CreatePackageSchema } },
    },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: PackageDetailSchema } },
      description: 'Credit package created',
    },
  },
});

const updatePackageRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Admin - Credit Packages'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdatePackageSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PackageDetailSchema } },
      description: 'Credit package updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Credit package not found',
    },
  },
});

const deletePackageRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Admin - Credit Packages'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }).openapi('DeleteCreditPackageSuccess') } },
      description: 'Credit package deleted',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Credit package not found',
    },
  },
});

// Helper function to format package response
function formatPackage(p: typeof creditPackages.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    credits: p.credits,
    bonusCredits: p.bonusCredits ?? 0,
    price: p.price,
    currency: p.currency,
    isPopular: p.isPopular ?? false,
    isActive: p.isActive,
    sortOrder: p.sortOrder ?? 0,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const packagesRoutes = new OpenAPIHono()
  .openapi(listPackagesRoute, async (c) => {
    const allPackages = await db.query.creditPackages.findMany({
      where: isNull(creditPackages.deletedAt),
      orderBy: asc(creditPackages.sortOrder),
    });

    return c.json({
      packages: allPackages.map(formatPackage),
    }, 200);
  })
  .openapi(getPackageRoute, async (c) => {
    const { id } = c.req.valid('param');

    const pkg = await db.query.creditPackages.findFirst({
      where: and(eq(creditPackages.id, id), isNull(creditPackages.deletedAt)),
    });

    if (!pkg) {
      return c.json({ error: 'Credit package not found' }, 404);
    }

    return c.json({
      package: formatPackage(pkg),
    }, 200);
  })
  .openapi(createPackageRoute, async (c) => {
    const data = c.req.valid('json');

    const [pkg] = await db.insert(creditPackages).values({
      name: data.name,
      description: data.description,
      credits: data.credits,
      bonusCredits: data.bonusCredits ?? 0,
      price: String(data.price),
      currency: data.currency ?? 'USD',
      isPopular: data.isPopular ?? false,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    }).returning();

    return c.json({
      package: formatPackage(pkg),
    }, 201);
  })
  .openapi(updatePackageRoute, async (c) => {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');

    const existing = await db.query.creditPackages.findFirst({
      where: and(eq(creditPackages.id, id), isNull(creditPackages.deletedAt)),
    });

    if (!existing) {
      return c.json({ error: 'Credit package not found' }, 404);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.credits !== undefined) updateData.credits = data.credits;
    if (data.bonusCredits !== undefined) updateData.bonusCredits = data.bonusCredits;
    if (data.price !== undefined) updateData.price = String(data.price);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const [pkg] = await db.update(creditPackages)
      .set(updateData)
      .where(eq(creditPackages.id, id))
      .returning();

    return c.json({
      package: formatPackage(pkg),
    }, 200);
  })
  .openapi(deletePackageRoute, async (c) => {
    const { id } = c.req.valid('param');

    const existing = await db.query.creditPackages.findFirst({
      where: and(eq(creditPackages.id, id), isNull(creditPackages.deletedAt)),
    });

    if (!existing) {
      return c.json({ error: 'Credit package not found' }, 404);
    }

    // Soft delete by setting deletedAt timestamp
    await db.update(creditPackages)
      .set({ deletedAt: new Date() })
      .where(eq(creditPackages.id, id));

    return c.json({ success: true }, 200);
  });
