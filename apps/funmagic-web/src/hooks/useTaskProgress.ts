'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL
const SSE_HEARTBEAT_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_SSE_HEARTBEAT_TIMEOUT_MS ?? '35000', 10)
const SSE_MAX_RECONNECT_ATTEMPTS = parseInt(process.env.NEXT_PUBLIC_SSE_MAX_RECONNECT_ATTEMPTS ?? '3', 10)

export interface TaskProgress {
  taskId: string
  status: 'connecting' | 'connected' | 'pending' | 'queued' | 'processing' | 'completed' | 'failed'
  currentStep?: string
  progress: number
  error?: string
  output?: unknown
}

interface SSEEvent {
  type: 'connected' | 'step_started' | 'progress' | 'step_completed' | 'completed' | 'failed' | 'heartbeat'
  // Fields can be at root level (from worker) or nested in data (legacy)
  stepId?: string
  stepName?: string
  progress?: number
  output?: unknown
  error?: string
  message?: string
  data?: {
    stepId?: string
    stepName?: string
    progress?: number
    output?: unknown
    error?: string
    message?: string
  }
}

interface UseTaskProgressOptions {
  taskId: string | null
  onComplete?: (output: unknown) => void
  onFailed?: (error: string) => void
  onProgress?: (progress: TaskProgress) => void
}

export function useTaskProgress({
  taskId,
  onComplete,
  onFailed,
  onProgress,
}: UseTaskProgressOptions) {
  const [progress, setProgress] = useState<TaskProgress | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptRef = useRef(0)
  const terminalReceivedRef = useRef(false)
  const maxReconnectAttempts = SSE_MAX_RECONNECT_ATTEMPTS

  // Store callbacks in refs to avoid re-running effect when they change
  const onCompleteRef = useRef(onComplete)
  const onFailedRef = useRef(onFailed)
  const onProgressRef = useRef(onProgress)

  // Keep refs up to date
  useEffect(() => {
    onCompleteRef.current = onComplete
    onFailedRef.current = onFailed
    onProgressRef.current = onProgress
  })

  const cleanup = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
      heartbeatTimeoutRef.current = null
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const resetHeartbeatTimeout = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current)
    }
    heartbeatTimeoutRef.current = setTimeout(() => {
      console.warn('SSE heartbeat timeout, attempting reconnect...')
      if (reconnectAttemptRef.current < maxReconnectAttempts && taskId) {
        reconnectAttemptRef.current++
        cleanup()
      }
    }, SSE_HEARTBEAT_TIMEOUT)
  }, [cleanup, taskId])

  useEffect(() => {
    if (!taskId) {
      cleanup()
      setProgress(null)
      return
    }

    reconnectAttemptRef.current = 0
    terminalReceivedRef.current = false

    const connect = () => {
      const url = `${API_URL}/api/tasks/${taskId}/stream`
      const eventSource = new EventSource(url, { withCredentials: true })
      eventSourceRef.current = eventSource

      setProgress({
        taskId,
        status: 'connecting',
        progress: 0,
      })

      eventSource.onopen = () => {
        resetHeartbeatTimeout()
        reconnectAttemptRef.current = 0
      }

      eventSource.onmessage = (event) => {
        resetHeartbeatTimeout()

        try {
          const parsed: SSEEvent = JSON.parse(event.data)

          switch (parsed.type) {
            case 'connected':
              setProgress((prev) => ({
                ...prev!,
                status: 'connected',
              }))
              break

            case 'step_started':
              setProgress((prev) => {
                const updated: TaskProgress = {
                  ...prev!,
                  status: 'processing',
                  currentStep: parsed.stepName || parsed.data?.stepName || parsed.stepId || parsed.data?.stepId,
                  progress: parsed.progress ?? parsed.data?.progress ?? prev?.progress ?? 0,
                }
                onProgressRef.current?.(updated)
                return updated
              })
              break

            case 'progress':
              setProgress((prev) => {
                const updated: TaskProgress = {
                  ...prev!,
                  status: 'processing',
                  progress: parsed.progress ?? parsed.data?.progress ?? prev?.progress ?? 0,
                }
                onProgressRef.current?.(updated)
                return updated
              })
              break

            case 'step_completed':
              setProgress((prev) => {
                const updated: TaskProgress = {
                  ...prev!,
                  progress: parsed.progress ?? parsed.data?.progress ?? 100,
                }
                onProgressRef.current?.(updated)
                return updated
              })
              break

            case 'completed':
              terminalReceivedRef.current = true
              setProgress((prev) => {
                const output = parsed.output ?? parsed.data?.output
                const updated: TaskProgress = {
                  ...prev!,
                  status: 'completed',
                  progress: 100,
                  output,
                }
                onProgressRef.current?.(updated)
                return updated
              })
              cleanup()
              onCompleteRef.current?.(parsed.output ?? parsed.data?.output)
              break

            case 'failed':
              terminalReceivedRef.current = true
              setProgress((prev) => {
                const errorMsg = parsed.error || parsed.data?.error || parsed.message || parsed.data?.message || 'Task failed'
                const updated: TaskProgress = {
                  ...prev!,
                  status: 'failed',
                  error: errorMsg,
                }
                onProgressRef.current?.(updated)
                return updated
              })
              cleanup()
              onFailedRef.current?.(parsed.error || parsed.data?.error || parsed.message || parsed.data?.message || 'Task failed')
              break

            case 'heartbeat':
              break
          }
        } catch (err) {
          console.error('Failed to parse SSE event:', err)
        }
      }

      eventSource.onerror = () => {
        // Server closes the stream after sending completed/failed.
        // EventSource fires onerror when it detects the drop — ignore it.
        if (terminalReceivedRef.current) {
          cleanup()
          return
        }

        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          reconnectAttemptRef.current++
          cleanup()
          setTimeout(connect, 1000 * reconnectAttemptRef.current)
        } else {
          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'failed',
                  error: 'Connection lost',
                }
              : null
          )
          cleanup()
          onFailedRef.current?.('Connection lost')
        }
      }
    }

    connect()

    return cleanup
  }, [taskId, cleanup, resetHeartbeatTimeout])

  return {
    progress,
    isConnecting: progress?.status === 'connecting',
    isProcessing: progress?.status === 'processing' || progress?.status === 'queued',
    isCompleted: progress?.status === 'completed',
    isFailed: progress?.status === 'failed',
    disconnect: cleanup,
  }
}
