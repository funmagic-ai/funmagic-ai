import { eq } from 'drizzle-orm';
import type { DbInstance } from '@funmagic/database';
import { providers, adminProviders } from '@funmagic/database';
import type { ProviderRateLimitConfig, ProviderConfig } from '@funmagic/database';
import type { Redis } from 'ioredis';

export type ProviderScope = 'web' | 'admin';

export interface AcquireResult {
  allowed: boolean;
  reason?: 'concurrency' | 'rpm' | 'rpd';
  retryAfterMs?: number;
}

const CONFIG_CACHE_TTL = 300; // 5 minutes
const SEMAPHORE_ENTRY_TTL_MS = 10 * 60 * 1000; // 10 min — stale entry cleanup threshold

function configKey(scope: ProviderScope, provider: string) {
  return `prl:${scope}:${provider}:config`;
}

function semKey(scope: ProviderScope, provider: string) {
  return `prl:${scope}:${provider}:sem`;
}

function rpmKey(scope: ProviderScope, provider: string) {
  return `prl:${scope}:${provider}:rpm`;
}

function rpdKey(scope: ProviderScope, provider: string) {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `prl:${scope}:${provider}:rpd:${date}`;
}

/**
 * Load rateLimit config from the provider's config jsonb, cache in Redis for 5 min.
 */
export async function getProviderRateLimitConfig(
  db: DbInstance,
  redis: Redis,
  scope: ProviderScope,
  providerName: string,
): Promise<ProviderRateLimitConfig | null> {
  const cacheK = configKey(scope, providerName);

  // Try Redis cache
  const cached = await redis.get(cacheK);
  if (cached) return JSON.parse(cached);

  // Query appropriate table
  let row: { config: unknown } | undefined;
  if (scope === 'admin') {
    row = await db.query.adminProviders.findFirst({
      where: eq(adminProviders.name, providerName),
      columns: { config: true },
    });
  } else {
    row = await db.query.providers.findFirst({
      where: eq(providers.name, providerName),
      columns: { config: true },
    });
  }

  const config = (row?.config as ProviderConfig | null)?.rateLimit ?? null;
  if (config) {
    await redis.set(cacheK, JSON.stringify(config), 'EX', CONFIG_CACHE_TTL);
  }
  return config;
}

/**
 * Lua script for atomic concurrency semaphore.
 * KEYS[1] = sorted set key
 * ARGV[1] = maxConcurrency
 * ARGV[2] = jobId (member)
 * ARGV[3] = current timestamp ms (score)
 * ARGV[4] = stale threshold ms
 *
 * Returns 1 if acquired, 0 if denied.
 */
const ACQUIRE_LUA = `
-- Clean up stale entries (crashed workers)
local staleThreshold = tonumber(ARGV[3]) - tonumber(ARGV[4])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', staleThreshold)

local current = redis.call('ZCARD', KEYS[1])
if current < tonumber(ARGV[1]) then
  redis.call('ZADD', KEYS[1], ARGV[3], ARGV[2])
  return 1
end
return 0
`;

/**
 * Try to acquire a rate limit slot. Returns immediately.
 */
export async function tryAcquire(
  redis: Redis,
  scope: ProviderScope,
  providerName: string,
  jobId: string,
  config: ProviderRateLimitConfig,
): Promise<AcquireResult> {
  const now = Date.now();

  // Check concurrency
  if (config.maxConcurrency != null) {
    const result = await redis.eval(
      ACQUIRE_LUA,
      1,
      semKey(scope, providerName),
      config.maxConcurrency,
      jobId,
      now,
      SEMAPHORE_ENTRY_TTL_MS,
    ) as number;

    if (result === 0) {
      return { allowed: false, reason: 'concurrency', retryAfterMs: 2000 };
    }
  }

  // Check RPM
  if (config.maxPerMinute != null) {
    const key = rpmKey(scope, providerName);
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 60);
    }
    if (current > config.maxPerMinute) {
      // Undo the increment
      await redis.decr(key);
      // Release concurrency slot if we acquired one
      if (config.maxConcurrency != null) {
        await redis.zrem(semKey(scope, providerName), jobId);
      }
      const ttl = await redis.ttl(key);
      return { allowed: false, reason: 'rpm', retryAfterMs: Math.max(ttl, 1) * 1000 };
    }
  }

  // Check RPD
  if (config.maxPerDay != null) {
    const key = rpdKey(scope, providerName);
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 86400);
    }
    if (current > config.maxPerDay) {
      // Undo the increment
      await redis.decr(key);
      // Undo RPM increment
      if (config.maxPerMinute != null) {
        await redis.decr(rpmKey(scope, providerName));
      }
      // Release concurrency slot
      if (config.maxConcurrency != null) {
        await redis.zrem(semKey(scope, providerName), jobId);
      }
      return { allowed: false, reason: 'rpd', retryAfterMs: 60_000 };
    }
  }

  return { allowed: true };
}

/**
 * After a provider 429, refresh the RPM counter TTL so Gate 1 knows
 * the provider is busy for another full window.
 */
export async function markProviderBusy(
  redis: Redis,
  scope: ProviderScope,
  providerName: string,
): Promise<void> {
  const key = rpmKey(scope, providerName);
  const exists = await redis.exists(key);
  if (exists) {
    // Extend the existing RPM window by 60s from NOW
    await redis.expire(key, 60);
  } else {
    // No RPM counter exists — create one at the limit to block further calls
    // (This handles the case where maxPerMinute is not configured but we still got 429)
    await redis.set(key, '1', 'EX', 60);
  }
}

/**
 * Release the concurrency slot (call in finally block).
 */
export async function releaseSlot(
  redis: Redis,
  scope: ProviderScope,
  providerName: string,
  jobId: string,
): Promise<void> {
  await redis.zrem(semKey(scope, providerName), jobId);
}
