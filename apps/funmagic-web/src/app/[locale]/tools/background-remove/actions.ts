'use server'

import { api } from '@/lib/api'
import { auth } from '@funmagic/auth/server'
import { headers, cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

type CreateTaskResult =
  | { success: true; taskId: string; creditsCost: number }
  | { success: false; error: string; code: 'UNAUTHORIZED' | 'INSUFFICIENT_CREDITS' | 'TOOL_NOT_FOUND' | 'UNKNOWN' }

export async function createTaskAction(input: {
  imageStorageKey: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: 'background-remove',
      stepId: 'remove-bg',
      input: {
        imageStorageKey: input.imageStorageKey,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    if (error.error?.includes('Insufficient credits')) {
      return { success: false, error: error.error, code: 'INSUFFICIENT_CREDITS' }
    }
    if (error.error?.includes('not found')) {
      return { success: false, error: error.error, code: 'TOOL_NOT_FOUND' }
    }
    return { success: false, error: error.error || 'Unknown error', code: 'UNKNOWN' }
  }

  revalidateTag(`user-credits-${session.user.id}`, 'default')

  return {
    success: true,
    taskId: data!.task.id,
    creditsCost: data!.task.creditsCost ?? 0,
  }
}

// Re-export shared actions that aren't tool-specific
export { getTaskStatusAction, saveTaskOutputAction } from '@/app/actions/tools'
