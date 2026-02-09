# SSE on Bun + Hono + Redis Streams Playbook

Production patterns for Server-Sent Events running on Bun with Hono framework and Redis Streams as the event source. Addresses `ERR_INCOMPLETE_CHUNKED_ENCODING`, high latency, connection drops, and large payload delivery.

## Architecture Overview

```
Client (EventSource)
  │
  ▼
Bun.serve (Hono)
  │  ReadableStream<Uint8Array>
  │  controller.enqueue() per event
  │
  ├── Redis Pub/Sub subscriber (real-time delivery)
  ├── Redis Stream XRANGE replay (gap-fill on connect)
  └── DB poll (safety net every 3s)
```

**Key principle:** SSE carries lightweight notifications only. Bulk data (task output) is fetched via REST after the client receives a `completed` signal.

### Why Pub/Sub + XRANGE (not XREAD BLOCK)

| Approach | Latency | Complexity | Heartbeat conflict |
|----------|---------|------------|--------------------|
| Pub/Sub + XRANGE replay | ~0ms (push) | Moderate | None |
| XREAD BLOCK polling | Up to BLOCK timeout | Lower | BLOCK timeout must be < heartbeat |

Pub/Sub delivers messages immediately via the subscriber callback. XRANGE on connect fills any gap between stream start and subscription. This avoids the XREAD BLOCK timeout conflicting with heartbeat intervals.

## Bun-Specific Constraints

### idleTimeout

Bun's `Bun.serve` has a single `idleTimeout` option (default 10s, max 255s) that applies to **all** connections. There is no per-request `server.timeout(req, seconds)` API.

Each `controller.enqueue()` call resets the idle timer for that connection, so heartbeats serve as the keep-alive mechanism.

**Recommended setting:**

```ts
export default {
  port,
  fetch: app.fetch,
  // Normal API connections get cleaned up in 30s.
  // SSE connections survive via 6s heartbeat resets.
  idleTimeout: 30,
};
```

Setting `idleTimeout: 255` works but penalises all HTTP connections with a 255s idle window. Setting it to 30 with a 6s heartbeat gives 5x safety margin while keeping normal connections tidy.

### ReadableStream (not Hono streamSSE)

Use a raw `ReadableStream<Uint8Array>` and return it as a `new Response(readable, { headers })`. This bypasses Hono's `streamSSE` / `TransformStream` wrappers which can introduce buffering or interfere with Bun's native streaming.

```ts
const readable = new ReadableStream<Uint8Array>({
  start(ctrl) {
    streamCtrl = ctrl;
  },
  cancel() {
    // Client disconnected
    closeAll();
  },
});

return new Response(readable, {
  status: 200,
  headers: new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  }),
});
```

## Zero-Buffering Headers

All four headers are required to prevent buffering at every layer:

| Header | Purpose |
|--------|---------|
| `Content-Type: text/event-stream` | Tells browser to treat as SSE stream |
| `Cache-Control: no-cache, no-transform` | Prevents CDN/browser caching; `no-transform` prevents proxy content modification |
| `Connection: keep-alive` | Keeps TCP connection open |
| `X-Accel-Buffering: no` | Disables Nginx proxy buffering (critical if behind Nginx) |

## Heartbeat Strategy

### Requirements

- Interval **must be less than** `idleTimeout` (6s heartbeat with 30s timeout = 5x margin)
- **Must be a `data:` event** (not SSE comment) so `EventSource.onmessage` fires and the client can reset its own heartbeat timeout
- Must be set up **inside** the stream lifecycle (after Redis subscription is established)

### Why NOT SSE Comments

SSE comments (`: h\n\n`) are invisible to `EventSource.onmessage`. If the client relies on `onmessage` to reset a heartbeat timeout (which it should), SSE comments won't reset it. During long-running operations (e.g., a 60-second AI inference call with no progress updates), the client would think the connection died and disconnect.

```
// BAD: 5 bytes but invisible to EventSource.onmessage — breaks client heartbeat detection
: h\n\n

// GOOD: 29 bytes, triggers onmessage, client can reset its timeout
data: {"type":"heartbeat"}\n\n

// BAD: 70+ bytes, wastes bandwidth with unnecessary timestamp
data: {"type":"heartbeat","timestamp":"2025-01-01T00:00:00.000Z"}\n\n
```

