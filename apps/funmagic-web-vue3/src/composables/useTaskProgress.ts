import { subscribeToTask } from './useUserStream'

const API_URL = import.meta.env.VITE_API_URL

export interface TaskProgress {
  taskId: string
  status: 'connecting' | 'connected' | 'pending' | 'queued' | 'processing' | 'completed' | 'failed'
  currentStep?: string
  message?: string
  progress: number
  error?: string
  output?: unknown
}

interface SSEEvent {
  type: 'connected' | 'step_started' | 'progress' | 'step_completed' | 'completed' | 'failed' | 'heartbeat'
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

export interface UseTaskProgressOptions {
  onComplete?: (output: unknown) => void
  onFailed?: (error: string) => void
}

export function useTaskProgress(
  taskId: Ref<string | null> | ComputedRef<string | null>,
  options: UseTaskProgressOptions = {},
) {
  const progress = ref<TaskProgress | null>(null)
  let unsubscribe: (() => void) | null = null
  // Track task IDs that have reached a terminal state to prevent re-subscribing
  const resolvedTaskIds = new Set<string>()

  function cleanup() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  async function fetchTaskOutput(id: string): Promise<unknown> {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      })
      if (!response.ok) return null
      const data = await response.json()
      return data.task?.payload?.output ?? null
    } catch {
      return null
    }
  }

  function handleEvent(parsed: SSEEvent) {
    switch (parsed.type) {
      case 'connected':
        progress.value = { ...progress.value!, status: 'connected' }
        break

      case 'step_started':
        progress.value = {
          ...progress.value!,
          status: 'processing',
          currentStep: parsed.stepName || parsed.data?.stepName || parsed.stepId || parsed.data?.stepId,
          message: parsed.message || parsed.data?.message,
          progress: parsed.progress ?? parsed.data?.progress ?? progress.value?.progress ?? 0,
        }
        break

      case 'progress':
        progress.value = {
          ...progress.value!,
          status: 'processing',
          message: parsed.message || parsed.data?.message || progress.value?.message,
          progress: parsed.progress ?? parsed.data?.progress ?? progress.value?.progress ?? 0,
        }
        break

      case 'step_completed':
        progress.value = {
          ...progress.value!,
          progress: parsed.progress ?? parsed.data?.progress ?? 100,
        }
        break

      case 'completed': {
        const output = parsed.output ?? parsed.data?.output
        progress.value = {
          ...progress.value!,
          status: 'completed',
          progress: 100,
          output,
        }
        // Mark this task as resolved so reconnect logic won't retry
        if (progress.value?.taskId) {
          resolvedTaskIds.add(progress.value.taskId)
        }
        options.onComplete?.(output)
        break
      }

      case 'failed': {
        const errorMsg = parsed.error || parsed.data?.error || parsed.message || parsed.data?.message || 'Task failed'
        progress.value = {
          ...progress.value!,
          status: 'failed',
          error: errorMsg,
        }
        if (progress.value?.taskId) {
          resolvedTaskIds.add(progress.value.taskId)
        }
        options.onFailed?.(errorMsg)
        break
      }

      case 'heartbeat':
        break
    }
  }

  /**
   * REST fallback: check task status via GET /api/tasks/{id}.
   * If the task is already completed/failed, handle the result directly.
   * Returns true if the task reached a terminal state.
   */
  async function checkTaskStatusREST(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/api/tasks/${id}`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      })
      if (!response.ok) return false

      const data = await response.json()
      const task = data.task
      if (!task) return false

      if (task.status === 'completed') {
        const output = task.payload?.output ?? null
        handleEvent({ type: 'completed', output })
        return true
      }
      if (task.status === 'failed') {
        handleEvent({ type: 'failed', error: task.payload?.error || 'Task failed' })
        return true
      }
      return false
    } catch {
      return false
    }
  }

  async function connect() {
    const id = taskId.value
    if (!id) return

    // Skip subscribing to tasks that have already been resolved
    if (resolvedTaskIds.has(id)) return

    cleanup()

    progress.value = {
      taskId: id,
      status: 'connecting',
      progress: progress.value?.progress ?? 0,
    }

    // Pre-flight: check if task is already completed/failed via REST
    const alreadyResolved = await checkTaskStatusREST(id)
    if (alreadyResolved) {
      return
    }

    // Task is still active — subscribe via singleton stream
    if (!taskId.value || taskId.value !== id) return // Task changed during REST check

    progress.value = {
      taskId: id,
      status: 'connected',
      progress: progress.value?.progress ?? 0,
    }

    unsubscribe = subscribeToTask(id, async (event) => {
      const parsed = event as unknown as SSEEvent

      if (parsed.type === 'completed') {
        // SSE carries a lightweight signal only — fetch full output via REST
        const output = await fetchTaskOutput(id)
        handleEvent({ ...parsed, output })
        cleanup()
        return
      }

      handleEvent(parsed)

      if (parsed.type === 'failed') {
        cleanup()
      }
    })
  }

  watch(taskId, (newId, oldId) => {
    if (newId !== oldId) {
      cleanup()
      if (newId) {
        connect()
      } else {
        progress.value = null
      }
    }
  }, { immediate: true })

  onUnmounted(cleanup)

  const isConnecting = computed(() => progress.value?.status === 'connecting')
  const isProcessing = computed(() => progress.value?.status === 'processing' || progress.value?.status === 'queued')
  const isCompleted = computed(() => progress.value?.status === 'completed')
  const isFailed = computed(() => progress.value?.status === 'failed')

  return {
    progress: readonly(progress),
    isConnecting,
    isProcessing,
    isCompleted,
    isFailed,
    disconnect: cleanup,
  }
}
