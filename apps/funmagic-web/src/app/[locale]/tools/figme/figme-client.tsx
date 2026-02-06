'use client'

import { useState, useCallback } from 'react'
import { useSessionContext } from '@/components/providers/session-provider'
import { useSubmitUpload } from '@/hooks/useSubmitUpload'
import { useTaskProgress } from '@/hooks/useTaskProgress'
import { createImageTaskAction, create3DTaskAction } from './actions'
import { saveTaskOutputAction } from '@/app/actions/tools'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { TaskProgressDisplay } from '@/components/tools/TaskProgressDisplay'
import { StyleSelector } from './style-selector'
import { ResultDisplay } from './result-display'
import { ThreeDViewer } from './three-d-viewer'
import { Card, CardContent } from '@/components/ui/card'
import type { ToolDetail, FigMeConfig, StyleReference } from '@/lib/types/tool-configs'

type ExecutorStep =
  | 'select-style'
  | 'upload-image'
  | 'generating-image'
  | 'image-result'
  | 'generating-3d'
  | '3d-result'

interface TaskOutput {
  assetId: string
  imageUrl?: string
  storageKey?: string
  modelUrl?: string
  modelStorageKey?: string
}

export function FigMeClient({ tool }: { tool: ToolDetail }) {
  const { session } = useSessionContext()
  const config = (tool.config || {}) as Partial<FigMeConfig>

  const [step, setStep] = useState<ExecutorStep>('select-style')
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [parentTaskId, setParentTaskId] = useState<string | null>(null)
  const [imageResult, setImageResult] = useState<TaskOutput | null>(null)
  const [threeDResult, setThreeDResult] = useState<TaskOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const upload = useSubmitUpload({
    route: 'figme',
    onError: (err) => setError(err),
  })

  useTaskProgress({
    taskId,
    onComplete: (output) => {
      const result = output as TaskOutput
      if (step === 'generating-image') {
        setImageResult(result)
        setParentTaskId(taskId)
        setStep('image-result')
      } else if (step === 'generating-3d') {
        setThreeDResult(result)
        setStep('3d-result')
      }
      setTaskId(null)
    },
    onFailed: (err) => {
      setError(err)
      setStep('select-style')
      setTaskId(null)
    },
  })

  const styles: StyleReference[] = config.styleReferences || []
  const imageGenCost = config.steps?.[0]?.cost ?? 20
  const threeDGenCost = config.steps?.[1]?.cost ?? 30

  const handleStyleSelect = useCallback((styleId: string) => {
    setSelectedStyleId(styleId)
    setStep('upload-image')
    setError(null)
  }, [])

  const handleGenerateImage = useCallback(async () => {
    if (!selectedStyleId || !upload.pendingFile) return
    setError(null)

    const storageKey = await upload.uploadOnSubmit()
    if (!storageKey) {
      setError('Upload failed')
      return
    }

    const result = await createImageTaskAction({
      styleReferenceId: selectedStyleId,
      imageStorageKey: storageKey,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    setTaskId(result.taskId)
    setStep('generating-image')
  }, [selectedStyleId, upload])

  const handleGenerate3D = useCallback(async () => {
    if (!imageResult || !parentTaskId) return
    setError(null)

    const result = await create3DTaskAction({
      parentTaskId,
      sourceAssetId: imageResult.assetId,
      sourceImageUrl: imageResult.imageUrl || '',
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    setTaskId(result.taskId)
    setStep('generating-3d')
  }, [imageResult, parentTaskId])

  const handleSave = useCallback(async () => {
    if (!parentTaskId) return
    setIsSaving(true)

    const result = await saveTaskOutputAction(parentTaskId)
    if (!result.success) {
      setError(result.error || 'Failed to save')
    }

    setIsSaving(false)
  }, [parentTaskId])

  const handleReset = useCallback(() => {
    setStep('select-style')
    setSelectedStyleId(null)
    setTaskId(null)
    setParentTaskId(null)
    setImageResult(null)
    setThreeDResult(null)
    setError(null)
    upload.reset()
  }, [upload])

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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              &times;
            </button>
          </div>
        )}

        {(step === 'select-style' || step === 'upload-image') && (
          <>
            <StyleSelector
              styles={styles}
              selectedStyleId={selectedStyleId}
              onSelect={handleStyleSelect}
              disabled={step === 'upload-image' && upload.isUploading}
            />

            {selectedStyleId && step === 'upload-image' && (
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-medium text-foreground">Upload Your Image</h3>
                <ImagePicker
                  onFileSelect={upload.setFile}
                  preview={upload.preview}
                  disabled={upload.isUploading}
                />

                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={!upload.pendingFile || upload.isUploading}
                  className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {upload.isUploading
                    ? 'Uploading...'
                    : `Generate Image (${imageGenCost} credits)`}
                </button>
              </div>
            )}
          </>
        )}

        {step === 'generating-image' && taskId && (
          <TaskProgressDisplay taskId={taskId} />
        )}

        {step === 'image-result' && imageResult && (
          <ResultDisplay
            imageUrl={imageResult.imageUrl || ''}
            onSave={handleSave}
            onGenerate3D={handleGenerate3D}
            onReset={handleReset}
            isSaving={isSaving}
            threeDCost={threeDGenCost}
          />
        )}

        {step === 'generating-3d' && taskId && (
          <TaskProgressDisplay taskId={taskId} />
        )}

        {step === '3d-result' && threeDResult && (
          <ThreeDViewer
            modelUrl={threeDResult.modelUrl || ''}
            onDownload={() => window.open(threeDResult.modelUrl, '_blank')}
            onReset={handleReset}
          />
        )}
      </CardContent>
    </Card>
  )
}
