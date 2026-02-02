'use server';

import { db, toolTypes } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createToolType(formData: FormData) {
  const name = formData.get('name') as string;
  const displayName = formData.get('displayName') as string;
  const description = formData.get('description') as string;
  const icon = formData.get('icon') as string;
  const color = formData.get('color') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
  const isActive = formData.get('isActive') === 'on';

  await db.insert(toolTypes).values({
    name,
    displayName,
    description: description || null,
    icon: icon || null,
    color: color || null,
    sortOrder,
    isActive,
  });

  revalidatePath('/dashboard/tool-types');
}

export async function updateToolType(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const displayName = formData.get('displayName') as string;
  const description = formData.get('description') as string;
  const icon = formData.get('icon') as string;
  const color = formData.get('color') as string;
  const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
  const isActive = formData.get('isActive') === 'on';

  await db
    .update(toolTypes)
    .set({
      name,
      displayName,
      description: description || null,
      icon: icon || null,
      color: color || null,
      sortOrder,
      isActive,
    })
    .where(eq(toolTypes.id, id));

  revalidatePath('/dashboard/tool-types');
}

export async function deleteToolType(id: string) {
  await db.delete(toolTypes).where(eq(toolTypes.id, id));
  revalidatePath('/dashboard/tool-types');
}
