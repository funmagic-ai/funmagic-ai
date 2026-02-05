'use client'

import { useRouter } from 'next/navigation'
import { ImageIcon } from 'lucide-react'
import { AssetCard } from './AssetCard'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'

interface Asset {
  id: string
  filename: string
  mimeType: string
  size: number
  visibility: 'private' | 'public' | 'admin-private'
  module: string
  createdAt: string
}

interface AssetGalleryProps {
  assets: Asset[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
  currentPage: number
}

export function AssetGallery({ assets, pagination, currentPage }: AssetGalleryProps) {
  const router = useRouter()
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(page))
    router.push(`/assets?${params.toString()}`)
  }

  const handleDelete = () => {
    router.refresh()
  }

  if (assets.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle>No assets yet</EmptyTitle>
          <EmptyDescription>
            Your generated images and files will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} onDelete={handleDelete} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
