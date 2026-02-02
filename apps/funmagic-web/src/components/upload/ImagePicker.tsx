'use client'

import { useCallback, useRef } from 'react'
import { formatBytes } from '@better-upload/client/helpers'

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

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) {
        onFileSelect(null)
        return
      }

      if (file.size > maxSize) {
        alert(`File size must be less than ${formatBytes(maxSize)}`)
        e.target.value = ''
        return
      }

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
        alert('Please select an image file')
        return
      }

      if (file.size > maxSize) {
        alert(`File size must be less than ${formatBytes(maxSize)}`)
        return
      }

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
      onFileSelect(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [onFileSelect]
  )

  return (
    <div
      className={`relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className || ''}`}
      onClick={!disabled ? handleClick : undefined}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              &times;
            </button>
          )}
        </div>
      ) : (
        <div className="py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-4 text-sm text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF up to {formatBytes(maxSize)}
          </p>
        </div>
      )}
    </div>
  )
}
