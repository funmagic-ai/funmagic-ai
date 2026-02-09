import { api } from '@/lib/api'

export interface UseUploadOptions {
  module: string
  visibility?: 'public' | 'private'
}

export function useUpload(options: UseUploadOptions) {
  const pendingFile = ref<File | null>(null)
  const preview = ref<string | null>(null)
  const isUploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  function setFile(file: File | null) {
    // Revoke previous preview
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
      preview.value = null
    }

    pendingFile.value = file
    error.value = null

    if (file) {
      preview.value = URL.createObjectURL(file)
    }
  }

  async function uploadOnSubmit(): Promise<{ storageKey: string; bucket: string } | null> {
    if (!pendingFile.value) {
      error.value = 'No file selected'
      return null
    }

    isUploading.value = true
    progress.value = 0
    error.value = null

    try {
      // Step 1: Get presigned URL
      const { data: presignData, error: presignError } = await api.POST('/api/upload/presign', {
        body: {
          module: options.module,
          filename: pendingFile.value.name,
          contentType: pendingFile.value.type,
          contentLength: pendingFile.value.size,
          visibility: options.visibility ?? 'private',
        },
      })

      if (presignError || !presignData) {
        error.value = (presignError as { error?: string })?.error ?? 'Failed to get upload URL'
        return null
      }

      const { uploadUrl, storageKey, bucket } = presignData

      progress.value = 30

      // Step 2: Upload file directly to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': pendingFile.value.type,
        },
        body: pendingFile.value,
      })

      if (!uploadResponse.ok) {
        error.value = 'Failed to upload file'
        return null
      }

      progress.value = 100

      return { storageKey, bucket }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Upload failed'
      return null
    } finally {
      isUploading.value = false
    }
  }

  function reset() {
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
    }
    pendingFile.value = null
    preview.value = null
    isUploading.value = false
    progress.value = 0
    error.value = null
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (preview.value) {
      URL.revokeObjectURL(preview.value)
    }
  })

  return {
    pendingFile: readonly(pendingFile),
    preview: readonly(preview),
    isUploading: readonly(isUploading),
    progress: readonly(progress),
    error: readonly(error),
    setFile,
    uploadOnSubmit,
    reset,
  }
}
