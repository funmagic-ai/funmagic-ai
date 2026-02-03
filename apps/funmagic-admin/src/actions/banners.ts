'use server';

import { db, banners } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface FormState {
  success: boolean;
  message: string;
  bannerId?: string;
}

export async function createBanner(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const thumbnail = formData.get('thumbnail') as string;
    const link = formData.get('link') as string;
    const linkText = formData.get('linkText') as string;
    const type = formData.get('type') as string;
    const position = parseInt(formData.get('position') as string) || 0;
    const badge = formData.get('badge') as string;
    const startsAt = formData.get('startsAt') as string;
    const endsAt = formData.get('endsAt') as string;
    const isActive = formData.get('isActive') === 'on';

    if (!title || !thumbnail) {
      return { success: false, message: 'Title and banner image are required' };
    }

    const [newBanner] = await db
      .insert(banners)
      .values({
        title,
        description: description || null,
        thumbnail,
        link: link || null,
        linkText: linkText || null,
        type,
        position,
        badge: badge || null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive,
      })
      .returning({ id: banners.id });

    revalidatePath('/dashboard/content');

    return {
      success: true,
      message: 'Banner created successfully',
      bannerId: newBanner.id,
    };
  } catch (error) {
    console.error('Failed to create banner:', error);
    return { success: false, message: 'Failed to create banner' };
  }
}

export async function updateBanner(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnail = formData.get('thumbnail') as string;
  const link = formData.get('link') as string;
  const linkText = formData.get('linkText') as string;
  const type = formData.get('type') as string;
  const position = parseInt(formData.get('position') as string) || 0;
  const badge = formData.get('badge') as string;
  const startsAt = formData.get('startsAt') as string;
  const endsAt = formData.get('endsAt') as string;
  const isActive = formData.get('isActive') === 'on';

  await db
    .update(banners)
    .set({
      title,
      description: description || null,
      thumbnail,
      link: link || null,
      linkText: linkText || null,
      type,
      position,
      badge: badge || null,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      isActive,
    })
    .where(eq(banners.id, id));

  revalidatePath('/dashboard/content');
}

export async function deleteBanner(id: string) {
  await db.delete(banners).where(eq(banners.id, id));
  revalidatePath('/dashboard/content');
}
