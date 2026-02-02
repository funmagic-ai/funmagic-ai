'use client'

import { useState } from 'react'
import {
  PenLine,
  Image,
  Code,
  Video,
  Music,
  Lightbulb,
  Search as SearchIcon,
  Filter,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  copywriting: PenLine,
  imageGen: Image,
  coding: Code,
  video: Video,
  audio: Music,
  productivity: Lightbulb,
  research: SearchIcon,
}

interface CategoryFilterProps {
  categories: Record<string, string>
  selectedCategories: string[]
  onCategoriesChange: (categories: string[]) => void
  filterLabel?: string
  variant?: 'compact' | 'full'
  align?: 'left' | 'right'
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onCategoriesChange,
  filterLabel = 'Filter',
  variant = 'compact',
  align = 'left',
}: CategoryFilterProps) {
  const [open, setOpen] = useState(false)

  const categoryList = Object.entries(categories)
  const hasActiveFilters = selectedCategories.length > 0

  const handleCategoryToggle = (categoryKey: string) => {
    if (selectedCategories.includes(categoryKey)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== categoryKey))
    } else {
      onCategoriesChange([...selectedCategories, categoryKey])
    }
  }

  return (
    <div
      className={cn(
        variant === 'full' &&
          'sticky top-[72px] z-40 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/40'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          variant === 'full' && 'flex-wrap md:flex-nowrap justify-between',
          align === 'right' && variant !== 'full' && 'justify-end'
        )}
      >
        {/* Filter Controls */}
        <div className={cn('flex items-center gap-2 flex-wrap', align === 'right' && 'order-2')}>
          {/* Filter Dropdown Button */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors',
                'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {filterLabel}
              {hasActiveFilters && (
                <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {selectedCategories.length}
                </span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2 bg-card">
              <div className="flex flex-col gap-1">
                {categoryList.map(([key, label]) => {
                  const Icon = categoryIcons[key]
                  const isChecked = selectedCategories.includes(key)

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleCategoryToggle(key)}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors w-full text-left"
                    >
                      <Checkbox checked={isChecked} tabIndex={-1} />
                      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm">{label}</span>
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
