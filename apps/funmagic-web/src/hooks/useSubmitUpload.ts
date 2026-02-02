'use client'

import { useState, useCallback } from 'react'
import { useUploadFile } from '@better-upload/client'

const UPLOAD_CONFIG = {
  figme: { route: 'input', api: '/api/tools/figme/upload' },
  'background-remove': { route: 'input', api: '/api/tools/background-remove/upload' },
  'crystal-memory': { route: 'input', api: '/api/tools/crystal-memory/upload' },
  avatar: { route: 'avatar', api: '/api/user/avatar/upload' },
} as const

type UploadRoute = keyof typeof UPLOAD_CONFIG

interface UseSubmitUploadOptions {
  route: UploadRoute
  onSuccess?: (file: { key: string; name: string; size: number }) => void
  onError?: (error: string) => void
}

export function useSubmitUpload({ route, onSuccess, onError }: UseSubmitUploadOptions) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedKey, setUploadedKey] = useState<string | null>(null)

  const config = UPLOAD_CONFIG[route]

  const {
    uploadAsync,
    isPending: isUploading,
    progress,
    reset: resetUpload,
  } = useUploadFile({
    route: config.route,
    api: config.api,
    credentials: 'include',
    onUploadComplete: ({ file, metadata }) => {
      const key = (metadata as { key?: string } | undefined)?.key || ''
      setUploadedKey(key)
      onSuccess?.({ key, name: file.name, size: file.size })
    },
    onError: (error) => {
      onError?.(error.message)
    },
  })

  const setFile = useCallback((file: File | null) => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }

    setPendingFile(file)
    setUploadedKey(null)

    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)
    } else {
      setPreview(null)
    }
  }, [preview])

  const uploadOnSubmit = useCallback(async (): Promise<string | null> => {
    if (!pendingFile) {
      onError?.('No file selected')
      return null
    }

    try {
      const result = await uploadAsync(pendingFile)
      if (result?.metadata) {
        const key = (result.metadata as { key?: string }).key || ''
        setUploadedKey(key)
        return key
      }
      return uploadedKey
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      onError?.(message)
      return null
    }
  }, [pendingFile, uploadAsync, onError, uploadedKey])

  const reset = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPendingFile(null)
    setPreview(null)
    setUploadedKey(null)
    resetUpload()
  }, [preview, resetUpload])

  return {
    pendingFile,
    preview,
    uploadedKey,
    isUploading,
    progress,
    setFile,
    uploadOnSubmit,
    reset,
  }
}
