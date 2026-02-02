import { eq, sql } from 'drizzle-orm';
import type { credits, creditTransactions } from '@funmagic/database';

// Types
export interface CreditBalance {
  balance: number;
  availableBalance: number;
  reservedBalance: number;
}

export interface ReserveCreditsParams {
  userId: string;
  amount: number;
  taskId: string;
  description?: string;
}

export interface ConfirmChargeParams {
  userId: string;
  amount: number;
  taskId: string;
  description?: string;
}

export interface ReleaseCreditsParams {
  userId: string;
  amount: number;
  taskId: string;
  reason: string;
}

// Database types (to be compatible with any drizzle db instance)
type DrizzleDB = {
  query: {
    credits: {
      findFirst: (opts: { where: unknown }) => Promise<typeof credits.$inferSelect | null>;
    };
  };
  insert: (table: unknown) => {
    values: (values: unknown) => {
      returning: () => Promise<unknown[]>;
    };
  };
  update: (table: unknown) => {
    set: (values: unknown) => {
      where: (condition: unknown) => {
        returning: () => Promise<unknown[]>;
      };
    };
  };
};

/**
 * Get the credit balance for a user
 */
export async function getBalance(
  db: DrizzleDB,
  creditsTable: typeof credits,
  userId: string
): Promise<CreditBalance> {
  const creditRecord = await db.query.credits.findFirst({
    where: eq(creditsTable.userId, userId),
  });

  if (!creditRecord) {
    return {
      balance: 0,
      availableBalance: 0,
      reservedBalance: 0,
    };
  }

  return {
    balance: creditRecord.balance,
    availableBalance: creditRecord.balance - (creditRecord.reservedBalance ?? 0),
    reservedBalance: creditRecord.reservedBalance ?? 0,
  };
}

/**
 * Reserve credits for a task (optimistic lock pattern)
 * This reduces available balance without affecting actual balance
 */
export async function reserveCredits(
  db: DrizzleDB,
  creditsTable: typeof credits,
  transactionsTable: typeof creditTransactions,
  params: ReserveCreditsParams
): Promise<{ success: boolean; error?: string; balanceAfter?: number }> {
  const { userId, amount, taskId, description } = params;

  // Get current balance
  const balance = await getBalance(db, creditsTable, userId);

  // Check if user has enough available credits
  if (balance.availableBalance < amount) {
    return {
      success: false,
      error: `Insufficient credits. Available: ${balance.availableBalance}, Required: ${amount}`,
    };
  }

  // Reserve the credits (increment reservedBalance)
  const [updated] = await db.update(creditsTable)
    .set({
      reservedBalance: sql`${creditsTable.reservedBalance} + ${amount}`,
    })
    .where(eq(creditsTable.userId, userId))
    .returning() as unknown as [typeof credits.$inferSelect];

  // Create a transaction record for the reservation
  const idempotencyKey = `reserve-${taskId}`;
  await db.insert(transactionsTable).values({
    userId,
    type: 'reservation',
    amount: -amount, // Negative to indicate credits being held
    balanceAfter: updated.balance - (updated.reservedBalance ?? 0),
    description: description || `Reserved for task ${taskId}`,
    referenceType: 'task',
    referenceId: taskId,
    idempotencyKey,
  });

  return {
    success: true,
    balanceAfter: updated.balance - (updated.reservedBalance ?? 0),
  };
}

/**
 * Confirm a credit charge (finalize a reservation)
 * This actually deducts from the balance and releases the reservation
 */
