'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { FormState } from '@/lib/form-types';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

export async function createAdminProvider(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const description = formData.get('description') as string;
    const apiKey = formData.get('apiKey') as string;
    const apiSecret = formData.get('apiSecret') as string;
    const baseUrlValue = formData.get('baseUrl') as string;
    const isActive = formData.get('isActive') === 'true';

    // Basic validation
    if (!name || !displayName) {
      return {
        success: false,
        message: 'Please fix the errors below',
        errors: {
          ...(name ? {} : { name: ['Name is required'] }),
          ...(displayName ? {} : { displayName: ['Display name is required'] }),
        },
      };
    }

    const body: Record<string, unknown> = {
      name: name.toLowerCase().trim(),
      displayName,
      isActive,
    };

    if (description) body.description = description;
    if (apiKey) body.apiKey = apiKey;
    if (apiSecret) body.apiSecret = apiSecret;
    if (baseUrlValue) body.baseUrl = baseUrlValue;

    const cookieHeader = (await cookies()).toString();
    const response = await fetch(`${baseUrl}/api/admin/admin-providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, message: error?.error || 'Failed to create admin provider' };
    }

    revalidatePath('/dashboard/admin-providers');

    return {
      success: true,
      message: 'Admin provider created successfully',
    };
  } catch (error) {
    console.error('Failed to create admin provider:', error);
    return { success: false, message: 'Failed to create admin provider' };
  }
}

export async function updateAdminProvider(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const id = formData.get('id') as string;
    if (!id) return { success: false, message: 'Missing provider ID' };

    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const description = formData.get('description') as string;
    const apiKey = formData.get('apiKey') as string;
    const apiSecret = formData.get('apiSecret') as string;
    const baseUrlValue = formData.get('baseUrl') as string;

    // Basic validation
    if (!name || !displayName) {
      return {
        success: false,
        message: 'Please fix the errors below',
        errors: {
          ...(name ? {} : { name: ['Name is required'] }),
          ...(displayName ? {} : { displayName: ['Display name is required'] }),
        },
      };
    }

    const body: Record<string, unknown> = {
      name: name.toLowerCase().trim(),
      displayName,
      description: description || undefined,
      baseUrl: baseUrlValue || undefined,
    };

    // Only update credentials if provided
    if (apiKey) body.apiKey = apiKey;
    if (apiSecret) body.apiSecret = apiSecret;

    const cookieHeader = (await cookies()).toString();
    const response = await fetch(`${baseUrl}/api/admin/admin-providers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, message: error?.error || 'Failed to update admin provider' };
    }

    revalidatePath('/dashboard/admin-providers');
    revalidatePath(`/dashboard/admin-providers/${id}`);
    revalidatePath('/dashboard/ai-studio'); // Refresh AI Studio to reflect provider availability

    return { success: true, message: 'Admin provider updated successfully' };
  } catch (error) {
    console.error('Failed to update admin provider:', error);
    return { success: false, message: 'Failed to update admin provider' };
  }
}

export async function toggleAdminProviderActive(id: string, isActive: boolean) {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${baseUrl}/api/admin/admin-providers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      cookie: cookieHeader,
    },
    body: JSON.stringify({ isActive }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || 'Failed to toggle admin provider status');
  }

  revalidatePath('/dashboard/admin-providers');
  revalidatePath(`/dashboard/admin-providers/${id}`);
  revalidatePath('/dashboard/ai-studio');
}

export async function deleteAdminProvider(id: string) {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${baseUrl}/api/admin/admin-providers/${id}`, {
    method: 'DELETE',
    headers: {
      cookie: cookieHeader,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error || 'Failed to delete admin provider');
  }

  revalidatePath('/dashboard/admin-providers');
  revalidatePath('/dashboard/ai-studio');
}
