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
  const search = await searchParams
  setRequestLocale(locale)
  const t = await getTranslations('tools')

  const page = search.page ? parseInt(search.page, 10) : 1

  return (
    <div className="max-w-7xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('allTools')}</h1>

      <Suspense fallback={<SearchSkeleton />}>
        <ToolsSearchWrapper q={search.q} category={search.category} />
      </Suspense>

      <Suspense fallback={<ToolGridSkeleton count={6} />}>
        <ToolsGrid q={search.q} category={search.category} page={page} />
      </Suspense>
    </div>
  )
}

async function ToolsSearchWrapper({
  q,
  category,
}: {
  q?: string
  category?: string
}) {
  await connection()
  const { categories } = await getTools({ limit: 1 })

  return <ToolsSearch q={q} category={category} categories={categories} />
}

async function ToolsGrid({
  q,
  category,
  page,
}: {
  q?: string
  category?: string
  page: number
}) {
  await connection()
  const t = await getTranslations('tools')
  const { tools, pagination } = await getTools({ q, category, page, limit: TOOLS_PER_PAGE })

  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{q ? t('noSearchResults') : t('noTools')}</p>
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
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border group"
          >
            {tool.thumbnail && (
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img
                  src={tool.thumbnail}
                  alt={tool.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              {tool.category && (
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {tool.category}
                </span>
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tool.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
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
        <div className="h-10 bg-gray-200 rounded-lg flex-1" />
        <div className="h-10 bg-gray-200 rounded-lg w-40" />
      </div>
    </div>
  )
}
