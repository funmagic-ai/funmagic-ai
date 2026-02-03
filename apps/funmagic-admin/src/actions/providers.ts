'use server';

import { db, providers } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

interface FormState {
  success: boolean;
  message: string;
}

interface CreateFormState extends FormState {
  providerId?: string;
}

export async function createProvider(
  prevState: CreateFormState,
  formData: FormData
): Promise<CreateFormState> {
  try {
    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const apiKey = formData.get('apiKey') as string;
    const baseUrl = formData.get('baseUrl') as string;
    const isActive = formData.get('isActive') === 'on';

    if (!name || !displayName || !type) {
      return { success: false, message: 'Name, display name, and type are required' };
    }

    const [newProvider] = await db
      .insert(providers)
      .values({
        name,
        displayName,
        type,
        description: description || null,
        apiKey: apiKey || null,
        baseUrl: baseUrl || null,
        isActive,
      })
      .returning({ id: providers.id });

    revalidatePath('/dashboard/providers');

    return {
      success: true,
      message: 'Provider created successfully',
      providerId: newProvider.id,
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
    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const apiKey = formData.get('apiKey') as string;
    const apiSecret = formData.get('apiSecret') as string;
    const webhookSecret = formData.get('webhookSecret') as string;
    const baseUrl = formData.get('baseUrl') as string;
    const healthCheckUrl = formData.get('healthCheckUrl') as string;
    const configStr = formData.get('config') as string;
    const isActive = formData.get('isActive') === 'on';

    let config: unknown = null;
    if (configStr) {
      try {
        config = JSON.parse(configStr);
      } catch {
        return { success: false, message: 'Invalid configuration JSON' };
      }
    }

    const updateData: Record<string, unknown> = {
      name,
      displayName,
      type,
      description: description || null,
      baseUrl: baseUrl || null,
      healthCheckUrl: healthCheckUrl || null,
      config,
      isActive,
    };

    if (apiKey) {
      updateData.apiKey = apiKey;
    }
    if (apiSecret) {
      updateData.apiSecret = apiSecret;
    }
    if (webhookSecret) {
      updateData.webhookSecret = webhookSecret;
    }

    await db.update(providers).set(updateData).where(eq(providers.id, id));

    revalidatePath('/dashboard/providers');
    revalidatePath(`/dashboard/providers/${id}`);

    return { success: true, message: 'Provider updated successfully' };
  } catch (error) {
    console.error('Failed to update provider:', error);
    return { success: false, message: 'Failed to update provider' };
  }
}

export async function deleteProvider(id: string) {
  await db.delete(providers).where(eq(providers.id, id));
  revalidatePath('/dashboard/providers');
}
