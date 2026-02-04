'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { BannerInputSchema } from '@funmagic/shared/schemas';
import { parseFormData } from '@/lib/validate';
import type { FormState } from '@/lib/form-types';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

interface CreateFormState extends FormState {
  bannerId?: string;
}

interface Banner {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string;
  link: string | null;
  linkText: string | null;
  linkTarget: string | null;
  type: string;
  position: number | null;
  badge: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

// TODO: After regenerating API types with `bun run api:generate`, replace these
// fetch calls with the typed api.GET/POST/PUT/DELETE calls

export async function getBannerById(id: string) {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/banners/${id}`, {
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { banner: Banner };
    return data.banner;
  } catch {
    return null;
  }
}

export async function createBanner(
  prevState: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  const parsed = parseFormData(BannerInputSchema, formData);
  if (!parsed.success) return parsed.state;

  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
      body: JSON.stringify({
        title: parsed.data.title,
        description: parsed.data.description || undefined,
        thumbnail: parsed.data.thumbnail,
        link: parsed.data.link || undefined,
        linkText: parsed.data.linkText || undefined,
        type: parsed.data.type as 'main' | 'side',
        position: parsed.data.position,
        badge: parsed.data.badge || undefined,
        startsAt: parsed.data.startsAt || undefined,
        endsAt: parsed.data.endsAt || undefined,
        isActive: parsed.data.isActive,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to create banner' }));
      return { success: false, message: error.error ?? 'Failed to create banner' };
    }

    const data = (await res.json()) as { banner: Banner };

    revalidatePath('/dashboard/content');

    return {
      success: true,
      message: 'Banner created successfully',
      bannerId: data.banner.id,
    };
  } catch (error) {
    console.error('Failed to create banner:', error);
    return { success: false, message: 'Failed to create banner' };
  }
}

export async function updateBanner(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'Missing banner ID' };

  const parsed = parseFormData(BannerInputSchema, formData);
  if (!parsed.success) return parsed.state;

  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/banners/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
      body: JSON.stringify({
        title: parsed.data.title,
        description: parsed.data.description || undefined,
        thumbnail: parsed.data.thumbnail,
        link: parsed.data.link || undefined,
        linkText: parsed.data.linkText || undefined,
        type: parsed.data.type as 'main' | 'side',
        position: parsed.data.position,
        badge: parsed.data.badge || undefined,
        startsAt: parsed.data.startsAt || undefined,
        endsAt: parsed.data.endsAt || undefined,
        isActive: parsed.data.isActive,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to update banner' }));
      return { success: false, message: error.error ?? 'Failed to update banner' };
    }

    revalidatePath('/dashboard/content');

    return { success: true, message: 'Banner updated successfully' };
  } catch (error) {
    console.error('Failed to update banner:', error);
    return { success: false, message: 'Failed to update banner' };
  }
}

export async function deleteBanner(id: string) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/admin/banners/${id}`, {
    method: 'DELETE',
    headers: { cookie: cookieHeader },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to delete banner' }));
    throw new Error(error.error ?? 'Failed to delete banner');
  }

  revalidatePath('/dashboard/content');
}
