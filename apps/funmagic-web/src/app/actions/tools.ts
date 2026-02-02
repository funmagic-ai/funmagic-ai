'use server'

import { api } from '@/lib/api'
import { auth } from '@funmagic/auth/server'
import { headers, cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

type CreateTaskResult =
  | {
      success: true
      taskId: string
      creditsCost: number
    }
  | {
      success: false
      error: string
      code: 'UNAUTHORIZED' | 'INSUFFICIENT_CREDITS' | 'TOOL_NOT_FOUND' | 'UNKNOWN'
    }

export async function createFigMeImageTaskAction(input: {
  toolSlug: string
  styleReferenceId: string
  imageStorageKey: string
  prompt?: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: input.toolSlug,
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

export async function createFigMe3DTaskAction(input: {
  toolSlug: string
  parentTaskId: string
  sourceAssetId: string
  sourceImageUrl: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: input.toolSlug,
      stepId: '3d-gen',
      parentTaskId: input.parentTaskId,
      input: {
        sourceAssetId: input.sourceAssetId,
        imageUrl: input.sourceImageUrl,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    if (error.error?.includes('Insufficient credits')) {
      return { success: false, error: error.error, code: 'INSUFFICIENT_CREDITS' }
    }
    return { success: false, error: error.error || 'Unknown error', code: 'UNKNOWN' }
  }

  revalidateTag(`user-credits-${session.user.id}`, 'default')
  revalidateTag(`user-assets-${session.user.id}`, 'default')

  return {
    success: true,
    taskId: data!.task.id,
    creditsCost: data!.task.creditsCost ?? 0,
  }
}

export async function createBackgroundRemoveTaskAction(input: {
  toolSlug: string
  imageStorageKey: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: input.toolSlug,
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

export async function createCrystalMemoryBgRemoveAction(input: {
  toolSlug: string
  imageStorageKey: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: input.toolSlug,
      stepId: 'background-remove',
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

export async function createCrystalMemoryVGGTAction(input: {
  toolSlug: string
  parentTaskId: string
  sourceAssetId: string
  bgRemovedImageUrl: string
}): Promise<CreateTaskResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' }
  }

  const { data, error } = await api.POST('/api/tasks', {
    body: {
      toolSlug: input.toolSlug,
      stepId: 'vggt',
      parentTaskId: input.parentTaskId,
      input: {
        sourceAssetId: input.sourceAssetId,
        bgRemovedImageUrl: input.bgRemovedImageUrl,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    if (error.error?.includes('Insufficient credits')) {
      return { success: false, error: error.error, code: 'INSUFFICIENT_CREDITS' }
    }
    return { success: false, error: error.error || 'Unknown error', code: 'UNKNOWN' }
  }

  revalidateTag(`user-credits-${session.user.id}`, 'default')
  revalidateTag(`user-assets-${session.user.id}`, 'default')

  return {
    success: true,
    taskId: data!.task.id,
    creditsCost: data!.task.creditsCost ?? 0,
  }
}

export async function getTaskStatusAction(taskId: string): Promise<{
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed'
  output?: unknown
  error?: string
}> {
  const { data, error } = await api.GET('/api/tasks/{taskId}', {
    params: { path: { taskId } },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    return { status: 'failed', error: error.error }
  }

  return {
    status: data!.task.status as 'pending' | 'queued' | 'processing' | 'completed' | 'failed',
    output: data!.task.payload?.output,
    error: undefined,
  }
}

export async function saveTaskOutputAction(taskId: string): Promise<{
  success: boolean
  assetId?: string
  error?: string
}> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data } = await api.GET('/api/tasks/{taskId}', {
    params: { path: { taskId } },
    headers: { cookie: (await cookies()).toString() },
  })

  const output = data?.task?.payload?.output as { assetId?: string } | undefined
  if (!output?.assetId) {
    return { success: false, error: 'No asset found in task output' }
  }

  revalidateTag(`user-assets-${session.user.id}`, 'default')

  return { success: true, assetId: output.assetId }
}
