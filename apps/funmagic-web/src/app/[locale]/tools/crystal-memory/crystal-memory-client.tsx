'use client'

import { useState, useCallback, Suspense, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useSessionContext } from '@/components/providers/session-provider'
import { useSubmitUpload } from '@/hooks/useSubmitUpload'
import { useTaskProgress } from '@/hooks/useTaskProgress'
import {
  createBgRemoveTaskAction,
  createVGGTTaskAction,
} from './actions'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { ImageCropper } from '@/components/upload/ImageCropper'
import { TaskProgressDisplay } from '@/components/tools/TaskProgressDisplay'
import { Button } from '@/components/ui/button'
import { formatToolError } from '@/lib/tool-errors'
import type { ToolErrorCode, ToolErrorData } from '@/lib/tool-errors'
import type { ToolDetail } from '@/lib/types/tool-configs'
import type { SavedToolConfig } from '@funmagic/shared'

// Dynamically import PointCloudViewer to avoid SSR issues with Three.js
const PointCloudViewer = dynamic(
  () => import('./point-cloud-viewer').then((mod) => mod.PointCloudViewer),
  {
    ssr: false,
    loading: () => (
      <div className="bg-zinc-900 rounded-lg h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading 3D Viewer...</p>
        </div>
      </div>
    ),
  }
)

type ExecutorStep = 'upload' | 'cropping' | 'removing-bg' | 'generating-cloud' | 'result'

interface BgRemoveOutput {
  assetId: string
  storageKey: string
  bgRemovedImageUrl: string
  originalUrl: string
}

interface VGGTOutput {
  assetId: string
  storageKey: string
  pointCount: number
  dimensions: { height: number; width: number }
  txt: string
  conf: number[]
}

type ErrorState = { code: ToolErrorCode; data?: ToolErrorData } | null

