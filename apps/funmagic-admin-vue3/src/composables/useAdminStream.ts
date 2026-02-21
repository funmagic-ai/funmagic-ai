/**
 * Singleton SSE connection manager for the admin app.
 *
 * Manages one SSE connection per browser tab to `/api/stream`.
 * All studio generation events are multiplexed through this single connection.
 * Subscribers register by messageId (generationId); events are routed
 * by the `messageId` field.
 */

const API_URL = import.meta.env.VITE_API_URL
const SSE_HEARTBEAT_TIMEOUT = 35000
const SSE_RECONNECT_DELAY = 1000
const SSE_MAX_RECONNECT_ATTEMPTS = 5

type EventCallback = (event: Record<string, unknown>) => void

// Module-level singleton state
const subscribers = new Map<string, Set<EventCallback>>()
let abortController: AbortController | null = null
let heartbeatTimeout: ReturnType<typeof setTimeout> | null = null
let reconnectAttempt = 0
let lastStreamId: string | null = null
let connecting = false

function resetHeartbeatTimeout() {
  if (heartbeatTimeout) clearTimeout(heartbeatTimeout)
  heartbeatTimeout = setTimeout(() => {
    // Heartbeat missed — reconnect
    if (subscribers.size > 0 && reconnectAttempt < SSE_MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempt++
      disconnect()
      connect()
    }
  }, SSE_HEARTBEAT_TIMEOUT)
}

function disconnect() {
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout)
    heartbeatTimeout = null
  }
  if (abortController) {
    abortController.abort()
    abortController = null
  }
  connecting = false
}

async function connect() {
  if (connecting || abortController) return
  if (subscribers.size === 0) return

  connecting = true
  abortController = new AbortController()

  const params = lastStreamId ? `?lastEventId=${encodeURIComponent(lastStreamId)}` : ''
  const url = `${API_URL}/api/stream${params}`

  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: { 'Accept': 'text/event-stream' },
      signal: abortController?.signal,
    })

    if (!response.ok || !response.body) {
      throw new Error(`Stream failed: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    connecting = false
    reconnectAttempt = 0
    resetHeartbeatTimeout()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''

        for (const block of blocks) {
          const dataLine = block.split('\n').find(l => l.startsWith('data:'))
          if (!dataLine) continue

          const jsonStr = dataLine.slice(5).trim()
          if (!jsonStr) continue

          resetHeartbeatTimeout()

          try {
            const parsed = JSON.parse(jsonStr) as Record<string, unknown>

            // Track last stream ID for reconnect replay
            if (parsed.streamId) {
              lastStreamId = parsed.streamId as string
            }

            if (parsed.type === 'heartbeat' || parsed.type === 'connected') {
              continue
            }

            // Route event to subscriber by messageId (generation events)
            // or taskId (task events, if admin also tracks tasks)
            const id = (parsed.messageId as string) || (parsed.taskId as string)
            if (id) {
              const callbacks = subscribers.get(id)
              if (callbacks) {
                for (const cb of callbacks) {
                  cb(parsed)
                }
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      throw err
    }

    // Stream ended gracefully — reconnect if still have subscribers
    if (subscribers.size > 0 && reconnectAttempt < SSE_MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempt++
      disconnect()
      setTimeout(connect, SSE_RECONNECT_DELAY * reconnectAttempt)
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    connecting = false

    // Reconnect with backoff
    if (subscribers.size > 0 && reconnectAttempt < SSE_MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempt++
      disconnect()
      setTimeout(connect, SSE_RECONNECT_DELAY * reconnectAttempt)
    }
  }
}

/**
 * Subscribe to events for a specific generation ID.
 * Lazily connects to the SSE stream on first subscriber.
 * Returns an unsubscribe function.
 */
export function subscribeToGeneration(id: string, callback: EventCallback): () => void {
  let callbacks = subscribers.get(id)
  if (!callbacks) {
    callbacks = new Set()
    subscribers.set(id, callbacks)
  }
  callbacks.add(callback)

  // Lazily connect on first subscriber
  if (subscribers.size > 0 && !abortController && !connecting) {
    connect()
  }

  return () => {
    const cbs = subscribers.get(id)
    if (cbs) {
      cbs.delete(callback)
      if (cbs.size === 0) {
        subscribers.delete(id)
      }
    }

    // Disconnect when no subscribers remain
    if (subscribers.size === 0) {
      disconnect()
      lastStreamId = null
      reconnectAttempt = 0
    }
  }
}