export async function confirmCharge(
  db: DrizzleDB,
  creditsTable: typeof credits,
  transactionsTable: typeof creditTransactions,
  params: ConfirmChargeParams
): Promise<{ success: boolean; error?: string; balanceAfter?: number }> {
  const { userId, amount, taskId, description } = params;

  // Update: reduce balance and reservedBalance
  const [updated] = await db.update(creditsTable)
    .set({
      balance: sql`${creditsTable.balance} - ${amount}`,
      reservedBalance: sql`${creditsTable.reservedBalance} - ${amount}`,
      lifetimeUsed: sql`${creditsTable.lifetimeUsed} + ${amount}`,
    })
    .where(eq(creditsTable.userId, userId))
    .returning() as unknown as [typeof credits.$inferSelect];

  // Create a transaction record for the usage
  const idempotencyKey = `usage-${taskId}`;
  await db.insert(transactionsTable).values({
    userId,
    type: 'usage',
    amount: -amount,
    balanceAfter: updated.balance,
    description: description || `Used for task ${taskId}`,
    referenceType: 'task',
    referenceId: taskId,
    idempotencyKey,
  });

  return {
    success: true,
    balanceAfter: updated.balance,
  };
}

/**
 * Release reserved credits (rollback a reservation)
 * Used when a task fails or is cancelled
 */
export async function releaseCredits(
  db: DrizzleDB,
  creditsTable: typeof credits,
  transactionsTable: typeof creditTransactions,
  params: ReleaseCreditsParams
): Promise<{ success: boolean; balanceAfter?: number }> {
  const { userId, amount, taskId, reason } = params;

  // Release: only reduce reservedBalance (balance stays the same)
  const [updated] = await db.update(creditsTable)
    .set({
      reservedBalance: sql`${creditsTable.reservedBalance} - ${amount}`,
    })
    .where(eq(creditsTable.userId, userId))
    .returning() as unknown as [typeof credits.$inferSelect];

  // Create a transaction record for the release
  const idempotencyKey = `release-${taskId}`;
  await db.insert(transactionsTable).values({
    userId,
    type: 'release',
    amount: amount, // Positive to indicate credits being returned
    balanceAfter: updated.balance - (updated.reservedBalance ?? 0),
    description: reason,
    referenceType: 'task',
    referenceId: taskId,
    idempotencyKey,
  });

  return {
    success: true,
    balanceAfter: updated.balance - (updated.reservedBalance ?? 0),
  };
}

/**
 * Add credits to a user's balance (purchase or bonus)
 */
export async function addCredits(
  db: DrizzleDB,
  creditsTable: typeof credits,
  transactionsTable: typeof creditTransactions,
  params: {
    userId: string;
    amount: number;
    type: 'purchase' | 'bonus' | 'refund';
    description?: string;
    referenceType?: string;
    referenceId?: string;
    idempotencyKey?: string;
  }
): Promise<{ success: boolean; balanceAfter?: number }> {
  const { userId, amount, type, description, referenceType, referenceId, idempotencyKey } = params;

  // Get or create credit record
  let creditRecord = await db.query.credits.findFirst({
    where: eq(creditsTable.userId, userId),
  });

  if (!creditRecord) {
    const [newRecord] = await db.insert(creditsTable).values({
      userId,
      balance: 0,
      reservedBalance: 0,
      lifetimePurchased: 0,
      lifetimeUsed: 0,
      lifetimeRefunded: 0,
    }).returning() as unknown as [typeof credits.$inferSelect];
    creditRecord = newRecord;
  }

  // Update balance based on type
  const updateData: Record<string, unknown> = {
    balance: sql`${creditsTable.balance} + ${amount}`,
  };

  if (type === 'purchase') {
    updateData.lifetimePurchased = sql`${creditsTable.lifetimePurchased} + ${amount}`;
  } else if (type === 'refund') {
    updateData.lifetimeRefunded = sql`${creditsTable.lifetimeRefunded} + ${amount}`;
  }

  const [updated] = await db.update(creditsTable)
    .set(updateData)
    .where(eq(creditsTable.userId, userId))
    .returning() as unknown as [typeof credits.$inferSelect];

  // Create transaction record
  await db.insert(transactionsTable).values({
    userId,
    type,
    amount,
    balanceAfter: updated.balance,
    description,
    referenceType,
    referenceId,
    idempotencyKey,
  });

  return {
    success: true,
    balanceAfter: updated.balance,
  };
}
