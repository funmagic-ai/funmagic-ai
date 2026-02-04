'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { ProviderInputSchema } from '@funmagic/shared/schemas';
import { parseFormData } from '@/lib/validate';
import type { FormState } from '@/lib/form-types';

interface CreateFormState extends FormState {
  providerId?: string;
}

export async function createProvider(
  prevState: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  const parsed = parseFormData(ProviderInputSchema, formData);
  if (!parsed.success) return parsed.state;

  try {
    // Parse config JSON string if provided
    let config: unknown = undefined;
    const configStr = parsed.data.config as string | undefined;
    if (configStr) {
      try {
        config = JSON.parse(configStr);
      } catch {
        return { success: false, message: 'Invalid configuration JSON' };
      }
    }

    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.POST('/api/admin/providers', {
      body: {
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        description: parsed.data.description || undefined,
        appId: parsed.data.appId || undefined,
        apiKey: parsed.data.apiKey || undefined,
        apiSecret: parsed.data.apiSecret || undefined,
        baseUrl: parsed.data.baseUrl || undefined,
        config,
        isActive: parsed.data.isActive,
      },
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to create provider' };
    }

    revalidatePath('/dashboard/providers');

    return {
      success: true,
      message: 'Provider created successfully',
      providerId: data.provider.id,
    };
  } catch (error) {
    console.error('Failed to create provider:', error);
    return { success: false, message: 'Failed to create provider' };
  }
}

export async function updateProvider(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const id = formData.get('id') as string;
    if (!id) return { success: false, message: 'Missing provider ID' };

    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const description = formData.get('description') as string;
    const appId = formData.get('appId') as string;
    const apiKey = formData.get('apiKey') as string;
    const apiSecret = formData.get('apiSecret') as string;
    const webhookSecret = formData.get('webhookSecret') as string;
    const baseUrl = formData.get('baseUrl') as string;
    const healthCheckUrl = formData.get('healthCheckUrl') as string;
    const configStr = formData.get('config') as string;

    // Basic validation for required fields
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

    let config: unknown = undefined;
    if (configStr) {
      try {
        config = JSON.parse(configStr);
      } catch {
        return { success: false, message: 'Invalid configuration JSON' };
      }
    }

    const body: Record<string, unknown> = {
      name,
      displayName,
      description: description || undefined,
      baseUrl: baseUrl || undefined,
      healthCheckUrl: healthCheckUrl || undefined,
      config,
    };

    if (appId) body.appId = appId;
    if (apiKey) body.apiKey = apiKey;
    if (apiSecret) body.apiSecret = apiSecret;
    if (webhookSecret) body.webhookSecret = webhookSecret;

    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.PUT('/api/admin/providers/{id}', {
      params: { path: { id } },
      body: body as never,
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to update provider' };
    }

    revalidatePath('/dashboard/providers');
    revalidatePath(`/dashboard/providers/${id}`);

    return { success: true, message: 'Provider updated successfully' };
  } catch (error) {
    console.error('Failed to update provider:', error);
    return { success: false, message: 'Failed to update provider' };
  }
}

export async function deleteProvider(id: string) {
  const cookieHeader = (await cookies()).toString();
  const { error } = await api.DELETE('/api/admin/providers/{id}', {
    params: { path: { id } },
    headers: { cookie: cookieHeader },
  });

  if (error) {
    throw new Error(error.error ?? 'Failed to delete provider');
  }

  revalidatePath('/dashboard/providers');
}

export async function toggleProviderActive(id: string, isActive: boolean) {
  const cookieHeader = (await cookies()).toString();
  const { error } = await api.PUT('/api/admin/providers/{id}', {
    params: { path: { id } },
    body: { isActive },
    headers: { cookie: cookieHeader },
  });

  if (error) {
    throw new Error(error.error ?? 'Failed to toggle provider status');
  }

  revalidatePath('/dashboard/providers');
  revalidatePath(`/dashboard/providers/${id}`);
}
