'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
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
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { formatToolError } from '@/lib/tool-errors'
import type { ToolErrorCode, ToolErrorData } from '@/lib/tool-errors'
import type { ToolDetail, StyleReference } from '@/lib/types/tool-configs'
import type { SavedToolConfig } from '@funmagic/shared'

type ExecutorStep =
  | 'style-upload'
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

type ErrorState = { code: ToolErrorCode; data?: ToolErrorData } | null

export function FigMeClient({ tool }: { tool: ToolDetail }) {
  const { session } = useSessionContext()
  const t = useTranslations('toolErrors')
  const config = (tool.config || { steps: [] }) as SavedToolConfig

  const [step, setStep] = useState<ExecutorStep>('style-upload')
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [parentTaskId, setParentTaskId] = useState<string | null>(null)
  const [imageResult, setImageResult] = useState<TaskOutput | null>(null)
  const [threeDResult, setThreeDResult] = useState<TaskOutput | null>(null)
  const [error, setError] = useState<ErrorState>(null)
  const [isSaving, setIsSaving] = useState(false)

  const upload = useSubmitUpload({
    route: 'figme',
    onError: () => setError({ code: 'UPLOAD_FAILED' }),
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
    onFailed: () => {
      setError({ code: 'TASK_FAILED' })
      setStep('style-upload')
      setTaskId(null)
    },
  })

  const imageGenStep = config.steps?.[0]
  const rawStyles = (imageGenStep?.styleReferences as Partial<StyleReference>[] | undefined) || []
  // Normalize styles with fallback id/name for backward compatibility
  const styles: StyleReference[] = rawStyles.map((s, i) => ({
    id: s.id || `style-${i}`,
    name: s.name || `Style ${i + 1}`,
    imageUrl: s.imageUrl || '',
    prompt: s.prompt,
  }))
  const imageGenCost = imageGenStep?.cost ?? 20
  const threeDGenCost = config.steps?.[1]?.cost ?? 30

  const handleStyleSelect = useCallback((styleId: string) => {
    setSelectedStyleId(styleId)
    setError(null)
  }, [])

  const handleGenerateImage = useCallback(async () => {
    if (!selectedStyleId || !upload.pendingFile) return
    setError(null)

    const storageKey = await upload.uploadOnSubmit()
    if (!storageKey) {
      setError({ code: 'UPLOAD_FAILED' })
      return
    }

    const result = await createImageTaskAction({
      styleReferenceId: selectedStyleId,
      imageStorageKey: storageKey,
    })

    if (!result.success) {
      setError({ code: result.code, data: result.errorData })
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
      setError({ code: result.code, data: result.errorData })
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
      setError({ code: 'SAVE_FAILED' })
    }

    setIsSaving(false)
  }, [parentTaskId])

  const handleReset = useCallback(() => {
    setStep('style-upload')
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
      <div className="glass-panel rounded-xl p-6 py-8 text-center">
        <p className="text-muted-foreground mb-4">Please sign in to use this tool</p>
        <a
          href="/login"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
        >
          Sign In
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {step === 'style-upload' && (
        <>
          {/* Section 1: Style Selection */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-foreground">Choose a Style</h3>
            <StyleSelector
              styles={styles}
              selectedStyleId={selectedStyleId}
              onSelect={handleStyleSelect}
              disabled={upload.isUploading}
            />
          </div>

          {/* Section 2: Upload Your Image */}
          <div className="glass-panel rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-foreground">Upload Your Image</h3>
            <ImagePicker
              onFileSelect={upload.setFile}
              preview={upload.preview}
              disabled={upload.isUploading}
            />

            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={!selectedStyleId || !upload.pendingFile || upload.isUploading}
              className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {upload.isUploading
                ? 'Uploading...'
                : `Generate Image (${imageGenCost} credits)`}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
                <span>{formatToolError(t, error.code, error.data)}</span>
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
          </div>
        </>
      )}

      {step === 'generating-image' && taskId && (
        <div className="glass-panel rounded-xl p-6">
          <TaskProgressDisplay taskId={taskId} />
        </div>
      )}

      {step === 'image-result' && imageResult && (
        <div className="glass-panel rounded-xl p-6">
          <ResultDisplay
            imageUrl={imageResult.imageUrl || ''}
            onSave={handleSave}
            onGenerate3D={handleGenerate3D}
            onReset={handleReset}
            isSaving={isSaving}
            threeDCost={threeDGenCost}
          />
        </div>
      )}

      {step === 'generating-3d' && taskId && (
        <div className="glass-panel rounded-xl p-6">
          <TaskProgressDisplay taskId={taskId} />
        </div>
      )}

      {step === '3d-result' && threeDResult && (
        <div className="glass-panel rounded-xl p-6">
          <ThreeDViewer
            modelUrl={threeDResult.modelUrl || ''}
            onDownload={() => window.open(threeDResult.modelUrl, '_blank')}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  )
}
