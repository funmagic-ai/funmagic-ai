import { connection } from 'next/server'
import { cacheLife, cacheTag } from 'next/cache'
import { api } from '@/lib/api'
import { cookies } from 'next/headers'
import type { SupportedLocale } from '@funmagic/shared'

// Type definitions - should match generated types after running `bun run api:generate`
export interface CreditPackage {
  id: string
  name: string
  description: string | null
  credits: number
  bonusCredits: number
  price: string
  currency: string
  isPopular: boolean
  sortOrder: number
}

export async function getCreditPackages(locale: SupportedLocale = 'en'): Promise<CreditPackage[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('credit-packages')

  // TODO: After running `bun run api:generate`, this can use api.GET('/api/credits/packages')
  const { data } = await api.GET('/api/credits/packages' as '/api/credits/balance', {
    params: { query: { locale } },
  } as unknown as undefined)
  return ((data as unknown as { packages?: CreditPackage[] })?.packages) ?? []
}

export async function getCreditBalance() {
  await connection()

  const { data } = await api.GET('/api/credits/balance', {
    headers: { cookie: (await cookies()).toString() },
  })

  return data ?? {
    balance: 0,
    availableBalance: 0,
    reservedBalance: 0,
    lifetimePurchased: 0,
    lifetimeUsed: 0,
    lifetimeRefunded: 0,
  }
}

export async function getCreditTransactions(params?: {
  type?: string
  limit?: number
  offset?: number
}) {
  await connection()

  const { data } = await api.GET('/api/credits/transactions', {
    params: {
      query: {
        type: params?.type,
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      },
    },
    headers: { cookie: (await cookies()).toString() },
  })

  return {
    transactions: data?.transactions ?? [],
    pagination: data?.pagination ?? { total: 0, limit: 20, offset: 0 },
  }
}
