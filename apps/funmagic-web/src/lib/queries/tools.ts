import { cacheLife, cacheTag } from 'next/cache'
import { api } from '@/lib/api'
import type { SupportedLocale } from '@funmagic/shared'

export interface ToolsQueryParams {
  q?: string
  category?: string
  page?: number
  limit?: number
  locale: SupportedLocale
}

// Extended response type - matches backend schema after `bun run api:generate`
interface ToolsResponse {
  tools: Array<{
    id: string
    slug: string
    title: string
    description: string | null
    thumbnail: string | null
    category?: string
  }>
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  categories?: Array<{
    id: string
    name: string
    displayName: string
  }>
}

export async function getTools(params: ToolsQueryParams) {
  'use cache'
  cacheLife('tools')
  cacheTag('tools-list')

  const { locale, ...rest } = params

  const { data } = await api.GET('/api/tools', {
    params: {
      query: {
        q: rest.q,
        category: rest.category,
        page: rest.page,
        limit: rest.limit,
        locale,
      },
    },
  })

  // Cast to extended type that includes pagination and categories
  const response = data as ToolsResponse | undefined

  return {
    tools: response?.tools ?? [],
    pagination: response?.pagination ?? { total: 0, page: 1, limit: 12, totalPages: 0 },
    categories: response?.categories ?? [],
  }
}

export async function getToolBySlug(slug: string, locale: SupportedLocale) {
  const { data } = await api.GET('/api/tools/{slug}', {
    params: {
      path: { slug },
      query: { locale },
    },
  })
  return data?.tool
}
