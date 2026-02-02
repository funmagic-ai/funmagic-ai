'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const moduleOptions = [
  { value: '', label: 'All Types' },
  { value: 'tool-input', label: 'Tool Input' },
  { value: 'tool-output', label: 'Tool Output' },
  { value: 'avatar', label: 'Avatar' },
]

export function AssetFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentModule = searchParams.get('module') || ''

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
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
        <select
          id="module-filter"
          value={currentModule}
          onChange={(e) => updateFilter('module', e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {moduleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
