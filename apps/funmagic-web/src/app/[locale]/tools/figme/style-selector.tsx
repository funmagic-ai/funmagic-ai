'use client'

import type { StyleReference } from '@/lib/types/tool-configs'
import { getS3PublicUrl } from '@/lib/s3-url'
import { Button } from '@/components/ui/button'
import { Check, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'

interface StyleSelectorProps {
  styles: StyleReference[]
  selectedStyleId: string | null
  onSelect: (styleId: string) => void
  disabled?: boolean
}

export function StyleSelector({
  styles,
  selectedStyleId,
  onSelect,
  disabled = false,
}: StyleSelectorProps) {
  if (styles.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Palette />
          </EmptyMedia>
          <EmptyTitle>No styles available</EmptyTitle>
          <EmptyDescription>
            Please contact support for assistance.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {styles.map((style, index) => (
        <Button key={style.id || `style-${index}`}
          variant="outline"
          type="button"
          onClick={() => onSelect(style.id)}
          disabled={disabled}
          className={cn(
            'relative h-auto p-0 rounded-lg overflow-hidden border-2 transition-all',
            selectedStyleId === style.id
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-border hover:border-muted-foreground'
          )}
        >
          <div className="w-full">
            <div className="aspect-square bg-muted">
              {style.imageUrl ? (
                <img
                  src={getS3PublicUrl(style.imageUrl)}
                  alt={style.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="p-2 bg-card">
              <p className="text-sm font-medium text-foreground truncate">
                {style.name}
              </p>
            </div>
          </div>
          {selectedStyleId === style.id && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}
        </Button>
      ))}
    </div>
  )
}
