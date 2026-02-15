import { eq, sql, and, gte } from 'drizzle-orm';
import type { DbInstance, credits, creditTransactions } from '@funmagic/database';
import { invalidateUserTierCache } from './rate-limit-config';

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

type DrizzleDB = DbInstance;

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
 * Reserve credits for a task using an atomic conditional UPDATE.
 * The WHERE clause ensures sufficient available balance, preventing race conditions
 * where concurrent requests could over-reserve credits.
 */
export async function reserveCredits(
  db: DrizzleDB,
  creditsTable: typeof credits,
  transactionsTable: typeof creditTransactions,
  params: ReserveCreditsParams
): Promise<{ success: boolean; error?: string; balanceAfter?: number }> {
  const { userId, amount, taskId, description } = params;

  // Atomic conditional update: only succeeds if available balance is sufficient.
  // The condition `balance - reserved_balance >= amount` is checked atomically
  // by the database, eliminating the read-then-write race condition.
  const updated = await db.update(creditsTable)
    .set({
      reservedBalance: sql`${creditsTable.reservedBalance} + ${amount}`,
    })
    .where(
      and(
        eq(creditsTable.userId, userId),
        gte(sql`${creditsTable.balance} - ${creditsTable.reservedBalance}`, amount),
      )
    )
    .returning() as unknown as (typeof credits.$inferSelect)[];

  if (updated.length === 0) {
    // Either user has no credit record or insufficient balance
    const balance = await getBalance(db, creditsTable, userId);
    return {
      success: false,
      error: `Insufficient credits. Available: ${balance.availableBalance}, Required: ${amount}`,
    };
  }

  const row = updated[0];
  const availableAfter = row.balance - (row.reservedBalance ?? 0);

  // Create a transaction record for the reservation
  const idempotencyKey = `reserve-${taskId}`;
  await db.insert(transactionsTable).values({
    userId,
    type: 'reservation',
    amount: -amount,
    balanceAfter: availableAfter,
    description: description || `Reserved for task ${taskId}`,
    referenceType: 'task',
    referenceId: taskId,
    idempotencyKey,
  });

  return {
    success: true,
    balanceAfter: availableAfter,
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
    amount: amount,
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
 * Add credits to a user's balance (purchase or bonus).
 * Uses INSERT ... ON CONFLICT for atomic upsert to prevent race conditions.
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

  // Upsert: create credit record if it doesn't exist, otherwise update atomically.
  // This eliminates the read-then-write race in the original get-or-create pattern.
  const lifetimePurchasedIncr = type === 'purchase' ? amount : 0;
  const lifetimeRefundedIncr = type === 'refund' ? amount : 0;

  const [updated] = await db.insert(creditsTable)
    .values({
      userId,
      balance: amount,
      reservedBalance: 0,
      lifetimePurchased: lifetimePurchasedIncr,
      lifetimeUsed: 0,
      lifetimeRefunded: lifetimeRefundedIncr,
    })
    .onConflictDoUpdate({
      target: creditsTable.userId,
      set: {
        balance: sql`${creditsTable.balance} + ${amount}`,
        lifetimePurchased: sql`${creditsTable.lifetimePurchased} + ${lifetimePurchasedIncr}`,
        lifetimeRefunded: sql`${creditsTable.lifetimeRefunded} + ${lifetimeRefundedIncr}`,
      },
    })
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

  // Invalidate tier cache when credits are purchased so rate limits update
  if (type === 'purchase') {
    await invalidateUserTierCache(userId);
  }

  return {
    success: true,
    balanceAfter: updated.balance,
  };
}
