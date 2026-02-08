'use client'

import { useCallback, useRef, useState } from 'react'
import { formatBytes } from '@better-upload/client/helpers'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ImagePickerProps {
  onFileSelect: (file: File | null) => void
  preview?: string | null
  accept?: string
  maxSize?: number
  disabled?: boolean
  className?: string
}

export function ImagePicker({
  onFileSelect,
  preview,
  accept = 'image/*',
  maxSize = 20 * 1024 * 1024,
  disabled = false,
  className,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) {
        onFileSelect(null)
        return
      }

      if (file.size > maxSize) {
        setError(`File size must be less than ${formatBytes(maxSize)}`)
        e.target.value = ''
        return
      }

      setError(null)
      onFileSelect(file)
    },
    [onFileSelect, maxSize]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (disabled) return

      const file = e.dataTransfer.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      if (file.size > maxSize) {
        setError(`File size must be less than ${formatBytes(maxSize)}`)
        return
      }

      setError(null)
      onFileSelect(file)
    },
    [onFileSelect, maxSize, disabled]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setError(null)
      onFileSelect(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [onFileSelect]
  )

  return (
    <div className={className}>
      {error && (
        <div role="alert" className="mb-2 text-sm text-destructive bg-destructive/10 p-2 rounded-lg">
          {error}
        </div>
      )}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`relative w-full border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          error ? 'border-destructive' : 'border-input hover:border-primary'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={!disabled ? handleClick : undefined}
        onKeyDown={!disabled ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        aria-disabled={disabled}
        aria-label="Select image"
      >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 mx-auto rounded-lg object-contain"
          />
          {!disabled && (
            <Button
              variant="destructive"
              size="icon-xs"
              onClick={handleClear}
              className="absolute top-2 right-2 rounded-full"
              aria-label="Clear image"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="py-8">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PNG, JPG, WebP up to {formatBytes(maxSize)}
          </p>
        </div>
      )}
      </div>
    </div>
  )
}
