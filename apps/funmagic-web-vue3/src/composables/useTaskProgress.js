const API_URL = import.meta.env.VITE_API_URL;
const SSE_HEARTBEAT_TIMEOUT = 35000;
const SSE_MAX_RECONNECT_ATTEMPTS = 3;
export function useTaskProgress(taskId, options = {}) {
    const progress = ref(null);
    let abortController = null;
    let heartbeatTimeout = null;
    let reconnectAttempt = 0;
    function cleanup() {
        if (heartbeatTimeout) {
            clearTimeout(heartbeatTimeout);
            heartbeatTimeout = null;
        }
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
    }
    function resetHeartbeatTimeout() {
        if (heartbeatTimeout)
            clearTimeout(heartbeatTimeout);
        heartbeatTimeout = setTimeout(() => {
            if (reconnectAttempt < SSE_MAX_RECONNECT_ATTEMPTS && taskId.value) {
                reconnectAttempt++;
                cleanup();
                connect();
            }
        }, SSE_HEARTBEAT_TIMEOUT);
    }
    function handleEvent(parsed) {
        switch (parsed.type) {
            case 'connected':
                progress.value = { ...progress.value, status: 'connected' };
                break;
            case 'step_started':
                progress.value = {
                    ...progress.value,
                    status: 'processing',
                    currentStep: parsed.stepName || parsed.data?.stepName || parsed.stepId || parsed.data?.stepId,
                    message: parsed.message || parsed.data?.message,
                    progress: parsed.progress ?? parsed.data?.progress ?? progress.value?.progress ?? 0,
                };
                break;
            case 'progress':
                progress.value = {
                    ...progress.value,
                    status: 'processing',
                    message: parsed.message || parsed.data?.message || progress.value?.message,
                    progress: parsed.progress ?? parsed.data?.progress ?? progress.value?.progress ?? 0,
                };
                break;
            case 'step_completed':
                progress.value = {
                    ...progress.value,
                    progress: parsed.progress ?? parsed.data?.progress ?? 100,
                };
                break;
            case 'completed': {
                const output = parsed.output ?? parsed.data?.output;
                progress.value = {
                    ...progress.value,
                    status: 'completed',
                    progress: 100,
                    output,
                };
                options.onComplete?.(output);
                break;
            }
            case 'failed': {
                const errorMsg = parsed.error || parsed.data?.error || parsed.message || parsed.data?.message || 'Task failed';
                progress.value = {
                    ...progress.value,
                    status: 'failed',
                    error: errorMsg,
                };
                options.onFailed?.(errorMsg);
                break;
            }
            case 'heartbeat':
                break;
        }
    }
    /**
     * Try to parse any SSE events remaining in the buffer.
     * Returns true if a terminal event (completed/failed) was found.
     */
    function drainBuffer(buffer) {
        if (!buffer.trim())
            return false;
        let foundTerminal = false;
        const blocks = buffer.split('\n\n');
        for (const block of blocks) {
            const dataLine = block.split('\n').find(l => l.startsWith('data:'));
            if (!dataLine)
                continue;
            const jsonStr = dataLine.slice(5).trim();
            if (!jsonStr)
                continue;
            try {
                const parsed = JSON.parse(jsonStr);
                handleEvent(parsed);
                if (parsed.type === 'completed' || parsed.type === 'failed') {
                    foundTerminal = true;
                }
            }
            catch {
                // Ignore parse errors in drain — data may be incomplete
            }
        }
        return foundTerminal;
    }
    /**
     * REST fallback: check task status via GET /api/tasks/{id}.
     * If the task is already completed/failed, handle the result directly
     * instead of retrying the SSE stream.
     * Returns true if the task reached a terminal state.
     */
    async function checkTaskStatusREST(id) {
        try {
            const response = await fetch(`${API_URL}/api/tasks/${id}`, {
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });
            if (!response.ok)
                return false;
            const data = await response.json();
            const task = data.task;
            if (!task)
                return false;
            if (task.status === 'completed') {
                const output = task.payload?.output ?? null;
                handleEvent({ type: 'completed', output });
                return true;
            }
            if (task.status === 'failed') {
                handleEvent({ type: 'failed', error: 'Task failed' });
                return true;
            }
            return false;
        }
        catch {
            return false;
        }
    }
    async function connect() {
        const id = taskId.value;
        if (!id)
            return;
        cleanup();
        abortController = new AbortController();
        progress.value = {
            taskId: id,
            status: 'connecting',
            progress: progress.value?.progress ?? 0,
        };
        // Pre-flight: check if task is already completed/failed via REST
        // This avoids opening an SSE stream that will immediately fail
        // with ERR_INCOMPLETE_CHUNKED_ENCODING for completed tasks.
        const alreadyResolved = await checkTaskStatusREST(id);
        if (alreadyResolved) {
            cleanup();
            return;
        }
        // Task is still active — proceed with SSE stream
        if (!taskId.value || taskId.value !== id)
            return; // Task changed during REST check
        const url = `${API_URL}/api/tasks/${id}/stream`;
        let terminalReceived = false;
        try {
            const response = await fetch(url, {
                credentials: 'include',
                headers: { 'Accept': 'text/event-stream' },
                signal: abortController.signal,
            });
            if (!response.ok || !response.body) {
                throw new Error(`Stream failed: ${response.status}`);
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            resetHeartbeatTimeout();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, { stream: true });
                    const blocks = buffer.split('\n\n');
                    buffer = blocks.pop() ?? '';
                    for (const block of blocks) {
                        const dataLine = block.split('\n').find(l => l.startsWith('data:'));
                        if (!dataLine)
                            continue;
                        const jsonStr = dataLine.slice(5).trim();
                        if (!jsonStr)
                            continue;
                        resetHeartbeatTimeout();
                        try {
                            const parsed = JSON.parse(jsonStr);
                            handleEvent(parsed);
                            if (parsed.type === 'completed' || parsed.type === 'failed') {
                                terminalReceived = true;
                                reader.cancel();
                                cleanup();
                                return;
                            }
                        }
                        catch (err) {
                            console.warn('[SSE] Failed to parse event:', err);
                        }
                    }
                }
            }
            catch {
                // Stream interrupted (e.g., ERR_INCOMPLETE_CHUNKED_ENCODING).
                // Try to extract events from the remaining buffer.
                if (drainBuffer(buffer)) {
                    terminalReceived = true;
                }
                if (terminalReceived) {
                    cleanup();
                    return;
                }
                // Check task status via REST before reconnecting —
                // the task may have completed but the stream closed before we got the event.
                const resolved = await checkTaskStatusREST(id);
                if (resolved) {
                    cleanup();
                    return;
                }
                // Task is still running — re-throw so outer catch handles reconnection
                throw new Error('Stream interrupted');
            }
        }
        catch (err) {
            if (err.name === 'AbortError')
                return;
            // If we already processed a terminal event, don't reconnect
            if (progress.value?.status === 'completed' || progress.value?.status === 'failed') {
                cleanup();
                return;
            }
            // Reconnect on failure (counter is NOT reset here — only reset in the watcher)
            if (reconnectAttempt < SSE_MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempt++;
                setTimeout(connect, 1000 * reconnectAttempt);
            }
            else {
                // Final attempt: check REST before giving up
                const id = taskId.value;
                if (id) {
                    const resolved = await checkTaskStatusREST(id);
                    if (resolved) {
                        cleanup();
                        return;
                    }
                }
                progress.value = progress.value
                    ? { ...progress.value, status: 'failed', error: 'Connection lost' }
                    : null;
                options.onFailed?.('Connection lost');
            }
        }
    }
    watch(taskId, (newId, oldId) => {
        if (newId !== oldId) {
            cleanup();
            reconnectAttempt = 0;
            if (newId) {
                connect();
            }
            else {
                progress.value = null;
            }
        }
    }, { immediate: true });
    onUnmounted(cleanup);
    const isConnecting = computed(() => progress.value?.status === 'connecting');
    const isProcessing = computed(() => progress.value?.status === 'processing' || progress.value?.status === 'queued');
    const isCompleted = computed(() => progress.value?.status === 'completed');
    const isFailed = computed(() => progress.value?.status === 'failed');
    return {
        progress: readonly(progress),
        isConnecting,
        isProcessing,
        isCompleted,
        isFailed,
        disconnect: cleanup,
    };
}
