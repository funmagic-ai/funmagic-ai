'use client'

import { useState } from 'react'
import { deleteAssetAction, getAssetDownloadUrlAction } from '@/app/actions/assets'

interface Asset {
  id: string
  filename: string
  mimeType: string
  size: number
  visibility: 'private' | 'public' | 'admin-private'
  module: string
  createdAt: string
}

interface AssetCardProps {
  asset: Asset
  onDelete?: () => void
  onClick?: () => void
}

export function AssetCard({ asset, onDelete, onClick }: AssetCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isImage = asset.mimeType.startsWith('image/')

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDownloading(true)
    setShowMenu(false)

    try {
      const result = await getAssetDownloadUrlAction(asset.id)
      if (result.success && result.url) {
        window.open(result.url, '_blank')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this asset?')) return

    setIsDeleting(true)
    setShowMenu(false)

    try {
      const result = await deleteAssetAction(asset.id)
      if (result.success) {
        onDelete?.()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className={`relative bg-card rounded-lg border border-border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="aspect-square bg-muted flex items-center justify-center">
        {isImage ? (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        ) : (
          <div className="text-muted-foreground">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-foreground truncate" title={asset.filename}>
          {asset.filename}
        </p>
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          <span>{formatSize(asset.size)}</span>
          <span>{formatDate(asset.createdAt)}</span>
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="p-1 bg-card/80 rounded-full hover:bg-card transition-colors"
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute top-8 right-0 bg-card border rounded-lg shadow-lg py-1 min-w-[120px] z-10">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50"
            >
              {isDownloading ? 'Loading...' : 'Download'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {asset.visibility === 'public' && (
        <div className="absolute top-2 left-2">
          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
            Public
          </span>
        </div>
      )}
    </div>
  )
}
