import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getHomepageData } from '@/lib/queries/homepage'
import type { SupportedLocale } from '@funmagic/shared'
import { HeroCarousel } from '@/components/home'
import { SideBanner } from '@/components/home'
import { ToolCard } from '@/components/tools'
import { CategoryFilterWrapper } from '@/components/tools'
import { Button } from '@/components/ui/button'
import { ArrowRight, Wand2 } from 'lucide-react'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-[1200px] flex flex-col gap-10">
        {/* Hero Section */}
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection locale={locale} />
        </Suspense>

        {/* Tool Grid Section */}
        <Suspense fallback={<ToolGridSkeleton />}>
          <ToolGridSection locale={locale} />
        </Suspense>
      </div>
    </main>
  )
}

async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations('home')
  const { carouselSlides, sideBanners } = await getHomepageData(locale as SupportedLocale)

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Carousel - 8 columns on large screens */}
      <div className="lg:col-span-8">
        <HeroCarousel slides={carouselSlides} featuredLabel={t('featured')} />
      </div>

      {/* Side Banners - 4 columns on large screens */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {sideBanners.map((banner) => (
          <SideBanner
            key={banner.id}
            title={banner.title}
            description={banner.description}
            label={banner.label}
            labelColor={banner.labelColor}
            image={banner.image}
            href={banner.href}
          />
        ))}
      </div>
    </section>
  )
}

async function ToolGridSection({ locale }: { locale: string }) {
  const t = await getTranslations('home')
  const tTools = await getTranslations('tools')
  const tCommon = await getTranslations('common')
  const { tools } = await getHomepageData(locale as SupportedLocale)

  // Get category translations for filter
  const categories: Record<string, string> = {
    copywriting: tTools('categories.copywriting'),
    imageGen: tTools('categories.imageGen'),
    coding: tTools('categories.coding'),
    video: tTools('categories.video'),
    audio: tTools('categories.audio'),
    productivity: tTools('categories.productivity'),
    research: tTools('categories.research'),
  }

  // Get pricing labels
  const pricingLabels: Record<string, string> = {
    free: tTools('card.free'),
    freemium: tTools('card.freemium'),
    paid: tTools('card.paid'),
  }

  return (
    <section>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">{t('discoverTools')}</h2>
        <div className="flex items-center gap-4">
          <CategoryFilterWrapper
            categories={categories}
            filterLabel={tTools('filter')}
            variant="compact"
            align="right"
          />
          <Link
            href="/tools"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            {tCommon('viewAll')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Tool Grid */}
      {tools.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.slice(0, 8).map((tool) => (
            <ToolCard
              key={tool.id}
              slug={tool.slug}
              name={tool.title}
              description={tool.description ?? ''}
              category={tool.category ?? 'productivity'}
              categoryLabel={categories[tool.category ?? 'productivity'] ?? tool.category}
              image={tool.thumbnail ?? '/images/placeholder-tool.jpg'}
              rating={4.5}
              pricing="free"
              pricingLabel={pricingLabels['free']}
              visitLabel={tTools('card.visit')}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Wand2 />
            </EmptyMedia>
            <EmptyTitle>{tTools('noTools')}</EmptyTitle>
            <EmptyDescription>{tTools('noToolsDescription')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {/* Load More Button */}
      {tools.length > 8 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/tools">{tCommon('loadMore')}</Link>
          </Button>
        </div>
      )}
    </section>
  )
}

function HeroSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <div className="aspect-[21/9] rounded-2xl bg-muted animate-pulse" />
      </div>
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="aspect-[21/9] lg:flex-1 rounded-2xl bg-muted animate-pulse" />
        <div className="aspect-[21/9] lg:flex-1 rounded-2xl bg-muted animate-pulse" />
      </div>
    </section>
  )
}

function ToolGridSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-6 w-24 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-card">
            <div className="aspect-video bg-muted animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
