'use client'

import { useState, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { useSubmitUpload } from '@/hooks/useSubmitUpload'
import { useTaskProgress } from '@/hooks/useTaskProgress'
import {
  createFigMeImageTaskAction,
  createFigMe3DTaskAction,
  saveTaskOutputAction,
} from '@/app/actions/tools'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { TaskProgressDisplay } from '@/components/tools/TaskProgressDisplay'
import { StyleSelector } from './figme/StyleSelector'
import { ResultDisplay } from './figme/ResultDisplay'
import { ThreeDViewer } from './figme/ThreeDViewer'
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
  url: string
}

export function FigMeExecutor({ tool }: { tool: ToolDetail }) {
  const { data: session } = useSession()
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
    route: 'tool-input',
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

    const result = await createFigMeImageTaskAction({
      toolSlug: tool.slug,
      styleReferenceId: selectedStyleId,
      imageStorageKey: storageKey,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    setTaskId(result.taskId)
    setStep('generating-image')
  }, [selectedStyleId, upload, tool.slug])

  const handleGenerate3D = useCallback(async () => {
    if (!imageResult || !parentTaskId) return
    setError(null)

    const result = await createFigMe3DTaskAction({
      toolSlug: tool.slug,
      parentTaskId,
      sourceAssetId: imageResult.assetId,
      sourceImageUrl: imageResult.url,
    })

    if (!result.success) {
      setError(result.error)
      return
    }

    setTaskId(result.taskId)
    setStep('generating-3d')
  }, [imageResult, parentTaskId, tool.slug])

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
              <h3 className="font-medium text-gray-900">Upload Your Image</h3>
              <ImagePicker
                onFileSelect={upload.setFile}
                preview={upload.preview}
                disabled={upload.isUploading}
              />

              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={!upload.pendingFile || upload.isUploading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          imageUrl={imageResult.url}
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
          modelUrl={threeDResult.url}
          onDownload={() => window.open(threeDResult.url, '_blank')}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
