import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, credits, creditTransactions, creditPackages, tasks } from '@funmagic/database';
import { eq, desc, asc, isNull, and, inArray } from 'drizzle-orm';
import {
  getLocalizedCreditPackageContent,
  type SupportedLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  type TranslationsRecord,
  type CreditPackageTranslationContent,
} from '@funmagic/shared';
import { ErrorSchema } from '../schemas';

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
  request: {
    query: z.object({
      locale: z.enum(SUPPORTED_LOCALES).optional(),
    }),
  },
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
      const { locale = DEFAULT_LOCALE } = c.req.valid('query');

      const packages = await db.query.creditPackages.findMany({
        where: eq(creditPackages.isActive, true),
        orderBy: asc(creditPackages.sortOrder),
      });

      return c.json({
        packages: packages.map((p) => {
          // Get localized content from translations
          const translations = p.translations as TranslationsRecord<CreditPackageTranslationContent>;
          const localizedContent = getLocalizedCreditPackageContent(
            translations,
            locale as SupportedLocale
          );

          return {
            id: p.id,
            name: localizedContent.name,
            description: localizedContent.description ?? null,
            credits: p.credits,
            bonusCredits: p.bonusCredits ?? 0,
            price: p.price,
            currency: p.currency,
            isPopular: p.isPopular ?? false,
            sortOrder: p.sortOrder ?? 0,
          };
        }),
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

    // Internal bookkeeping types hidden from user-facing list by default
    const internalTypes = ['reservation', 'release'];

    const conditions = [eq(creditTransactions.userId, user.id)];
    if (type) {
      conditions.push(eq(creditTransactions.type, type));
    }

    // Fetch all user transactions (we group in memory for per-task aggregation)
    const allRaw = await db.query.creditTransactions.findMany({
      where: conditions.length === 1 ? conditions[0] : and(...conditions),
      orderBy: desc(creditTransactions.createdAt),
    });

    // Filter out internal types unless explicitly requested via type filter
    const filtered = type
      ? allRaw
      : allRaw.filter(t => !internalTypes.includes(t.type));

    // Group task-related transactions by root (parent) task so multi-step
    // tools show one aggregated row instead of one per step.
    const taskRefIds = [...new Set(
      filtered
        .filter(t => t.referenceType === 'task' && t.referenceId)
        .map(t => t.referenceId!),
    )];

    const taskParentMap = new Map<string, string>();
    if (taskRefIds.length > 0) {
      const referencedTasks = await db.query.tasks.findMany({
        where: inArray(tasks.id, taskRefIds),
        columns: { id: true, parentTaskId: true },
      });
      for (const task of referencedTasks) {
        if (task.parentTaskId) {
          taskParentMap.set(task.id, task.parentTaskId);
        }
      }
    }

    // Aggregate: group by (type, rootTaskId) for task transactions
    const groupedMap = new Map<string, (typeof filtered)[0] & { _amount: number }>();
    const result: Array<(typeof filtered)[0]> = [];

    for (const tx of filtered) {
      if (tx.referenceType === 'task' && tx.referenceId) {
        const rootTaskId = taskParentMap.get(tx.referenceId) ?? tx.referenceId;
        const groupKey = `${tx.type}:${rootTaskId}`;

        const existing = groupedMap.get(groupKey);
        if (existing) {
          // Sum amounts
          existing._amount += tx.amount;
          existing.amount = existing._amount;
          // Keep the latest balanceAfter and timestamp
          if (tx.createdAt > existing.createdAt) {
            existing.balanceAfter = tx.balanceAfter;
            existing.createdAt = tx.createdAt;
          }
        } else {
          const entry = { ...tx, _amount: tx.amount, referenceId: rootTaskId };
          groupedMap.set(groupKey, entry);
        }
      } else {
        result.push(tx);
      }
    }

    // Merge grouped task transactions back and sort by date descending
    for (const entry of groupedMap.values()) {
      result.push(entry);
    }
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginate the aggregated result
    const total = result.length;
    const paginated = result.slice(offset, offset + limit);

    return c.json({
      transactions: paginated.map((t) => ({
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
        total,
        limit,
        offset,
      },
    }, 200);
  });
