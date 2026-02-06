'use server';

import { cookies } from 'next/headers';
import { api } from '@/lib/api';
import { revalidatePath } from 'next/cache';
import { ToolTypeInputSchema, type ToolTypeTranslations } from '@funmagic/shared/schemas';
import { parseFormData } from '@/lib/validate';
import type { FormState } from '@/lib/form-types';

interface CreateFormState extends FormState {
  toolTypeId?: string;
}

export async function getToolTypeById(id: string) {
  const cookieHeader = (await cookies()).toString();
  const { data, error } = await api.GET('/api/admin/tool-types/{id}', {
    params: { path: { id } },
    headers: { cookie: cookieHeader },
  });

  if (error || !data) {
    return null;
  }

  return data.toolType;
}

export async function createToolType(
  prevState: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  const parsed = parseFormData(ToolTypeInputSchema, formData);
  if (!parsed.success) return parsed.state;

  // Parse translations from formData
  let translations: ToolTypeTranslations | undefined;
  const translationsStr = formData.get('translations') as string;
  if (translationsStr) {
    try {
      translations = JSON.parse(translationsStr) as ToolTypeTranslations;
    } catch {
      return { success: false, message: 'Invalid translations JSON' };
    }
  }

  try {
    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.POST('/api/admin/tool-types', {
      body: {
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        description: parsed.data.description || undefined,
        translations,
        isActive: parsed.data.isActive,
      },
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to create tool type' };
    }

    revalidatePath('/dashboard/tool-types');

    return {
      success: true,
      message: 'Tool type created successfully',
      toolTypeId: data.toolType.id,
    };
  } catch (error) {
    console.error('Failed to create tool type:', error);
    return { success: false, message: 'Failed to create tool type' };
  }
}

export async function updateToolType(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const id = formData.get('id') as string;
  if (!id) return { success: false, message: 'Missing tool type ID' };

  const parsed = parseFormData(ToolTypeInputSchema, formData);
  if (!parsed.success) return parsed.state;

  // Parse translations from formData
  let translations: ToolTypeTranslations | undefined;
  const translationsStr = formData.get('translations') as string;
  if (translationsStr) {
    try {
      translations = JSON.parse(translationsStr) as ToolTypeTranslations;
    } catch {
      return { success: false, message: 'Invalid translations JSON' };
    }
  }

  try {
    const cookieHeader = (await cookies()).toString();
    const { data, error } = await api.PUT('/api/admin/tool-types/{id}', {
      params: { path: { id } },
      body: {
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        description: parsed.data.description || undefined,
        translations,
        isActive: parsed.data.isActive,
      },
      headers: { cookie: cookieHeader },
    });

    if (error || !data) {
      return { success: false, message: error?.error ?? 'Failed to update tool type' };
    }

    revalidatePath('/dashboard/tool-types');

    return { success: true, message: 'Tool type updated successfully' };
  } catch (error) {
    console.error('Failed to update tool type:', error);
    return { success: false, message: 'Failed to update tool type' };
  }
}

export async function deleteToolType(id: string) {
  const cookieHeader = (await cookies()).toString();
  const { error } = await api.DELETE('/api/admin/tool-types/{id}', {
    params: { path: { id } },
    headers: { cookie: cookieHeader },
  });

  if (error) {
    throw new Error(error.error ?? 'Failed to delete tool type');
  }

  revalidatePath('/dashboard/tool-types');
}

export async function getActiveToolsCountForToolType(id: string): Promise<number> {
  const cookieHeader = (await cookies()).toString();
  const { data, error } = await api.GET('/api/admin/tool-types/{id}/active-tools-count' as '/api/admin/tool-types/{id}', {
    params: { path: { id } },
    headers: { cookie: cookieHeader },
  });

  if (error || !data) {
    return 0;
  }

  return (data as unknown as { count: number }).count;
}

export async function toggleToolTypeStatus(id: string) {
  const cookieHeader = (await cookies()).toString();
  const { error } = await api.PATCH('/api/admin/tool-types/{id}/toggle-active' as '/api/admin/tools/{id}/toggle-active', {
    params: { path: { id } },
    headers: { cookie: cookieHeader },
  });

  if (error) {
    throw new Error(error.error ?? 'Failed to toggle status');
  }

  revalidatePath('/dashboard/tool-types');
  revalidatePath('/dashboard/tools');
}
