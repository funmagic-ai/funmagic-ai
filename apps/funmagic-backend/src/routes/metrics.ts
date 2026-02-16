import { Hono } from 'hono';
import { getMetricsText, metricsRegistry } from '@funmagic/services';

const METRICS_AUTH_TOKEN = process.env.METRICS_AUTH_TOKEN;

export const metricsRoutes = new Hono()
  .get('/', async (c) => {
    // Optional bearer token auth
    if (METRICS_AUTH_TOKEN) {
      const auth = c.req.header('Authorization');
      if (auth !== `Bearer ${METRICS_AUTH_TOKEN}`) {
        return c.text('Unauthorized', 401);
      }
    }

    const metrics = await getMetricsText();
    return c.text(metrics, 200, {
      'Content-Type': metricsRegistry.contentType,
    });
  });
