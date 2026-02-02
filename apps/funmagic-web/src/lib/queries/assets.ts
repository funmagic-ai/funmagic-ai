import { connection } from 'next/server'
import { api } from '@/lib/api'
import { cookies } from 'next/headers'

export async function getUserAssets(params?: {
  module?: string
  limit?: number
  offset?: number
}) {
  await connection()

  const { data } = await api.GET('/api/assets', {
    params: {
      query: {
        module: params?.module,
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  return {
    assets: data?.assets ?? [],
    pagination: data?.pagination ?? { total: 0, limit: 20, offset: 0 },
  }
}
