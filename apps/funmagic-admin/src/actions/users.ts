'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

// TODO: After regenerating API types with `bun run api:generate`, replace these
// fetch calls with the typed api.PATCH/POST calls

export async function updateUserRole(userId: string, newRole: string) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({ role: newRole }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to update role' }));
    throw new Error(error.error ?? 'Failed to update role');
  }

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}

export async function adjustUserCredits(
  userId: string,
  amount: number,
  description: string
) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/admin/users/${userId}/credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
    body: JSON.stringify({ amount, description }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to adjust credits' }));
    throw new Error(error.error ?? 'Failed to adjust credits');
  }

  revalidatePath('/dashboard/users');
  revalidatePath(`/dashboard/users/${userId}`);
}
