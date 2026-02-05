'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { ToolInputSchema } from '@funmagic/shared/schemas';
import { parseFormData } from '@/lib/validate';
import type { FormState } from '@/lib/form-types';

interface CreateFormState extends FormState {
  toolId?: string;
}

export async function createTool(
  prevState: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  const parsed = parseFormData(ToolInputSchema, formData);
  if (!parsed.success) return parsed.state;

  // Parse config from formData if provided
  let config: Record<string, unknown> = {};
  const configStr = formData.get('config') as string;
  if (configStr) {
    try {
      config = JSON.parse(configStr);
    } catch {
      return { success: false, message: 'Invalid configuration JSON' };
    }
  }

  try {
    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.POST('/api/admin/tools', {
      body: {
        slug: parsed.data.slug,
        title: parsed.data.title,
        shortDescription: parsed.data.shortDescription || undefined,
        description: parsed.data.description || undefined,
        toolTypeId: parsed.data.toolTypeId,
        thumbnail: parsed.data.thumbnail || undefined,
        isActive: parsed.data.isActive,
        isFeatured: parsed.data.isFeatured,
        config,
      },
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to create tool' };
    }

    revalidatePath('/dashboard/tools');

    return { success: true, message: 'Tool created successfully', toolId: data.tool.id };
  } catch (error) {
    console.error('Failed to create tool:', error);
    return { success: false, message: 'Failed to create tool' };
  }
}

export async function updateToolGeneral(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'Missing tool ID' };

  const parsed = parseFormData(ToolInputSchema, formData);
  if (!parsed.success) return parsed.state;

  try {
    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.PUT('/api/admin/tools/{id}', {
      params: { path: { id } },
      body: {
        slug: parsed.data.slug,
        title: parsed.data.title,
        shortDescription: parsed.data.shortDescription || undefined,
        description: parsed.data.description || undefined,
        toolTypeId: parsed.data.toolTypeId,
        thumbnail: parsed.data.thumbnail || undefined,
        isActive: parsed.data.isActive,
        isFeatured: parsed.data.isFeatured,
      },
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to update tool' };
    }

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

    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.PUT('/api/admin/tools/{id}', {
      params: { path: { id } },
      body: { config },
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to save configuration' };
    }

    revalidatePath('/dashboard/tools');
    revalidatePath(`/dashboard/tools/${id}`);

    return { success: true, message: 'Configuration saved successfully' };
  } catch (error) {
    console.error('Failed to update tool config:', error);
    return { success: false, message: 'Failed to save configuration' };
  }
}

/**
 * Unified update action that saves both general info and config together
 */
export async function updateTool(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'Missing tool ID' };

  const parsed = parseFormData(ToolInputSchema, formData);
  if (!parsed.success) return parsed.state;

  // Parse config from formData
  let config: Record<string, unknown> | undefined;
  const configStr = formData.get('config') as string;
  if (configStr) {
    try {
      config = JSON.parse(configStr);
    } catch {
      return { success: false, message: 'Invalid configuration JSON' };
    }
  }

  try {
    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.PUT('/api/admin/tools/{id}', {
      params: { path: { id } },
      body: {
        slug: parsed.data.slug,
        title: parsed.data.title,
        shortDescription: parsed.data.shortDescription || undefined,
        description: parsed.data.description || undefined,
        toolTypeId: parsed.data.toolTypeId,
        thumbnail: parsed.data.thumbnail || undefined,
        isActive: parsed.data.isActive,
        isFeatured: parsed.data.isFeatured,
        config,
      },
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to update tool' };
    }

    revalidatePath('/dashboard/tools');
    revalidatePath(`/dashboard/tools/${id}`);

    return { success: true, message: 'Tool updated successfully' };
  } catch (error) {
    console.error('Failed to update tool:', error);
    return { success: false, message: 'Failed to update tool' };
  }
}

export async function toggleToolStatus(id: string, field: 'isActive' | 'isFeatured') {
  const cookieHeader = (await cookies()).toString();
  const endpoint = field === 'isActive'
    ? '/api/admin/tools/{id}/toggle-active'
    : '/api/admin/tools/{id}/toggle-featured';

  const { error } = await api.PATCH(endpoint as '/api/admin/tools/{id}/toggle-active', {
    params: { path: { id } },
    headers: { cookie: cookieHeader },
  });

  if (error) {
    throw new Error(error.error ?? `Failed to toggle ${field}`);
  }

  revalidatePath('/dashboard/tools');
}
