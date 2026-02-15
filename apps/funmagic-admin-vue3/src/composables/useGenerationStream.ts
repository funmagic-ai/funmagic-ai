import { useQueryClient } from '@tanstack/vue-query'

interface GenerationStreamEvent {
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
  const activeStreams = ref<Map<string, EventSource>>(new Map())

  function connectStream(generationId: string) {
    // Don't create duplicate connections
    if (activeStreams.value.has(generationId)) return

    const baseUrl = import.meta.env.VITE_API_URL
    const url = `${baseUrl}/api/admin/studio/generations/${generationId}/stream`

    const es = new EventSource(url, { withCredentials: true })
    activeStreams.value.set(generationId, es)

    const handleTerminal = () => {
      es.close()
      activeStreams.value.delete(generationId)
      // Invalidate project query to refresh generation data
      queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] })
    }

    es.addEventListener('complete', handleTerminal)
    es.addEventListener('error', (e) => {
      // SSE error can mean either a server error event or connection failure
      const event = e as MessageEvent
      if (event.data) {
        // Server sent an error event
        handleTerminal()
      } else {
        // Connection error - close and let polling handle it
        es.close()
        activeStreams.value.delete(generationId)
      }
    })

    es.addEventListener('image_done', () => {
      // Partial update - refresh to show new image
      queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] })
    })

    es.onerror = () => {
      // Connection failed - fall back to polling
      es.close()
      activeStreams.value.delete(generationId)
    }
  }

  function disconnectAll() {
    for (const [, es] of activeStreams.value) {
      es.close()
    }
    activeStreams.value.clear()
  }

  onUnmounted(() => {
    disconnectAll()
  })

  return {
    connectStream,
    disconnectAll,
    activeStreams: readonly(activeStreams),
  }
}
