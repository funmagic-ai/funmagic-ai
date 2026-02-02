import { Suspense } from 'react'
import { connection } from 'next/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getUserAssets } from '@/lib/queries/assets'
import { AssetFilters, AssetGallery } from '@/components/assets'

interface AssetsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    module?: string
    page?: string
  }>
}

export default async function AssetsPage({ params, searchParams }: AssetsPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('assets')

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
      </div>

      <div className="mb-6">
        <Suspense fallback={<div className="h-10" />}>
          <AssetFilters />
        </Suspense>
      </div>

      <Suspense fallback={<AssetsGridSkeleton />}>
        <AssetsGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function AssetsGrid({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; page?: string }>
}) {
  await connection()
  const search = await searchParams
  const page = Math.max(1, parseInt(search.page || '1', 10))
  const limit = 20
  const offset = (page - 1) * limit
  const { assets, pagination } = await getUserAssets({ module: search.module, limit, offset })

  return <AssetGallery assets={assets} pagination={pagination} currentPage={page} />
}

function AssetsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg border border-border shadow-sm overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <div className="p-3 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
