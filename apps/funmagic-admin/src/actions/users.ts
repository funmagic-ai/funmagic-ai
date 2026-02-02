'use server';

import { db, users, credits, creditTransactions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(userId: string, newRole: string) {
  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}

export async function adjustUserCredits(
  userId: string,
  amount: number,
  description: string
) {
  const userCredit = await db.query.credits.findFirst({
    where: eq(credits.userId, userId),
  });

  const currentBalance = userCredit?.balance ?? 0;
  const newBalance = currentBalance + amount;

  if (newBalance < 0) {
    throw new Error('Insufficient credits');
  }

  if (userCredit) {
    await db
      .update(credits)
      .set({
        balance: newBalance,
        lifetimePurchased:
          amount > 0
            ? (userCredit.lifetimePurchased ?? 0) + amount
            : userCredit.lifetimePurchased,
      })
      .where(eq(credits.userId, userId));
  } else {
    await db.insert(credits).values({
      userId,
      balance: newBalance,
      lifetimePurchased: amount > 0 ? amount : 0,
    });
  }

  await db.insert(creditTransactions).values({
    userId,
    type: amount > 0 ? 'bonus' : 'admin_debit',
    amount,
    balanceAfter: newBalance,
    description,
    referenceType: 'admin',
  });

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}
