import { createMiddleware } from 'hono/factory';
import { httpRequestsTotal, httpRequestDuration } from '@funmagic/services';

/**
 * HTTP metrics middleware — records request count and duration for Prometheus.
 *
 * Skips `/health/*` and `/metrics` paths to avoid noise.
 */
export const httpMetrics = createMiddleware(async (c, next) => {
  const path = c.req.path;

  // Skip health checks and the metrics endpoint itself
  if (path.startsWith('/health') || path === '/metrics') {
    return next();
  }

  const start = performance.now();

  await next();

  const durationSec = (performance.now() - start) / 1000;
  const method = c.req.method;
  const status = String(c.res.status);

  // Normalize route: replace UUIDs and numeric IDs with :id placeholder
  // to prevent high-cardinality label explosion
  const route = path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id');

  httpRequestsTotal.inc({ method, route, status });
  httpRequestDuration.observe({ method, route, status }, durationSec);
});
