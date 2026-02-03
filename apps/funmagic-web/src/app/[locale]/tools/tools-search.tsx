'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
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
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <Select value={category ?? 'all'} onValueChange={(value) => handleCategoryChange(value === 'all' ? '' : value)}>
          <SelectTrigger className="min-w-[160px]">
            <SelectValue placeholder={t('allCategories')} />
          </SelectTrigger>
          <SelectContent className="border-border/50">
            <SelectItem value="all">{t('filter')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 h-5">
        {isPending && (
          <span className="text-sm text-muted-foreground">{t('searching')}</span>
        )}
      </div>
    </div>
  )
}
