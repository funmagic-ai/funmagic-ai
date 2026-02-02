'use server'

import { api } from '@/lib/api'
import { auth } from '@funmagic/auth/server'
import { headers, cookies } from 'next/headers'
import { revalidateTag } from 'next/cache'

export async function deleteAssetAction(assetId: string): Promise<{
  success: boolean
  error?: string
}> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await api.DELETE('/api/assets/{id}', {
    params: { path: { id: assetId } },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    return { success: false, error: error.error || 'Failed to delete asset' }
  }

  revalidateTag(`user-assets-${session.user.id}`, 'default')

  return { success: true }
}

export async function getAssetDownloadUrlAction(assetId: string): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const { data, error } = await api.GET('/api/assets/{id}/url', {
    params: { path: { id: assetId } },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    return { success: false, error: error.error || 'Failed to get download URL' }
  }

  return { success: true, url: data?.url }
}

export async function publishAssetAction(assetId: string): Promise<{
  success: boolean
  url?: string
  error?: string
}> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await api.POST('/api/assets/{id}/publish', {
    params: { path: { id: assetId } },
    headers: { cookie: (await cookies()).toString() },
  })

  if (error) {
    return { success: false, error: error.error || 'Failed to publish asset' }
  }

  revalidateTag(`user-assets-${session.user.id}`, 'default')

  return { success: true, url: data?.url }
}
