import { Redis, type RedisOptions } from 'ioredis';
import { createLogger } from './logger';

const log = createLogger('Redis');

/**
 * Robust Redis connection options for handling reconnection scenarios.
 * These settings help prevent "Connection is closed" errors in SSE/Pub/Sub contexts.
 */
const REDIS_OPTIONS: RedisOptions = {
  maxRetriesPerRequest: null, // Required for BullMQ compatibility
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000, // 10s connection timeout
  keepAlive: 30000, // 30s TCP keepalive
  retryStrategy: (times: number) => {
    if (times > 10) return null; // Stop retrying after 10 attempts
    return Math.min(times * 100, 3000); // Exponential backoff, max 3s
  },
  reconnectOnError: (err: Error) => {
    // Reconnect on common transient errors
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
};

let _redis: Redis | null = null;

/**
 * Get the shared Redis singleton instance.
 * Uses lazy initialization to avoid issues when env vars aren't loaded yet.
 * Includes connection event listeners for observability.
 */
export function getRedis(): Redis {
  if (!_redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required');
    }
    _redis = new Redis(redisUrl, REDIS_OPTIONS);

    // Add connection event listeners for observability
    _redis.on('error', (err) => {
      log.error({ err }, 'Connection error');
    });

    _redis.on('close', () => {
      log.warn('Connection closed');
    });

    _redis.on('reconnecting', () => {
      log.info('Reconnecting...');
    });

    _redis.on('ready', () => {
      log.info('Connection ready');
    });
  }
  return _redis;
}

/**
 * Backward-compatible lazy proxy that delegates to the singleton.
 * Allows `import { redis } from '@funmagic/services'` syntax.
 */
export const redis = new Proxy({} as Redis, {
  get(_, prop: string | symbol) {
    return Reflect.get(getRedis(), prop);
  },
});

/**
 * Factory for creating new Redis connections.
 * Use this when you need a separate connection (e.g., for BullMQ workers, Pub/Sub subscribers).
 * Each connection uses the same robust options as the singleton.
 */
export function createRedisConnection(): Redis {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required');
  }
  return new Redis(redisUrl, REDIS_OPTIONS);
}
