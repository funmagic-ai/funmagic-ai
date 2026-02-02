'use client'

import { useState, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useSubmitUpload } from '@/hooks/useSubmitUpload'
import { useTaskProgress } from '@/hooks/useTaskProgress'
import { createBackgroundRemoveTaskAction } from '@/app/actions/tools'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { TaskProgressDisplay } from '@/components/tools/TaskProgressDisplay'
import { BeforeAfterComparison } from './background-remove/BeforeAfterComparison'
import type { ToolDetail, BackgroundRemoveConfig } from '@/lib/types/tool-configs'

type ExecutorStep = 'upload' | 'processing' | 'result'

interface TaskOutput {
  assetId: string
  url: string
}

export function BackgroundRemoveExecutor({ tool }: { tool: ToolDetail }) {
  const { data: session } = useSession()
  const config = (tool.config || {}) as Partial<BackgroundRemoveConfig>

  const [step, setStep] = useState<ExecutorStep>('upload')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [result, setResult] = useState<TaskOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useSubmitUpload({
    route: 'tool-input',
    onError: (err) => setError(err),
  })

  useTaskProgress({
    taskId,
    onComplete: (output) => {
      setResult(output as TaskOutput)
      setStep('result')
      setTaskId(null)
    },
    onFailed: (err) => {
      setError(err)
      setStep('upload')
      setTaskId(null)
    },
  })

  const cost = config.steps?.[0]?.cost ?? 5

  const handleGenerate = useCallback(async () => {
    if (!upload.pendingFile) return
    setError(null)

    setOriginalPreview(URL.createObjectURL(upload.pendingFile))

    const storageKey = await upload.uploadOnSubmit()
    if (!storageKey) {
      setError('Upload failed')
      return
    }

    const taskResult = await createBackgroundRemoveTaskAction({
      toolSlug: tool.slug,
      imageStorageKey: storageKey,
    })

    if (!taskResult.success) {
      setError(taskResult.error)
      return
    }

    setTaskId(taskResult.taskId)
    setStep('processing')
  }, [upload, tool.slug])

  const handleReset = useCallback(() => {
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview)
    }
    setStep('upload')
    setResult(null)
    setOriginalPreview(null)
    setError(null)
    upload.reset()
  }, [originalPreview, upload])

  if (!session) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
        <p className="text-gray-600 mb-4">Please sign in to use this tool</p>
        <a
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Sign In
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            &times;
          </button>
        </div>
      )}

      {step === 'upload' && (
        <>
          <h3 className="font-medium text-gray-900">Upload Your Image</h3>
          <ImagePicker
            onFileSelect={upload.setFile}
            preview={upload.preview}
            disabled={upload.isUploading}
          />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!upload.pendingFile || upload.isUploading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {upload.isUploading
              ? 'Uploading...'
              : `Remove Background (${cost} credits)`}
          </button>
        </>
      )}

      {step === 'processing' && taskId && (
        <TaskProgressDisplay taskId={taskId} />
      )}

      {step === 'result' && result && originalPreview && (
        <BeforeAfterComparison
          beforeUrl={originalPreview}
          afterUrl={result.url}
          onDownload={() => window.open(result.url, '_blank')}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
