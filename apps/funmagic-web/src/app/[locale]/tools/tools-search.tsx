'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  displayName: string
}

interface ToolsSearchProps {
  q?: string
  category?: string
  categories: Category[]
}

export function ToolsSearch({ q, category, categories }: ToolsSearchProps) {
  const t = useTranslations('tools')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(q ?? '')

  const createQueryString = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      // Reset to page 1 when filtering
      if (updates.q !== undefined || updates.category !== undefined) {
        params.delete('page')
      }

      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = useCallback(
    (value: string) => {
      startTransition(() => {
        const queryString = createQueryString({ q: value || undefined })
        router.push(`?${queryString}`, { scroll: false })
      })
    },
    [router, createQueryString]
  )

  const handleCategoryChange = useCallback(
    (value: string) => {
      startTransition(() => {
        const queryString = createQueryString({
          category: value || undefined,
        })
        router.push(`?${queryString}`, { scroll: false })
      })
    },
    [router, createQueryString]
  )

  const handleClear = useCallback(() => {
    setSearchValue('')
    handleSearch('')
  }, [handleSearch])

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchValue)
              }
            }}
            onBlur={() => handleSearch(searchValue)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <select
          value={category ?? ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px]"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.displayName}
            </option>
          ))}
        </select>
      </div>

      {isPending && (
        <div className="mt-4 text-sm text-gray-500">{t('searching')}</div>
      )}
    </div>
  )
}
