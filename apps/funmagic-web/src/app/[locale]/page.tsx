import { Suspense } from 'react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getHomepageData } from '@/lib/queries/homepage'
import { ToolGridSkeleton } from '@/components/skeletons'

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div>
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<FeaturedToolsSkeleton />}>
        <FeaturedTools />
      </Suspense>
      <Suspense fallback={<CTASkeleton />}>
        <CTASection />
      </Suspense>
    </div>
  )
}

async function HeroSection() {
  const t = await getTranslations('home')

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">{t('title')}</h1>
        <p className="text-xl text-gray-600 mb-8">{t('subtitle')}</p>
        <div className="flex justify-center gap-4">
          <Link
            href="/tools"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
          >
            {t('exploreTools')}
          </Link>
          <Link
            href="/pricing"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50"
          >
            {t('viewPricing')}
          </Link>
        </div>
      </div>
    </section>
  )
}

async function FeaturedTools() {
  const t = await getTranslations('home')
  const { tools } = await getHomepageData()

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          {t('popularTools')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.slice(0, 6).map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.slug}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tool.title}
              </h3>
              <p className="text-gray-600">
                {tool.description || 'Click to explore this tool'}
              </p>
            </Link>
          ))}
          {tools.length === 0 && (
            <p className="col-span-3 text-center text-gray-500">
              No tools available yet
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

async function CTASection() {
  const t = await getTranslations('home')

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('getStarted')}</h2>
        <p className="text-xl text-gray-600 mb-8">{t('freeCredits')}</p>
        <Link
          href="/register"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700"
        >
          {t('createAccount')}
        </Link>
      </div>
    </section>
  )
}

function HeroSkeleton() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center animate-pulse">
        <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-6" />
        <div className="h-6 bg-gray-200 rounded w-full mx-auto mb-2" />
        <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-8" />
        <div className="flex justify-center gap-4">
          <div className="h-12 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </section>
  )
}

function FeaturedToolsSkeleton() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-12" />
        <ToolGridSkeleton count={6} />
      </div>
    </section>
  )
}

function CTASkeleton() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-6" />
        <div className="h-6 bg-gray-200 rounded w-96 mx-auto mb-8" />
        <div className="h-12 bg-gray-200 rounded w-48 mx-auto" />
      </div>
    </section>
  )
}
