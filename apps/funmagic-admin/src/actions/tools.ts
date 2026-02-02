'use server';

import { db, tools } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface FormState {
  success: boolean;
  message: string;
}

export async function updateToolGeneral(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const id = formData.get('id') as string;
    const slug = formData.get('slug') as string;
    const title = formData.get('title') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const description = formData.get('description') as string;
    const toolTypeId = formData.get('toolTypeId') as string;
    const thumbnail = formData.get('thumbnail') as string;
    const isActive = formData.get('isActive') === 'on';
    const isFeatured = formData.get('isFeatured') === 'on';

    if (!id || !slug || !title || !toolTypeId) {
      return { success: false, message: 'Missing required fields' };
    }

    await db
      .update(tools)
      .set({
        slug,
        title,
        shortDescription: shortDescription || null,
        description: description || null,
        toolTypeId,
        thumbnail: thumbnail || null,
        isActive,
        isFeatured,
      })
      .where(eq(tools.id, id));

    revalidatePath('/dashboard/tools');
    revalidatePath(`/dashboard/tools/${id}`);

    return { success: true, message: 'Tool updated successfully' };
  } catch (error) {
    console.error('Failed to update tool:', error);
    return { success: false, message: 'Failed to update tool' };
  }
}

export async function updateToolConfig(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const id = formData.get('id') as string;
    const configStr = formData.get('config') as string;

    if (!id || !configStr) {
      return { success: false, message: 'Missing required fields' };
    }

    let config: unknown;
    try {
      config = JSON.parse(configStr);
    } catch {
      return { success: false, message: 'Invalid configuration JSON' };
    }

    await db
      .update(tools)
      .set({ config })
      .where(eq(tools.id, id));

    revalidatePath('/dashboard/tools');
    revalidatePath(`/dashboard/tools/${id}`);

    return { success: true, message: 'Configuration saved successfully' };
  } catch (error) {
    console.error('Failed to update tool config:', error);
    return { success: false, message: 'Failed to save configuration' };
  }
}

export async function toggleToolStatus(id: string, field: 'isActive' | 'isFeatured') {
  const tool = await db.query.tools.findFirst({
    where: eq(tools.id, id),
  });

  if (!tool) {
    throw new Error('Tool not found');
  }

  await db
    .update(tools)
    .set({ [field]: !tool[field] })
    .where(eq(tools.id, id));

  revalidatePath('/dashboard/tools');
}
