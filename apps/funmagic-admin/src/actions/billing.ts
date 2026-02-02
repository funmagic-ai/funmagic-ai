'use server';

import { db, creditPackages } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createPackage(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const credits = parseInt(formData.get('credits') as string);
  const bonusCredits = parseInt(formData.get('bonusCredits') as string) || 0;
  const price = formData.get('price') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
  const isPopular = formData.get('isPopular') === 'on';
  const isActive = formData.get('isActive') === 'on';

  await db.insert(creditPackages).values({
    name,
    description: description || null,
    credits,
    bonusCredits,
    price,
    currency: 'USD',
    sortOrder,
    isPopular,
    isActive,
  });

  revalidatePath('/dashboard/billing');
}

export async function updatePackage(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const credits = parseInt(formData.get('credits') as string);
  const bonusCredits = parseInt(formData.get('bonusCredits') as string) || 0;
  const price = formData.get('price') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
  const isPopular = formData.get('isPopular') === 'on';
  const isActive = formData.get('isActive') === 'on';

  await db
    .update(creditPackages)
    .set({
      name,
      description: description || null,
      credits,
      bonusCredits,
      price,
      sortOrder,
      isPopular,
      isActive,
    })
    .where(eq(creditPackages.id, id));

  revalidatePath('/dashboard/billing');
}

export async function deletePackage(id: string) {
  await db.delete(creditPackages).where(eq(creditPackages.id, id));
  revalidatePath('/dashboard/billing');
}
