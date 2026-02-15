import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, users, credits, creditTransactions, tasks } from '@funmagic/database';
import { ERROR_CODES } from '@funmagic/shared';
import { eq, desc } from 'drizzle-orm';
import { notFound, badRequest } from '../../lib/errors';
import { ErrorSchema } from '../../schemas';

// Schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).openapi('AdminUser');

const UserWithCreditsSchema = UserSchema.extend({
  credits: z.object({
    balance: z.number(),
    lifetimePurchased: z.number(),
    lifetimeUsed: z.number(),
  }).nullable(),
}).openapi('AdminUserWithCredits');

const UsersListSchema = z.object({
  users: z.array(UserWithCreditsSchema),
}).openapi('AdminUsersList');

const UserDetailSchema = z.object({
  user: UserWithCreditsSchema,
}).openapi('AdminUserDetail');

const TransactionSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  amount: z.number(),
  balanceAfter: z.number(),
  description: z.string().nullable(),
  createdAt: z.string(),
}).openapi('AdminTransaction');

const TaskSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  creditsCost: z.number(),
  createdAt: z.string(),
  tool: z.object({
    id: z.string().uuid(),
    title: z.string(),
  }).nullable(),
}).openapi('AdminTask');

const UserFullDetailSchema = z.object({
  user: UserWithCreditsSchema,
  recentTransactions: z.array(TransactionSchema),
  recentTasks: z.array(TaskSchema),
}).openapi('AdminUserFullDetail');

const UpdateRoleSchema = z.object({
  role: z.enum(['user', 'admin', 'super_admin']),
}).openapi('UpdateUserRole');

const AdjustCreditsSchema = z.object({
  amount: z.number(),
  description: z.string().min(1, 'Description is required'),
}).openapi('AdjustUserCredits');

// Routes
const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Admin - Users'],
  request: {
    query: z.object({
      limit: z.string().transform(v => parseInt(v)).optional(),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UsersListSchema } },
      description: 'List of all users with credits',
    },
  },
});

const getUserRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Admin - Users'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserFullDetailSchema } },
      description: 'User details with credits, transactions, and tasks',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

const updateRoleRoute = createRoute({
  method: 'patch',
  path: '/{id}/role',
  tags: ['Admin - Users'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: UpdateRoleSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserDetailSchema } },
      description: 'User role updated',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

const adjustCreditsRoute = createRoute({
  method: 'post',
  path: '/{id}/credits',
  tags: ['Admin - Users'],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { 'application/json': { schema: AdjustCreditsSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UserDetailSchema } },
      description: 'User credits adjusted',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid credit adjustment',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'User not found',
    },
  },
});

// Helper functions
function formatUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    emailVerified: u.emailVerified ?? false,
    name: u.name,
    image: u.image,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  };
}

function formatCredits(c: typeof credits.$inferSelect | null | undefined) {
  if (!c) return null;
  return {
    balance: c.balance,
    lifetimePurchased: c.lifetimePurchased ?? 0,
    lifetimeUsed: c.lifetimeUsed ?? 0,
  };
}

export const usersRoutes = new OpenAPIHono()
  .openapi(listUsersRoute, async (c) => {
    const { limit } = c.req.valid('query');

    const allUsers = await db.query.users.findMany({
      orderBy: desc(users.createdAt),
      limit: limit ?? 100,
    });

    const allCredits = await db.query.credits.findMany();
    const creditsMap = new Map(allCredits.map(c => [c.userId, c]));

    return c.json({
      users: allUsers.map(u => ({
        ...formatUser(u),
        credits: formatCredits(creditsMap.get(u.id)),
      })),
    }, 200);
  })
  .openapi(getUserRoute, async (c) => {
    const { id } = c.req.valid('param');

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw notFound('User');
    }

    const userCredit = await db.query.credits.findFirst({
      where: eq(credits.userId, id),
    });

    const recentTransactions = await db.query.creditTransactions.findMany({
      where: eq(creditTransactions.userId, id),
      orderBy: desc(creditTransactions.createdAt),
      limit: 10,
    });

    const recentTasks = await db.query.tasks.findMany({
      where: eq(tasks.userId, id),
      with: { tool: true },
      orderBy: desc(tasks.createdAt),
      limit: 10,
    });

    return c.json({
      user: {
        ...formatUser(user),
        credits: formatCredits(userCredit),
      },
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        balanceAfter: tx.balanceAfter,
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
      })),
      recentTasks: recentTasks.map(t => ({
        id: t.id,
        status: t.status,
        creditsCost: t.creditsCost,
        createdAt: t.createdAt.toISOString(),
        tool: t.tool ? { id: t.tool.id, title: t.tool.title } : null,
      })),
    }, 200);
  })
  .openapi(updateRoleRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { role } = c.req.valid('json');

    const existing = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existing) {
      throw notFound('User');
    }

    await db.update(users)
      .set({ role })
      .where(eq(users.id, id));

    const updated = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    const userCredit = await db.query.credits.findFirst({
      where: eq(credits.userId, id),
    });

    return c.json({
      user: {
        ...formatUser(updated!),
        credits: formatCredits(userCredit),
      },
    }, 200);
  })
  .openapi(adjustCreditsRoute, async (c) => {
    const { id } = c.req.valid('param');
    const { amount, description } = c.req.valid('json');

    const existing = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!existing) {
      throw notFound('User');
    }

    const userCredit = await db.query.credits.findFirst({
      where: eq(credits.userId, id),
    });

    const currentBalance = userCredit?.balance ?? 0;
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw badRequest(ERROR_CODES.CREDITS_INSUFFICIENT, 'Insufficient credits');
    }

    if (userCredit) {
      await db.update(credits)
        .set({
          balance: newBalance,
          lifetimePurchased: amount > 0
            ? (userCredit.lifetimePurchased ?? 0) + amount
            : userCredit.lifetimePurchased,
        })
        .where(eq(credits.userId, id));
    } else {
      await db.insert(credits).values({
        userId: id,
        balance: newBalance,
        lifetimePurchased: amount > 0 ? amount : 0,
      });
    }

    await db.insert(creditTransactions).values({
      userId: id,
      type: amount > 0 ? 'bonus' : 'admin_debit',
      amount,
      balanceAfter: newBalance,
      description,
      referenceType: 'admin',
    });

    const updatedCredit = await db.query.credits.findFirst({
      where: eq(credits.userId, id),
    });

    return c.json({
      user: {
        ...formatUser(existing),
        credits: formatCredits(updatedCredit),
      },
    }, 200);
  });
