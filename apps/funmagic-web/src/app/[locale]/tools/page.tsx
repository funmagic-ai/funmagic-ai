import { Suspense } from 'react'
import { connection } from 'next/server'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getTools } from '@/lib/queries/tools'
import { ToolGridSkeleton } from '@/components/skeletons'
import { ToolsSearch } from './tools-search'
import { ToolsPagination } from './tools-pagination'

const TOOLS_PER_PAGE = 12

interface ToolsPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}

export default async function ToolsPage({ params, searchParams }: ToolsPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('tools')

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8">{t('allTools')}</h1>

      <Suspense fallback={<SearchSkeleton />}>
        <ToolsSearchWrapper searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<ToolGridSkeleton count={6} />}>
        <ToolsGrid searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function ToolsSearchWrapper({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}) {
  await connection()
  const search = await searchParams
  const { categories } = await getTools({ limit: 1 })

  return <ToolsSearch q={search.q} category={search.category} categories={categories} />
}

async function ToolsGrid({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}) {
  await connection()
  const search = await searchParams
  const t = await getTranslations('tools')
  const page = search.page ? parseInt(search.page, 10) : 1
  const { tools, pagination } = await getTools({ q: search.q, category: search.category, page, limit: TOOLS_PER_PAGE })

  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{search.q ? t('noSearchResults') : t('noTools')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="glass-panel p-6 rounded-xl neon-hover group"
          >
            {tool.thumbnail && (
              <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                <img
                  src={tool.thumbnail}
                  alt={tool.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              {tool.category && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                  {tool.category}
                </span>
              )}
            </div>
            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
              {tool.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tool.description || tool.slug}
            </p>
          </Link>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <ToolsPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}
    </>
  )
}

function SearchSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="h-10 bg-muted rounded-lg flex-1" />
        <div className="h-10 bg-muted rounded-lg w-40" />
      </div>
    </div>
  )
}
