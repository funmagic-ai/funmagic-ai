'use client'

import { useState, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from '@/lib/auth-client'
import { useSubmitUpload } from '@/hooks/useSubmitUpload'
import { useTaskProgress } from '@/hooks/useTaskProgress'
import {
  createCrystalMemoryBgRemoveAction,
  createCrystalMemoryVGGTAction,
} from '@/app/actions/tools'
import { ImagePicker } from '@/components/upload/ImagePicker'
import { TaskProgressDisplay } from '@/components/tools/TaskProgressDisplay'
import type { ToolDetail, CrystalMemoryConfig } from '@/lib/types/tool-configs'

// Dynamically import PointCloudViewer to avoid SSR issues with Three.js
const PointCloudViewer = dynamic(
  () => import('./crystal-memory/PointCloudViewer').then((mod) => mod.PointCloudViewer),
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

type ExecutorStep = 'upload' | 'removing-bg' | 'generating-cloud' | 'result'

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

export function CrystalMemoryExecutor({ tool }: { tool: ToolDetail }) {
  const { data: session } = useSession()
  const config = (tool.config || {}) as Partial<CrystalMemoryConfig>

  const [step, setStep] = useState<ExecutorStep>('upload')
  const [bgRemoveTaskId, setBgRemoveTaskId] = useState<string | null>(null)
  const [vggtTaskId, setVggtTaskId] = useState<string | null>(null)
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [bgRemovedPreview, setBgRemovedPreview] = useState<string | null>(null)
  const [bgRemoveOutput, setBgRemoveOutput] = useState<BgRemoveOutput | null>(null)
  const [vggtOutput, setVggtOutput] = useState<VGGTOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const upload = useSubmitUpload({
    route: 'crystal-memory',
    onError: (err) => setError(err),
  })

  // Track background removal task
  useTaskProgress({
    taskId: bgRemoveTaskId,
    onComplete: async (output) => {
      const bgOutput = output as BgRemoveOutput
      setBgRemoveOutput(bgOutput)
      setBgRemovedPreview(bgOutput.bgRemovedImageUrl)

      // Automatically start VGGT step
      const vggtResult = await createCrystalMemoryVGGTAction({
        toolSlug: tool.slug,
        parentTaskId: bgRemoveTaskId!,
        sourceAssetId: bgOutput.assetId,
        bgRemovedImageUrl: bgOutput.bgRemovedImageUrl,
      })

      if (!vggtResult.success) {
        setError(vggtResult.error)
        setStep('upload')
        return
      }

      setVggtTaskId(vggtResult.taskId)
      setStep('generating-cloud')
      setBgRemoveTaskId(null)
    },
    onFailed: (err) => {
      setError(err)
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
    onFailed: (err) => {
      setError(err)
      setStep('upload')
      setVggtTaskId(null)
    },
  })

  const bgRemoveCost = config.steps?.[0]?.cost ?? 5
  const vggtCost = config.steps?.[1]?.cost ?? 15
  const totalCost = bgRemoveCost + vggtCost

  const handleGenerate = useCallback(async () => {
    if (!upload.pendingFile) return
    setError(null)

    setOriginalPreview(URL.createObjectURL(upload.pendingFile))

    const storageKey = await upload.uploadOnSubmit()
    if (!storageKey) {
      setError('Upload failed')
      return
    }

    const taskResult = await createCrystalMemoryBgRemoveAction({
      toolSlug: tool.slug,
      imageStorageKey: storageKey,
    })

    if (!taskResult.success) {
      setError(taskResult.error)
      return
    }

    setBgRemoveTaskId(taskResult.taskId)
    setStep('removing-bg')
  }, [upload, tool.slug])

  const handleReset = useCallback(() => {
    if (originalPreview) {
      URL.revokeObjectURL(originalPreview)
    }
    setStep('upload')
    setBgRemoveOutput(null)
    setVggtOutput(null)
    setOriginalPreview(null)
    setBgRemovedPreview(null)
    setError(null)
    upload.reset()
  }, [originalPreview, upload])

  if (!session) {
    return (
      <div className="bg-card p-8 rounded-xl shadow-sm border text-center">
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
    <div className="bg-card p-6 rounded-xl shadow-sm border space-y-6">
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

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <StepIndicator
          number={1}
          label="Upload"
          isActive={step === 'upload'}
          isComplete={step !== 'upload'}
        />
        <div className="flex-1 h-px bg-border" />
        <StepIndicator
          number={2}
          label="Remove BG"
          isActive={step === 'removing-bg'}
          isComplete={step === 'generating-cloud' || step === 'result'}
        />
        <div className="flex-1 h-px bg-border" />
        <StepIndicator
          number={3}
          label="Generate 3D"
          isActive={step === 'generating-cloud'}
          isComplete={step === 'result'}
        />
        <div className="flex-1 h-px bg-border" />
        <StepIndicator
          number={4}
          label="View"
          isActive={step === 'result'}
          isComplete={false}
        />
      </div>

      {step === 'upload' && (
        <>
          <h3 className="font-medium text-foreground">Upload Your Image</h3>
          <p className="text-sm text-muted-foreground">
            Upload a photo to transform it into a 3D point cloud. Works best with objects
            that have clear edges and distinct colors.
          </p>

          <ImagePicker
            onFileSelect={upload.setFile}
            preview={upload.preview}
            disabled={upload.isUploading}
          />

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!upload.pendingFile || upload.isUploading}
            className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {upload.isUploading
              ? 'Uploading...'
              : `Create 3D Point Cloud (${totalCost} credits)`}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            Cost breakdown: {bgRemoveCost} credits (background removal) + {vggtCost} credits (3D generation)
          </p>
        </>
      )}

      {step === 'removing-bg' && bgRemoveTaskId && (
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Step 1: Removing Background</h3>
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
          <h3 className="font-medium text-foreground">Step 2: Generating 3D Point Cloud</h3>
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
          <h3 className="font-medium text-foreground">Your 3D Point Cloud</h3>
          <p className="text-sm text-muted-foreground">
            Generated {vggtOutput.pointCount.toLocaleString()} points. Use your mouse to rotate,
            scroll to zoom, and right-click to pan.
          </p>

          <Suspense
            fallback={
              <div className="bg-zinc-900 rounded-lg h-[500px] flex items-center justify-center">
                <div className="text-muted-foreground">Loading viewer...</div>
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

function StepIndicator({
  number,
  label,
  isActive,
  isComplete,
}: {
  number: number
  label: string
  isActive: boolean
  isComplete: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          isComplete
            ? 'bg-green-500 text-white'
            : isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
        }`}
      >
        {isComplete ? (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`hidden sm:inline ${
          isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  )
}