### Implementation

```ts
heartbeatTimer = setInterval(() => {
  if (closed) return;
  writeEvent('{"type":"heartbeat"}');
}, 6000);
```

### Client Heartbeat Timeout

The client must:
1. Reset a timeout on every `onmessage` event (including heartbeats)
2. **Actually reconnect** when the timeout fires (not just cleanup)

```ts
// BAD: kills connection permanently
heartbeatTimeout = setTimeout(() => {
  cleanup(); // Closes EventSource, no reconnection!
}, 35000);

// GOOD: kills and reconnects
heartbeatTimeout = setTimeout(() => {
  cleanup();
  setTimeout(() => connectRef.current?.(), 1000 * reconnectAttemptRef.current);
}, 35000);
```

## Large Output Delivery

### Problem

Tool outputs can be massive (e.g., 13MB point cloud CSV with 268K points). Sending this through Redis Pub/Sub and SSE causes:

- Redis blocking during large PUBLISH
- Single SSE `data:` line with 13MB content
- Client `JSON.parse()` choking on 13MB
- Redis Stream storing 13MB per entry (replayed on every reconnect)

### Solution: Notification + REST Fetch

**SSE only carries a completion signal.** The client fetches full output via REST API.

**Server (worker):**
```ts
// Store output in DB
await db.update(taskPayloads).set({ output: result.output }).where(...);

// Publish lightweight signal — no output in the event
await publishTaskCompleted(redis, taskId);
```

**Server (SSE handler, DB poll path):**
```ts
sendTerminal(JSON.stringify({
  type: current.status,
  // Don't include output — client fetches via REST
  error: current.payload?.error,
  timestamp: new Date().toISOString(),
}));
```

**Client:**
```ts
case 'completed':
  terminalReceivedRef.current = true;
  cleanup();
  // Fetch full output via REST (SSE only carried the signal)
  fetch(`${API_URL}/api/tasks/${taskId}`, { credentials: 'include' })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      const output = data?.task?.payload?.output;
      onCompleteRef.current?.(output);
    })
    .catch(() => {
      // Fallback: use whatever was in the SSE event (if any)
      onCompleteRef.current?.(parsed.output);
    });
  break;
```

This decouples notification from data delivery:
- SSE events stay small and predictable (< 1KB)
- No Redis memory pressure from large Pub/Sub messages
- No risk of SSE buffering or chunked encoding errors from large payloads
- REST endpoint handles large responses naturally (Content-Length, proper framing)

## ERR_INCOMPLETE_CHUNKED_ENCODING

### Root Cause

The server calls `controller.close()` before the client has read the final chunk from the response body. The browser sees the chunked transfer end prematurely and throws this error.

### Solution: Client-Driven Closure

After writing a terminal event (`completed` / `failed`):

1. **Stop** all intervals and Redis subscriptions (no more writes)
2. **Do NOT** call `controller.close()` immediately
3. Let the **client** drive closure via `reader.cancel()` / `AbortController.abort()`
4. Set a **safety timeout** (30s) to call `closeAll()` in case the client never disconnects

```ts
function onTerminalWritten() {
  // Stop producing events
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (subscriber) {
    subscriber.unsubscribe(channel).catch(() => {});
    subscriber.quit().catch(() => {});
    subscriber = null;
  }
  // Safety net: close stream if client doesn't disconnect within 30s
  if (!safetyTimer) {
    safetyTimer = setTimeout(closeAll, 30_000);
  }
}
```

### Safety Timeout Sizing

- **Too short** (e.g., 5-10s): slow clients or high-latency networks may not have read the final event yet
- **Too long** (e.g., 5min): leaked resources if client silently disappears
- **Recommended**: 30s — covers slow networks without holding resources too long

## Lifecycle & Cleanup

### Resource Tracking

Track all resources that need cleanup:

```ts
let streamCtrl: ReadableStreamDefaultController<Uint8Array>;
let closed = false;
let subscriber: Redis | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
```

### closeAll() Function

Single cleanup function called from every exit path:

