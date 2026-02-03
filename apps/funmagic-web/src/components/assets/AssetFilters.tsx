'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const moduleOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'tool-input', label: 'Tool Input' },
  { value: 'tool-output', label: 'Tool Output' },
  { value: 'avatar', label: 'Avatar' },
]

export function AssetFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentModule = searchParams.get('module') || 'all'

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.push(`/assets?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div>
        <label htmlFor="module-filter" className="sr-only">
          Filter by type
        </label>
        <Select value={currentModule} onValueChange={(value) => updateFilter('module', value)}>
          <SelectTrigger className="min-w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {moduleOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
