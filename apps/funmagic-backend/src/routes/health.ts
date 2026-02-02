import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { db } from '@funmagic/database';
import { sql } from 'drizzle-orm';
import { redis } from '@funmagic/services';
import {
  HealthSchema,
  HealthDbSchema,
  HealthRedisSchema,
  HealthAllSchema,
} from '../schemas';

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  responses: {
    200: {
      content: { 'application/json': { schema: HealthSchema } },
      description: 'Basic health check',
    },
  },
});

const healthDbRoute = createRoute({
  method: 'get',
  path: '/db',
  tags: ['Health'],
  responses: {
    200: {
      content: { 'application/json': { schema: HealthDbSchema } },
      description: 'Database health check',
    },
    500: {
      content: { 'application/json': { schema: HealthDbSchema } },
      description: 'Database disconnected',
    },
  },
});

const healthRedisRoute = createRoute({
  method: 'get',
  path: '/redis',
  tags: ['Health'],
  responses: {
    200: {
      content: { 'application/json': { schema: HealthRedisSchema } },
      description: 'Redis health check',
    },
    500: {
      content: { 'application/json': { schema: HealthRedisSchema } },
      description: 'Redis disconnected',
    },
  },
});

const healthAllRoute = createRoute({
  method: 'get',
  path: '/all',
  tags: ['Health'],
  responses: {
    200: {
      content: { 'application/json': { schema: HealthAllSchema } },
      description: 'All services health check',
    },
  },
});

export const healthRoutes = new OpenAPIHono()
  .openapi(healthRoute, (c) => {
    return c.json({ status: 'ok' as const, timestamp: new Date().toISOString() });
  })
  .openapi(healthDbRoute, async (c) => {
    try {
      await db.execute(sql`SELECT 1`);
      return c.json({ status: 'ok' as const, database: 'connected' });
    } catch {
      return c.json({ status: 'error' as const, database: 'disconnected' }, 500);
    }
  })
  .openapi(healthRedisRoute, async (c) => {
    try {
      await redis.ping();
      return c.json({ status: 'ok' as const, redis: 'connected' });
    } catch {
      return c.json({ status: 'error' as const, redis: 'disconnected' }, 500);
    }
  })
  .openapi(healthAllRoute, async (c) => {
    const results = {
      status: 'ok' as 'ok' | 'degraded',
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    try {
      await db.execute(sql`SELECT 1`);
      results.services.database = 'connected';
    } catch {
      results.services.database = 'disconnected';
      results.status = 'degraded';
    }

    try {
      await redis.ping();
      results.services.redis = 'connected';
    } catch {
      results.services.redis = 'disconnected';
      results.status = 'degraded';
    }

    return c.json(results);
  });
