'use server'

import { api } from '@/lib/api'
import { auth } from '@funmagic/auth/server'
import { headers, cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

import type { ToolErrorCode, ToolErrorData } from '@/lib/tool-errors'
import { parseInsufficientCreditsError } from '@/lib/tool-errors'

type CreateTaskResult =
  | { success: true; taskId: string; creditsCost: number }
  | { success: false; code: ToolErrorCode; errorData?: ToolErrorData }

export async function createImageTaskAction(input: {
  styleReferenceId: string
  imageStorageKey: string
  prompt?: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: 'figme',
      stepId: 'image-gen',
      input: {
        styleReferenceId: input.styleReferenceId,
        imageStorageKey: input.imageStorageKey,
        prompt: input.prompt,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    if (error.error?.includes('Insufficient credits')) {
      return {
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        errorData: parseInsufficientCreditsError(error.error),
      }
    }
    if (error.error?.includes('not found')) {
      return { success: false, code: 'TOOL_NOT_FOUND' }
    }
    return { success: false, code: 'UNKNOWN' }
  }

  revalidateTag(`user-credits-${session.user.id}`, 'default')

  return {
    success: true,
    taskId: data!.task.id,
    creditsCost: data!.task.creditsCost ?? 0,
  }
}

export async function create3DTaskAction(input: {
  parentTaskId: string
  sourceAssetId: string
  sourceImageUrl: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: 'figme',
      stepId: '3d-gen',
      parentTaskId: input.parentTaskId,
      input: {
        sourceAssetId: input.sourceAssetId,
        sourceImageUrl: input.sourceImageUrl,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    if (error.error?.includes('Insufficient credits')) {
      return {
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        errorData: parseInsufficientCreditsError(error.error),
      }
    }
    return { success: false, code: 'UNKNOWN' }
  }

  revalidateTag(`user-credits-${session.user.id}`, 'default')
  revalidateTag(`user-assets-${session.user.id}`, 'default')

  return {
    success: true,
    taskId: data!.task.id,
    creditsCost: data!.task.creditsCost ?? 0,
  }
}

// Note: Import shared actions directly from '@/app/actions/tools' in client components
// e.g., import { getTaskStatusAction, saveTaskOutputAction } from '@/app/actions/tools'