```ts
function closeAll() {
  if (closed) return; // Idempotent guard
  closed = true;
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (safetyTimer) { clearTimeout(safetyTimer); safetyTimer = null; }
  if (subscriber) {
    subscriber.unsubscribe(channel).catch(() => {});
    subscriber.quit().catch(() => {});
    subscriber = null;
  }
  // Remove abort listener to prevent leak
  req.signal.removeEventListener('abort', onAbort);
  try { streamCtrl.close(); } catch { /* already closed */ }
}
```

### Three Cleanup Triggers

1. **`cancel()` on ReadableStream** — client called `reader.cancel()` or navigated away
2. **`abort` event on `req.signal`** — backup path for fetch abort
3. **Safety timeout** — fallback after terminal event if client doesn't disconnect

Always remove the abort event listener in `closeAll()` to prevent listener leaks when the stream closes normally.

## Terminal Event Deduplication

Multiple sources (Pub/Sub, stream replay, DB poll) may detect the same terminal state. Use a guard flag:

```ts
let terminalSent = false;

function sendTerminal(data: string) {
  if (terminalSent || closed) return;
  terminalSent = true;
  writeEvent(data);
  onTerminalWritten();
}
```

## Redis Subscriber Connection

### Dedicated Connection Required

ioredis requires a dedicated connection for Pub/Sub (a connection in subscribe mode cannot execute other commands). Create a new connection per SSE stream using a factory function.

### Error Handling

```ts
subscriber.on('error', (err) => {
  // Log but don't close SSE — DB poll fallback still works
  console.error(`Redis subscriber error:`, err.message);
});

subscriber.on('close', () => {
  // ioredis auto-reconnects on transient disconnects
  // Don't close the SSE stream
});

subscriber.on('end', () => {
  // ioredis gave up reconnecting or quit() was called
  subscriber = null;
});
```

### Connection Timeout

Wait for the subscriber to be ready with an explicit timeout:

```ts
await new Promise<void>((resolve, reject) => {
  if (subscriber.status === 'ready') { resolve(); return; }
  const t = setTimeout(() => reject(new Error('Redis timeout')), 5000);
  subscriber.once('ready', () => { clearTimeout(t); resolve(); });
  subscriber.once('error', (err) => { clearTimeout(t); reject(err); });
});
```

## Event Flow Timeline

```
t=0    Client connects
t=0    → Send "connected" event
t=0    → Subscribe to Redis Pub/Sub channel
t=0    → XRANGE replay (fill gap)
t=6    → Heartbeat data event ({"type":"heartbeat"})
t=12   → Heartbeat data event ({"type":"heartbeat"})
t=?    ← Redis Pub/Sub message → enqueue immediately
t=?    → DB poll (every 3s, safety net)
t=end  ← Terminal signal (completed/failed, no output) → sendTerminal()
t=end  → Stop intervals, unsubscribe Redis
t=end  ← Client fetches full output via REST GET /tasks/:taskId
t=end  → Wait for client to close (safety timeout 30s)
t=end+30 → closeAll() if client hasn't disconnected
```

## Client Implementation: Vue 3 Composable with fetch API

When the client uses the `fetch` API (instead of `EventSource`), SSE is consumed via `ReadableStream`. The `completed` handler must fetch full output via REST before firing the callback.

```ts
const API_URL = import.meta.env.VITE_API_URL

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

// Inside the SSE reading loop:
const parsed: SSEEvent = JSON.parse(jsonStr)

if (parsed.type === 'completed') {
  // SSE carries a lightweight signal only — fetch full output via REST
  const output = await fetchTaskOutput(id)
  handleEvent({ ...parsed, output })
  reader.cancel()
  cleanup()
  return
}

handleEvent(parsed)

if (parsed.type === 'failed') {
  reader.cancel()
  cleanup()
  return
}
```

**Critical:** Any code path that processes a `completed` event must fetch output via REST first. Watch for alternative paths like `drainBuffer()` (processes remaining buffer after stream close) and `checkTaskStatusREST()` (pre-flight check) — both must include the output in the event they construct.

## Debugging Checklist

### Connection Drops During Long Operations

**Symptom:** `subscribers: 0` on completed event, client shows error.

