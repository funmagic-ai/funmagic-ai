'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { CreditPackageInputSchema } from '@funmagic/shared/schemas';
import { parseFormData } from '@/lib/validate';
import type { FormState } from '@/lib/form-types';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

interface CreateFormState extends FormState {
  packageId?: string;
}

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  bonusCredits: number;
  price: string;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

// TODO: After regenerating API types with `bun run api:generate`, replace these
// fetch calls with the typed api.GET/POST/PUT/DELETE calls

export async function getPackageById(id: string) {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/packages/${id}`, {
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { package: CreditPackage };
    return data.package;
  } catch {
    return null;
  }
}

export async function createPackage(
  prevState: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  const parsed = parseFormData(CreditPackageInputSchema, formData);
  if (!parsed.success) return parsed.state;

  // Parse translations from formData
  let translations: unknown;
  const translationsStr = formData.get('translations') as string;
  if (translationsStr) {
    try {
      translations = JSON.parse(translationsStr);
    } catch {
      return { success: false, message: 'Invalid translations JSON' };
    }
  }

  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
      body: JSON.stringify({
        name: parsed.data.name,
        description: parsed.data.description || undefined,
        credits: parsed.data.credits,
        bonusCredits: parsed.data.bonusCredits,
        price: parsed.data.price,
        sortOrder: parsed.data.sortOrder,
        isPopular: parsed.data.isPopular,
        isActive: parsed.data.isActive,
        translations,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to create package' }));
      return { success: false, message: error.error ?? 'Failed to create package' };
    }

    const data = (await res.json()) as { package: CreditPackage };

    revalidatePath('/dashboard/billing');

    return {
      success: true,
      message: 'Package created successfully',
      packageId: data.package.id,
    };
  } catch (error) {
    console.error('Failed to create package:', error);
    return { success: false, message: 'Failed to create package' };
  }
}

export async function updatePackage(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'Missing package ID' };

  const parsed = parseFormData(CreditPackageInputSchema, formData);
  if (!parsed.success) return parsed.state;

  // Parse translations from formData
  let translations: unknown;
  const translationsStr = formData.get('translations') as string;
  if (translationsStr) {
    try {
      translations = JSON.parse(translationsStr);
    } catch {
      return { success: false, message: 'Invalid translations JSON' };
    }
  }

  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${baseUrl}/api/admin/packages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
      body: JSON.stringify({
        name: parsed.data.name,
        description: parsed.data.description || undefined,
        credits: parsed.data.credits,
        bonusCredits: parsed.data.bonusCredits,
        price: parsed.data.price,
        sortOrder: parsed.data.sortOrder,
        isPopular: parsed.data.isPopular,
        isActive: parsed.data.isActive,
        translations,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to update package' }));
      return { success: false, message: error.error ?? 'Failed to update package' };
    }

    revalidatePath('/dashboard/billing');

    return { success: true, message: 'Package updated successfully' };
  } catch (error) {
    console.error('Failed to update package:', error);
    return { success: false, message: 'Failed to update package' };
  }
}

export async function deletePackage(id: string) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/admin/packages/${id}`, {
    method: 'DELETE',
    headers: { cookie: cookieHeader },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to delete package' }));
    throw new Error(error.error ?? 'Failed to delete package');
  }

  revalidatePath('/dashboard/billing');
}

export async function togglePackageStatus(id: string) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${baseUrl}/api/admin/packages/${id}/toggle-active`, {
    method: 'PATCH',
    headers: { cookie: cookieHeader },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to toggle status' }));
    throw new Error(error.error ?? 'Failed to toggle status');
  }

  revalidatePath('/dashboard/billing');
}