export function CrystalMemoryClient({ tool }: { tool: ToolDetail }) {
  const { session } = useSessionContext()
  const tErrors = useTranslations('toolErrors')
  const t = useTranslations('tools.crystalMemory')
  const pathname = usePathname()
  const config = (tool.config || { steps: [] }) as SavedToolConfig

  const [step, setStep] = useState<ExecutorStep>('upload')
  const [bgRemoveTaskId, setBgRemoveTaskId] = useState<string | null>(null)
  const [vggtTaskId, setVggtTaskId] = useState<string | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [bgRemovedPreview, setBgRemovedPreview] = useState<string | null>(null)
  const [bgRemoveOutput, setBgRemoveOutput] = useState<BgRemoveOutput | null>(null)
  const [vggtOutput, setVggtOutput] = useState<VGGTOutput | null>(null)
  const [error, setError] = useState<ErrorState>(null)

  // State for raw file before cropping
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [rawPreview, setRawPreview] = useState<string | null>(null)

  // Track previous pathname to detect navigation
  const prevPathnameRef = useRef(pathname)

  const upload = useSubmitUpload({
    route: 'crystal-memory',
    onError: () => setError({ code: 'UPLOAD_FAILED' }),
  })

  // Store upload.reset in a ref to avoid dependency issues
  const uploadResetRef = useRef(upload.reset)
  uploadResetRef.current = upload.reset

  // Reset state when navigating to this page
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      // Pathname changed - user navigated here, reset state
      prevPathnameRef.current = pathname
      setStep('upload')
      setBgRemoveTaskId(null)
      setVggtTaskId(null)
      setOriginalPreview(null)
      setBgRemovedPreview(null)
      setBgRemoveOutput(null)
      setVggtOutput(null)
      setError(null)
      setRawFile(null)
      setRawPreview(null)
      uploadResetRef.current()
    }
  }, [pathname])

  // Track background removal task
  useTaskProgress({
    taskId: bgRemoveTaskId,
    onComplete: async (output) => {
      const bgOutput = output as BgRemoveOutput
      setBgRemoveOutput(bgOutput)
      setBgRemovedPreview(bgOutput.bgRemovedImageUrl)

      // Automatically start VGGT step
      const vggtResult = await createVGGTTaskAction({
        parentTaskId: bgRemoveTaskId!,
        sourceAssetId: bgOutput.assetId,
        bgRemovedImageUrl: bgOutput.bgRemovedImageUrl,
      })

      if (!vggtResult.success) {
        setError({ code: vggtResult.code, data: vggtResult.errorData })
        setStep('upload')
        return
      }

      setVggtTaskId(vggtResult.taskId)
      setStep('generating-cloud')
      setBgRemoveTaskId(null)
    },
    onFailed: (errorMessage) => {
      setError({ code: 'TASK_FAILED', data: { message: errorMessage } })
      setStep('upload')
      setBgRemoveTaskId(null)
    },
  })

  // Track VGGT task
  useTaskProgress({
    taskId: vggtTaskId,
    onComplete: (output) => {
      setVggtOutput(output as VGGTOutput)
      setStep('result')
      setVggtTaskId(null)
    },
    onFailed: (errorMessage) => {
      setError({ code: 'TASK_FAILED', data: { message: errorMessage } })
      setStep('upload')
      setVggtTaskId(null)
    },
  })

  const bgRemoveCost = config.steps?.[0]?.cost ?? 5
  const vggtCost = config.steps?.[1]?.cost ?? 15
  const totalCost = bgRemoveCost + vggtCost

  // Handle file selection - go to cropping step for non-square images
  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) {
        setRawFile(null)
        if (rawPreview) {
          URL.revokeObjectURL(rawPreview)
        }
        setRawPreview(null)
        upload.setFile(null)
        return
      }

      // Check if image is square
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        const isSquare = img.width === img.height
        if (isSquare) {
          // Square image - skip cropping
          upload.setFile(file)
          URL.revokeObjectURL(objectUrl)
        } else {
          // Non-square image - go to cropping step
          setRawFile(file)
          setRawPreview(objectUrl)
          setStep('cropping')
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        setError({ code: 'UPLOAD_FAILED' })
      }

      img.src = objectUrl
    },
    [rawPreview, upload]
  )

  // Handle crop confirmation
  const handleCropComplete = useCallback(
    (blob: Blob) => {
      const croppedFile = new File([blob], rawFile?.name || 'cropped.png', { type: 'image/png' })
      upload.setFile(croppedFile)

      // Clean up raw preview
      if (rawPreview) {
        URL.revokeObjectURL(rawPreview)
      }
      setRawPreview(null)
      setRawFile(null)
      setStep('upload')
    },
    [rawFile, rawPreview, upload]
  )

  // Handle crop cancellation
  const handleCropCancel = useCallback(() => {
    if (rawPreview) {
      URL.revokeObjectURL(rawPreview)
    }
    setRawPreview(null)
    setRawFile(null)
    setStep('upload')
  }, [rawPreview])

  const handleGenerate = useCallback(async () => {
    if (!upload.pendingFile) return
    setError(null)

    setOriginalPreview(URL.createObjectURL(upload.pendingFile))

    const storageKey = await upload.uploadOnSubmit()
    if (!storageKey) {
      setError({ code: 'UPLOAD_FAILED' })
      return
    }

    const taskResult = await createBgRemoveTaskAction({
      imageStorageKey: storageKey,
    })

    if (!taskResult.success) {
      setError({ code: taskResult.code, data: taskResult.errorData })
      return
    }

    setBgRemoveTaskId(taskResult.taskId)
    setStep('removing-bg')
  }, [upload])

  const handleReset = useCallback(() => {
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview)
    }
    if (rawPreview) {
      URL.revokeObjectURL(rawPreview)
    }
    setStep('upload')
    setBgRemoveOutput(null)
    setVggtOutput(null)
    setOriginalPreview(null)
    setBgRemovedPreview(null)
    setRawFile(null)
    setRawPreview(null)
    setError(null)
    upload.reset()
  }, [originalPreview, rawPreview, upload])

  if (!session) {
    return (
      <div className="glass-panel rounded-xl p-6 py-8 text-center">
        <p className="text-muted-foreground mb-4">{t('signInRequired')}</p>
        <a
          href="/login"
          className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
        >
          {t('signIn')}
        </a>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-xl p-6 space-y-6">
        {step === 'upload' && (
          <>
            <h3 className="font-medium text-foreground">{t('uploadTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('uploadDescription')}
            </p>

            <ImagePicker
              onFileSelect={handleFileSelect}
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
                ? t('uploading')
                : t('createButton', { cost: totalCost })}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg dark:bg-red-950/50 dark:border-red-900 dark:text-red-400">
                {formatToolError(tErrors, error.code, error.data)}
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="float-right text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  &times;
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {t('costBreakdown', { bgCost: bgRemoveCost, vggtCost: vggtCost })}
            </p>
          </>
        )}

        {step === 'cropping' && rawPreview && (
          <>
            <h3 className="font-medium text-foreground">{t('cropTitle')}</h3>
            <ImageCropper
              imageSrc={rawPreview}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          </>
        )}

        {step === 'removing-bg' && bgRemoveTaskId && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">{t('step1Title')}</h3>
            {originalPreview && (
              <div className="flex justify-center">
                <img
                  src={originalPreview}
                  alt="Original"
                  className="max-h-48 rounded-lg opacity-50"
                />
              </div>
            )}
            <TaskProgressDisplay taskId={bgRemoveTaskId} />
          </div>
        )}

        {step === 'generating-cloud' && vggtTaskId && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">{t('step2Title')}</h3>
            {bgRemovedPreview && (
              <div className="flex justify-center">
                <img
                  src={bgRemovedPreview}
                  alt="Background Removed"
                  className="max-h-48 rounded-lg"
                />
              </div>
            )}
            <TaskProgressDisplay taskId={vggtTaskId} />
          </div>
        )}

        {step === 'result' && vggtOutput && (
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">{t('resultTitle')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('resultDescription', { pointCount: vggtOutput.pointCount.toLocaleString() })}
            </p>

            <Suspense
              fallback={
                <div className="bg-zinc-900 rounded-lg h-[500px] flex items-center justify-center">
                  <div className="text-muted-foreground">{t('loadingViewer')}</div>
                </div>
              }
            >
              <PointCloudViewer
                data={{ txt: vggtOutput.txt, conf: vggtOutput.conf }}
                onReset={handleReset}
              />
            </Suspense>
          </div>
        )}
    </div>
  )
}
