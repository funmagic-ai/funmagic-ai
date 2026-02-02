'use client'

import { useTaskProgress, type TaskProgress } from '@/hooks/useTaskProgress'

interface TaskProgressDisplayProps {
  taskId: string
  onComplete?: (output: unknown) => void
  onFailed?: (error: string) => void
}

export function TaskProgressDisplay({
  taskId,
  onComplete,
  onFailed,
}: TaskProgressDisplayProps) {
  const { progress, isConnecting, isProcessing, isCompleted, isFailed } =
    useTaskProgress({
      taskId,
      onComplete,
      onFailed,
    })

  if (!progress) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          {isConnecting && 'Connecting...'}
          {isProcessing && (progress.currentStep || 'Processing...')}
          {isCompleted && 'Completed!'}
          {isFailed && 'Failed'}
        </h3>
        <StatusBadge status={progress.status} />
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-300 ${
            isFailed ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-600'
          }`}
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <span>{progress.currentStep || 'Waiting...'}</span>
        <span>{Math.round(progress.progress)}%</span>
      </div>

      {isFailed && progress.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {progress.error}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: TaskProgress['status'] }) {
  const getStatusStyles = () => {
    switch (status) {
      case 'connecting':
        return 'bg-gray-100 text-gray-600'
      case 'connected':
      case 'pending':
      case 'queued':
        return 'bg-yellow-100 text-yellow-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting'
      case 'connected':
        return 'Connected'
      case 'pending':
        return 'Pending'
      case 'queued':
        return 'Queued'
      case 'processing':
        return 'Processing'
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyles()}`}>
      {getStatusLabel()}
    </span>
  )
}
