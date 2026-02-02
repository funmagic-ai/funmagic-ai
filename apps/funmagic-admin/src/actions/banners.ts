'use server';

import { db, banners } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createBanner(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const thumbnail = formData.get('thumbnail') as string;
  const link = formData.get('link') as string;
  const linkText = formData.get('linkText') as string;
  const type = formData.get('type') as string;
  const position = parseInt(formData.get('position') as string) || 0;
  const badge = formData.get('badge') as string;
  const badgeColor = formData.get('badgeColor') as string;
  const startsAt = formData.get('startsAt') as string;
  const endsAt = formData.get('endsAt') as string;
  const isActive = formData.get('isActive') === 'on';

  await db.insert(banners).values({
    title,
    description: description || null,
    thumbnail,
    link: link || null,
    linkText: linkText || null,
    type,
    position,
    badge: badge || null,
    badgeColor: badgeColor || null,
    startsAt: startsAt ? new Date(startsAt) : null,
    endsAt: endsAt ? new Date(endsAt) : null,
    isActive,
  });

  revalidatePath('/dashboard/content');
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
  const badgeColor = formData.get('badgeColor') as string;
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
      badgeColor: badgeColor || null,
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
