import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, credits, creditTransactions, creditPackages } from '@funmagic/database';
import { eq, desc, asc } from 'drizzle-orm';

// Schemas
const BalanceSchema = z.object({
  balance: z.number(),
  availableBalance: z.number(),
  reservedBalance: z.number(),
  lifetimePurchased: z.number(),
  lifetimeUsed: z.number(),
  lifetimeRefunded: z.number(),
}).openapi('Balance');

const TransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  amount: z.number(),
  balanceAfter: z.number(),
  description: z.string().nullable(),
  referenceType: z.string().nullable(),
  referenceId: z.string().nullable(),
  createdAt: z.string(),
}).openapi('Transaction');

const TransactionsSchema = z.object({
  transactions: z.array(TransactionSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
}).openapi('Transactions');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('CreditsError');

const PackageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  credits: z.number(),
  bonusCredits: z.number(),
  price: z.string(),
  currency: z.string(),
  isPopular: z.boolean(),
  sortOrder: z.number(),
}).openapi('Package');

const PackagesSchema = z.object({
  packages: z.array(PackageSchema),
}).openapi('Packages');

// Routes
const getBalanceRoute = createRoute({
  method: 'get',
  path: '/balance',
  tags: ['Credits'],
  responses: {
    200: {
      content: { 'application/json': { schema: BalanceSchema } },
      description: 'User credit balance',
    },
  },
});

const getTransactionsRoute = createRoute({
  method: 'get',
  path: '/transactions',
  tags: ['Credits'],
  request: {
    query: z.object({
      type: z.string().optional(),
      limit: z.coerce.number().default(20),
      offset: z.coerce.number().default(0),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: TransactionsSchema } },
      description: 'Credit transaction history',
    },
  },
});

const getPackagesRoute = createRoute({
  method: 'get',
  path: '/packages',
  tags: ['Credits'],
  responses: {
    200: {
      content: { 'application/json': { schema: PackagesSchema } },
      description: 'Available credit packages',
    },
  },
});

// Public routes (no auth required)
export const creditsPublicRoutes = new OpenAPIHono()
  .openapi(getPackagesRoute, async (c) => {
    try {
      const packages = await db.query.creditPackages.findMany({
        where: eq(creditPackages.isActive, true),
        orderBy: asc(creditPackages.sortOrder),
      });

      return c.json({
        packages: packages.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          credits: p.credits,
          bonusCredits: p.bonusCredits ?? 0,
          price: p.price,
          currency: p.currency,
          isPopular: p.isPopular ?? false,
          sortOrder: p.sortOrder ?? 0,
        })),
      }, 200);
    } catch (error) {
      console.error('Failed to fetch credit packages:', error);
      return c.json({ packages: [] }, 200);
    }
  });

// Protected routes (auth required)
export const creditsRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .openapi(getBalanceRoute, async (c) => {
    const user = c.get('user');

    // Get or create credit record for user
    let creditRecord = await db.query.credits.findFirst({
      where: eq(credits.userId, user.id),
    });

    // Create credit record if it doesn't exist
    if (!creditRecord) {
      const [newCredit] = await db.insert(credits).values({
        userId: user.id,
        balance: 0,
        reservedBalance: 0,
        lifetimePurchased: 0,
        lifetimeUsed: 0,
        lifetimeRefunded: 0,
      }).returning();
      creditRecord = newCredit;
    }

    return c.json({
      balance: creditRecord.balance,
      availableBalance: creditRecord.balance - (creditRecord.reservedBalance ?? 0),
      reservedBalance: creditRecord.reservedBalance ?? 0,
      lifetimePurchased: creditRecord.lifetimePurchased ?? 0,
      lifetimeUsed: creditRecord.lifetimeUsed ?? 0,
      lifetimeRefunded: creditRecord.lifetimeRefunded ?? 0,
    }, 200);
  })
  .openapi(getTransactionsRoute, async (c) => {
    const user = c.get('user');
    const { type, limit, offset } = c.req.valid('query');

    const conditions = [eq(creditTransactions.userId, user.id)];
    if (type) {
      conditions.push(eq(creditTransactions.type, type));
    }

    const transactions = await db.query.creditTransactions.findMany({
      where: conditions.length === 1 ? conditions[0] : undefined,
      orderBy: desc(creditTransactions.createdAt),
      limit,
      offset,
    });

    // Get total count
    const allTransactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, user.id),
      columns: { id: true },
    });

    return c.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        createdAt: t.createdAt.toISOString(),
      })),
      pagination: {
        total: allTransactions.length,
        limit,
        offset,
      },
    }, 200);
  });
