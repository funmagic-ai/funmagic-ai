'use client'

import { useCallback, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ToolsPaginationProps {
  currentPage: number
  totalPages: number
  total: number
}

export function ToolsPagination({
  currentPage,
  totalPages,
  total,
}: ToolsPaginationProps) {
  const t = useTranslations('tools')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const goToPage = useCallback(
    (page: number) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (page === 1) {
          params.delete('page')
        } else {
          params.set('page', page.toString())
        }
        router.push(`?${params.toString()}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  const pages = generatePageNumbers(currentPage, totalPages)

  return (
    <div className="flex items-center justify-between border-t border-border pt-6">
      <div className="text-sm text-muted-foreground">
        {t('showingResults', { total })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="p-2 rounded-lg border border-input hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="p-2 rounded-lg border border-input hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Pagination display constants
const MAX_VISIBLE_PAGES = 7
const EDGE_THRESHOLD = 4
const VISIBLE_EDGE_PAGES = 5

function generatePageNumbers(
  current: number,
  total: number
): (number | '...')[] {
  // Show all pages if within limit
  if (total <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []

  // Near start: show first pages + ellipsis + last
  if (current <= EDGE_THRESHOLD) {
    for (let i = 1; i <= VISIBLE_EDGE_PAGES; i++) pages.push(i)
    pages.push('...', total)
  }
  // Near end: show first + ellipsis + last pages
  else if (current >= total - EDGE_THRESHOLD + 1) {
    pages.push(1, '...')
    for (let i = total - VISIBLE_EDGE_PAGES + 1; i <= total; i++) pages.push(i)
  }
  // Middle: show first + ellipsis + current window + ellipsis + last
  else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }

  return pages
}
