import { cacheLife, cacheTag } from 'next/cache'
import { api } from '@/lib/api'
import type { SupportedLocale } from '@funmagic/shared'

export interface CarouselSlide {
  id: string
  title: string
  description: string
  image: string
  badge: string
}

export interface SideBannerData {
  id: string
  title: string
  description: string
  label: string
  labelColor: 'primary' | 'teal'
  image: string
  href: string
}

interface Tool {
  id: string
  slug: string
  title: string
  description: string | null
  thumbnail: string | null
  category?: string
}

interface Banner {
  id: string
  title: string
  description: string | null
  thumbnail: string
  link: string | null
  linkText: string | null
  badge: string | null
}

export async function getHomepageData(locale: SupportedLocale = 'en') {
  'use cache'
  cacheLife('tools')
  cacheTag('homepage', 'tools-list', 'banners')

  const [toolsRes, mainBannersRes, sideBannersRes] = await Promise.all([
    api.GET('/api/tools', { params: { query: { locale } } }),
    api.GET('/api/banners', { params: { query: { type: 'main', locale } } }),
    api.GET('/api/banners', { params: { query: { type: 'side', locale } } }),
  ])

  const tools = (toolsRes.data?.tools ?? []) as Tool[]
  const mainBanners = (mainBannersRes.data?.banners ?? []) as Banner[]
  const sideBanners = (sideBannersRes.data?.banners ?? []) as Banner[]

  // Transform main banners into carousel slides
  const carouselSlides: CarouselSlide[] = mainBanners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    description: banner.description ?? '',
    image: banner.thumbnail ?? '/images/placeholder-banner.jpg',
    badge: banner.badge ?? 'Featured',
  }))

  // If no main banners, create placeholder slides from featured tools
  const slides: CarouselSlide[] = carouselSlides.length > 0
    ? carouselSlides
    : tools.slice(0, 3).map((tool) => ({
        id: tool.id,
        title: tool.title,
        description: tool.description ?? '',
        image: tool.thumbnail ?? '/images/placeholder-tool.jpg',
        badge: tool.category ?? 'Featured',
      }))

  // Transform side banners
  const sideBannerData: SideBannerData[] = sideBanners.slice(0, 2).map((banner, index) => ({
    id: banner.id,
    title: banner.title,
    description: banner.description ?? '',
    label: index === 0 ? 'Trending' : 'New Arrival',
    labelColor: index === 0 ? 'primary' as const : 'teal' as const,
    image: banner.thumbnail ?? '/images/placeholder-banner.jpg',
    href: banner.link ?? '/tools',
  }))

  // Fallback side banners if none exist
  const finalSideBanners: SideBannerData[] = sideBannerData.length >= 2
    ? sideBannerData
    : [
        {
          id: 'trending-fallback',
          title: tools[0]?.title ?? 'Discover AI Tools',
          description: tools[0]?.description ?? 'Explore our collection of AI-powered tools',
          label: 'Trending',
          labelColor: 'primary' as const,
          image: tools[0]?.thumbnail ?? '/images/placeholder-tool.jpg',
          href: tools[0] ? `/tools/${tools[0].slug}` : '/tools',
        },
        {
          id: 'new-arrival-fallback',
          title: tools[1]?.title ?? 'Latest Tools',
          description: tools[1]?.description ?? 'Check out our newest additions',
          label: 'New Arrival',
          labelColor: 'teal' as const,
          image: tools[1]?.thumbnail ?? '/images/placeholder-tool.jpg',
          href: tools[1] ? `/tools/${tools[1].slug}` : '/tools',
        },
      ]

  return {
    tools,
    carouselSlides: slides,
    sideBanners: finalSideBanners,
  }
}

export async function getFeaturedTools() {
  'use cache'
  cacheLife('tools')
  cacheTag('featured-tools')

  const { data } = await api.GET('/api/tools')
  const tools = (data?.tools ?? []) as Tool[]
  return tools.slice(0, 8)
}
