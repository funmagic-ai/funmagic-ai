import { useQueryClient } from '@tanstack/vue-query'
import { subscribeToGeneration } from './useAdminStream'

export interface GenerationStreamEvent {
  type: 'connected' | 'text_delta' | 'text_done' | 'partial_image' | 'image_done' | 'complete' | 'error' | 'heartbeat'
  messageId: string
  chunk?: string
  content?: string
  index?: number
  data?: string
  storageKey?: string
  images?: Array<{ storageKey: string; type?: string }>
  error?: string
  timestamp: string
  status?: string
}

export function useGenerationStream(projectId: Ref<string>) {
  const queryClient = useQueryClient()
  const unsubscribeFns = ref<Map<string, () => void>>(new Map())

  function connectStream(generationId: string) {
    // Don't create duplicate subscriptions
    if (unsubscribeFns.value.has(generationId)) return

    const unsubscribe = subscribeToGeneration(generationId, (event) => {
      const parsed = event as unknown as GenerationStreamEvent

      if (parsed.type === 'image_done') {
        // Partial update - refresh to show new image
        queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] })
      }

      if (parsed.type === 'complete' || parsed.type === 'error') {
        // Terminal event - clean up subscription and refresh
        const unsub = unsubscribeFns.value.get(generationId)
        if (unsub) {
          unsub()
          unsubscribeFns.value.delete(generationId)
        }
        queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] })
      }
    })

    unsubscribeFns.value.set(generationId, unsubscribe)
  }

  function disconnectAll() {
    for (const [, unsub] of unsubscribeFns.value) {
      unsub()
    }
    unsubscribeFns.value.clear()
  }

  onUnmounted(() => {
    disconnectAll()
  })

  return {
    connectStream,
    disconnectAll,
    activeStreams: readonly(unsubscribeFns),
  }
}
