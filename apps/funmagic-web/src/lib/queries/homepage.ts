import { cacheLife, cacheTag } from 'next/cache'
import { api } from '@/lib/api'

export async function getHomepageData() {
  'use cache'
  cacheLife('tools')
  cacheTag('homepage', 'tools-list')

  const [toolsRes, bannersRes] = await Promise.all([
    api.GET('/api/tools'),
    api.GET('/api/banners', { params: { query: { type: 'main' } } }),
  ])

  return {
    tools: toolsRes.data?.tools ?? [],
    banners: bannersRes.data?.banners ?? [],
  }
}

export async function getFeaturedTools() {
  'use cache'
  cacheLife('tools')
  cacheTag('featured-tools')

  const { data } = await api.GET('/api/tools')
  const tools = data?.tools ?? []
  return tools.slice(0, 6)
}
