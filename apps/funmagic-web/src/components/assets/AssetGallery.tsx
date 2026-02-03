'use client'

import { useRouter } from 'next/navigation'
import { AssetCard } from './AssetCard'

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
      <div className="text-center py-16">
        <svg
          className="mx-auto h-16 w-16 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-foreground">No assets yet</h3>
        <p className="mt-2 text-muted-foreground">
          Your generated images and files will appear here.
        </p>
      </div>
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
