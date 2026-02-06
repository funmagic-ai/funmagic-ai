'use client'

import { useState, useCallback } from 'react'
import { useSessionContext } from '@/components/providers/session-provider'
import { useSubmitUpload } from '@/hooks/useSubmitUpload'
import { useTaskProgress } from '@/hooks/useTaskProgress'
import { createTaskAction } from './actions'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { TaskProgressDisplay } from '@/components/tools/TaskProgressDisplay'
import { BeforeAfterComparison } from './before-after-comparison'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X } from 'lucide-react'
import type { ToolDetail, BackgroundRemoveConfig } from '@/lib/types/tool-configs'

type ExecutorStep = 'upload' | 'processing' | 'result'

interface TaskOutput {
  assetId: string
  storageKey: string
  processedUrl?: string
  originalUrl?: string
}

export function BackgroundRemoveClient({ tool }: { tool: ToolDetail }) {
  const { session } = useSessionContext()
  const config = (tool.config || {}) as Partial<BackgroundRemoveConfig>

  const [step, setStep] = useState<ExecutorStep>('upload')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [result, setResult] = useState<TaskOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useSubmitUpload({
    route: 'background-remove',
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

    const taskResult = await createTaskAction({
      imageStorageKey: storageKey,
    })

    if (!taskResult.success) {
      setError(taskResult.error)
      return
    }

    setTaskId(taskResult.taskId)
    setStep('processing')
  }, [upload])

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
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to use this tool</p>
          <a
            href="/login"
            className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
          >
            Sign In
          </a>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 'upload' && (
          <>
            <h3 className="font-medium text-foreground">Upload Your Image</h3>
            <ImagePicker
              onFileSelect={upload.setFile}
              preview={upload.preview}
              disabled={upload.isUploading}
            />

            <Button
              onClick={handleGenerate}
              disabled={!upload.pendingFile || upload.isUploading}
              className="w-full"
              size="lg"
            >
              {upload.isUploading
                ? 'Uploading...'
                : `Remove Background (${cost} credits)`}
            </Button>
          </>
        )}

        {step === 'processing' && taskId && (
          <TaskProgressDisplay taskId={taskId} />
        )}

        {step === 'result' && result && originalPreview && (
          <BeforeAfterComparison
            beforeUrl={originalPreview}
            afterUrl={result.processedUrl || ''}
            onDownload={() => window.open(result.processedUrl, '_blank')}
            onReset={handleReset}
          />
        )}
      </CardContent>
    </Card>
  )
}
