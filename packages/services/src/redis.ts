import { Redis } from 'ioredis';

let _redis: Redis | null = null;

/**
 * Get the shared Redis singleton instance.
 * Uses lazy initialization to avoid issues when env vars aren't loaded yet.
 */
export function getRedis(): Redis {
  if (!_redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }
    _redis = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  }
  return _redis;
}

/**
 * Backward-compatible lazy proxy that delegates to the singleton.
 * Allows `import { redis } from '@funmagic/services'` syntax.
 */
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as any)[prop];
  },
});

/**
 * Factory for creating new Redis connections.
 * Use this when you need a separate connection (e.g., for BullMQ workers).
 */
export function createRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}
