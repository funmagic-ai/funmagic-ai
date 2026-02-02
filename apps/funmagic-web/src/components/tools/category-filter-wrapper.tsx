'use client'

import { useState } from 'react'
import { CategoryFilter } from './category-filter'

interface CategoryFilterWrapperProps {
  categories: Record<string, string>
  filterLabel?: string
  variant?: 'compact' | 'full'
  align?: 'left' | 'right'
}

export function CategoryFilterWrapper({
  categories,
  filterLabel,
  variant = 'compact',
  align = 'left',
}: CategoryFilterWrapperProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  return (
    <CategoryFilter
      categories={categories}
      selectedCategories={selectedCategories}
      onCategoriesChange={setSelectedCategories}
      filterLabel={filterLabel}
      variant={variant}
      align={align}
    />
  )
}