**Check:**
1. Is the server heartbeat a `data:` event (not SSE comment)?
2. Does the client reset its timeout on `onmessage` (including heartbeat)?
3. Does the client's heartbeat timeout handler actually reconnect (not just cleanup)?
4. Is there a gap > client timeout (default 35s) between progress events?

### Large Output Not Delivered

**Symptom:** Task shows "completed" but output is missing/empty.

**Check:**
1. Is the worker sending output through `publishTaskCompleted`? (It shouldn't.)
2. Does the client fetch output via REST on completion?
3. Is the REST endpoint returning the full `task.payload.output`?
4. Are ALL code paths that handle `completed` fetching via REST? (Check `drainBuffer`, `checkTaskStatusREST`, and the main SSE loop.)

### Changes to Client SSE Code Not Taking Effect

**Symptom:** Code changes to `.ts` composables/hooks have zero effect. No console.log output, no behavior change. The old behavior persists exactly.

**Root cause:** Stale compiled `.js` files in the `src/` directory shadow the `.ts` source files.

Vite's default `resolve.extensions` order is: `.mjs` → `.js` → `.mts` → `.ts` → `.jsx` → `.tsx`. For extensionless imports like `import { useTaskProgress } from '@/composables/useTaskProgress'`, Vite resolves **`.js` before `.ts`**. If a stale `.js` file exists alongside the `.ts` file, all edits to the `.ts` file are silently ignored.

**Check:**
1. Are there `.js` files alongside `.ts` files in `src/`?
   ```bash
   find apps/*/src -name '*.js' -type f
   ```
2. If found, delete them:
   ```bash
   find apps/*/src -name '*.js' -type f -delete
   ```
3. Prevent recurrence — add to `.gitignore`:
   ```
   apps/*/src/**/*.js
   ```
4. Restart the Vite dev server after cleanup.

**How they get created:** Accidental `tsc` invocation, IDE auto-compile, or build tool misconfiguration that writes compiled output into `src/` instead of `dist/`.

### Redis Pub/Sub Subscriber Count

The `subscribers` count in worker logs reflects Redis Pub/Sub subscribers at publish time:
- `subscribers: 1` — SSE stream's Redis subscriber is active (doesn't mean client is reading)
- `subscribers: 0` — subscriber disconnected (cleanup ran, or Redis connection dropped)

Note: there can be a delay between client disconnecting and server cleanup running. Events published during this window show `subscribers: 1` even though nobody is reading.

### Monorepo: Debugging the Wrong App

**Symptom:** All changes have zero effect. Console.log statements produce no output at all. The app behaves identically before and after changes.

**Check:** In a monorepo with multiple frontend apps (e.g., `funmagic-web` (Next.js) and `funmagic-web-vue3` (Vue 3)), verify you are editing the app that is actually running in the browser. Check:
1. The URL bar — which port / app is loaded?
2. The dev server output — which app is serving?
3. The file you're editing — is it in the correct `apps/` subdirectory?

## Checklist for New SSE Endpoints

### Server
- [ ] Raw `ReadableStream<Uint8Array>` (not Hono streamSSE)
- [ ] All four zero-buffering headers set
- [ ] Heartbeat interval < `idleTimeout` (6s with 30s timeout)
- [ ] Heartbeat uses `data:` event format (not SSE comment)
- [ ] SSE events carry only lightweight signals (no bulk output)
- [ ] `closeAll()` is idempotent (guarded by `closed` flag)
- [ ] Abort listener removed in `closeAll()`
- [ ] Terminal events deduplicated via `terminalSent` flag
- [ ] Stream not closed by server after terminal event (client-driven closure)
- [ ] Safety timeout (30s) as fallback cleanup
- [ ] Dedicated Redis connection for Pub/Sub subscriber
- [ ] Redis subscriber properly cleaned up (unsubscribe + quit)
- [ ] DB poll as safety net for missed Pub/Sub messages

### Client
- [ ] Client heartbeat timeout triggers reconnection (not just cleanup)
- [ ] Client fetches full output via REST on `completed` (not from SSE event)
- [ ] ALL `completed` code paths fetch via REST (main loop, drainBuffer, checkTaskStatusREST)
- [ ] No stale `.js` files in `src/` shadowing `.ts` sources (Vite resolves `.js` before `.ts`)
