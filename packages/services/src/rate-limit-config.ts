import { eq } from 'drizzle-orm';
import type { DbInstance } from '@funmagic/database';
import {
  rateLimitSettings,
  DEFAULT_RATE_LIMIT_CONFIG,
  type RateLimitConfig,
  type RateLimitTier,
  credits,
} from '@funmagic/database';
import { getRedis } from './redis';

const CONFIG_CACHE_KEY = 'rate-limit:config';
const CONFIG_CACHE_TTL = 300; // 5 minutes
const TIER_CACHE_PREFIX = 'user:tier:';
const TIER_CACHE_TTL = 300; // 5 minutes

/**
 * Get rate limit configuration.
 * Reads from Redis cache first, falls back to DB, then to hardcoded defaults.
 */
export async function getRateLimitConfig(db: DbInstance): Promise<RateLimitConfig> {
  const redis = getRedis();

  // Try Redis cache
  const cached = await redis.get(CONFIG_CACHE_KEY);
  if (cached) {
    return JSON.parse(cached) as RateLimitConfig;
  }

  // Try DB
  const row = await db.query.rateLimitSettings.findFirst();
  if (row) {
    const config: RateLimitConfig = {
      tiers: row.tiers,
      limits: row.limits,
    };
    await redis.set(CONFIG_CACHE_KEY, JSON.stringify(config), 'EX', CONFIG_CACHE_TTL);
    return config;
  }

  // Fallback to defaults (and cache them)
  await redis.set(CONFIG_CACHE_KEY, JSON.stringify(DEFAULT_RATE_LIMIT_CONFIG), 'EX', CONFIG_CACHE_TTL);
  return DEFAULT_RATE_LIMIT_CONFIG;
}

/**
 * Update rate limit configuration in DB and invalidate Redis cache.
 */
export async function updateRateLimitConfig(
  db: DbInstance,
  config: RateLimitConfig
): Promise<RateLimitConfig> {
  const redis = getRedis();

  // Upsert: check if a row exists
  const existing = await db.query.rateLimitSettings.findFirst();

  if (existing) {
    await db.update(rateLimitSettings)
      .set({
        tiers: config.tiers,
        limits: config.limits,
        updatedAt: new Date(),
      })
      .where(eq(rateLimitSettings.id, existing.id));
  } else {
    await db.insert(rateLimitSettings).values({
      tiers: config.tiers,
      limits: config.limits,
    });
  }

  // Invalidate cache so new config takes effect
  await redis.del(CONFIG_CACHE_KEY);

  return config;
}

/**
 * Determine a user's tier based on lifetimePurchased.
 * Cached in Redis for 5 minutes. Returns tier name (e.g. 'free', 'basic', 'premium').
 */
export async function getUserTier(db: DbInstance, userId: string): Promise<string> {
  const redis = getRedis();
  const cacheKey = `${TIER_CACHE_PREFIX}${userId}`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  // Query user's lifetimePurchased
  const creditRecord = await db.query.credits.findFirst({
    where: eq(credits.userId, userId),
  });

  const lifetimePurchased = creditRecord?.lifetimePurchased ?? 0;

  // Get config to resolve tiers
  const config = await getRateLimitConfig(db);

  // Sort tiers descending by minPurchased, pick the first one the user qualifies for
  const sortedTiers = [...config.tiers].sort((a, b) => b.minPurchased - a.minPurchased);
  const tier = sortedTiers.find(t => lifetimePurchased >= t.minPurchased);
  const tierName = tier?.name ?? 'free';

  await redis.set(cacheKey, tierName, 'EX', TIER_CACHE_TTL);
  return tierName;
}

/**
 * Invalidate a user's tier cache (e.g. after a credit purchase).
 */
export async function invalidateUserTierCache(userId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${TIER_CACHE_PREFIX}${userId}`);
}
