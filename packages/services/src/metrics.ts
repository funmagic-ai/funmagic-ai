import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Shared Prometheus metrics registry.
 *
 * Usage:
 *   import { httpRequestsTotal, httpRequestDuration } from '@funmagic/services';
 *   httpRequestsTotal.inc({ method: 'GET', route: '/api/tasks', status: '200' });
 */

export const metricsRegistry = new Registry();

// Collect default Node.js metrics (event loop lag, heap, GC, etc.)
collectDefaultMetrics({ register: metricsRegistry });

// ─── HTTP Metrics (Backend) ───

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

// ─── Task Metrics (Worker) ───

export const taskDuration = new Histogram({
  name: 'task_duration_seconds',
  help: 'Task processing duration in seconds',
  labelNames: ['tool', 'status'] as const,
  buckets: [0.5, 1, 2.5, 5, 10, 30, 60, 120, 300],
  registers: [metricsRegistry],
});

export const tasksTotal = new Counter({
  name: 'tasks_total',
  help: 'Total number of tasks processed',
  labelNames: ['tool', 'status'] as const,
  registers: [metricsRegistry],
});

export const taskQueueWait = new Histogram({
  name: 'task_queue_wait_seconds',
  help: 'Time spent waiting in queue before processing',
  labelNames: ['queue'] as const,
  buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60],
  registers: [metricsRegistry],
});

// ─── Provider Metrics (Worker) ───

export const providerApiDuration = new Histogram({
  name: 'provider_api_duration_seconds',
  help: 'External provider API call duration in seconds',
  labelNames: ['provider', 'operation'] as const,
  buckets: [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120],
  registers: [metricsRegistry],
});

export const providerRateLimitHits = new Counter({
  name: 'provider_rate_limit_hits_total',
  help: 'Number of provider rate limit hits',
  labelNames: ['provider'] as const,
  registers: [metricsRegistry],
});

export const providerErrors = new Counter({
  name: 'provider_errors_total',
  help: 'Total provider errors',
  labelNames: ['provider', 'error_type'] as const,
  registers: [metricsRegistry],
});

// ─── Queue Metrics (sampled) ───

export const bullmqWaiting = new Gauge({
  name: 'bullmq_waiting',
  help: 'Number of waiting jobs in queue',
  labelNames: ['queue'] as const,
  registers: [metricsRegistry],
});

export const bullmqActive = new Gauge({
  name: 'bullmq_active',
  help: 'Number of active jobs in queue',
  labelNames: ['queue'] as const,
  registers: [metricsRegistry],
});

export const bullmqFailed = new Gauge({
  name: 'bullmq_failed',
  help: 'Number of failed jobs in queue',
  labelNames: ['queue'] as const,
  registers: [metricsRegistry],
});

/**
 * Serialize all metrics in Prometheus text format.
 */
export async function getMetricsText(): Promise<string> {
  return metricsRegistry.metrics();
}

/**
 * Returns a minimal HTTP handler for `/metrics` compatible with Bun.serve.
 */
export function createMetricsHandler(authToken?: string) {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);

    if (url.pathname !== '/metrics') {
      return new Response('Not Found', { status: 404 });
    }

    // Optional basic auth
    if (authToken) {
      const auth = req.headers.get('Authorization');
      if (auth !== `Bearer ${authToken}`) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const metrics = await getMetricsText();
    return new Response(metrics, {
      headers: { 'Content-Type': metricsRegistry.contentType },
    });
  };
}
