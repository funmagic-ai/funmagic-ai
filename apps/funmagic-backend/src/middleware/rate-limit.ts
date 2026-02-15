import { createMiddleware } from 'hono/factory';
import { db } from '@funmagic/database';
import { getRedis, getRateLimitConfig, getUserTier } from '@funmagic/services';
import { AppError, ERROR_CODES } from '@funmagic/shared';

interface RateLimitOptions {
  /** Max requests allowed in the window — static number or async function */
  max: number | ((c: any) => number | Promise<number>);
  /** Window size in seconds */
  windowSeconds: number;
  /** Key prefix for Redis storage */
  prefix?: string;
  /** Custom key generator (default: IP-based) */
  keyGenerator?: (c: any) => string;
}

/**
 * Redis-backed fixed-window rate limiter middleware for Hono.
 * Supports both static and dynamic (async) max values.
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    max,
    windowSeconds,
    prefix = 'rl',
    keyGenerator,
  } = options;

  return createMiddleware(async (c, next) => {
    const redis = getRedis();

    // Resolve max — may be a static number or async function
    const resolvedMax = typeof max === 'function' ? await max(c) : max;

    // Generate rate limit key
    const identifier = keyGenerator
      ? keyGenerator(c)
      : c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        || c.req.header('x-real-ip')
        || 'unknown';

    const key = `${prefix}:${identifier}`;

    // Atomic increment + set TTL if new key
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Get remaining TTL for headers
    const ttl = await redis.ttl(key);

    // Set rate limit headers
    c.header('X-RateLimit-Limit', String(resolvedMax));
    c.header('X-RateLimit-Remaining', String(Math.max(0, resolvedMax - current)));
    c.header('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000) + Math.max(0, ttl)));

    if (current > resolvedMax) {
      c.header('Retry-After', String(Math.max(0, ttl)));
      throw new AppError({
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests',
        statusCode: 429,
      });
    }

    await next();
  });
}

// ─── Config-driven presets ───────────────────────────────────────────

/** Helper: resolve tiered max for a per-user limit category */
async function getTieredMax(c: any, category: keyof Awaited<ReturnType<typeof getRateLimitConfig>>['limits']): Promise<number> {
  const config = await getRateLimitConfig(db);
  const baseMax = config.limits[category].max;
  const userId = c.get('user')?.id;
  if (!userId) return baseMax;
  const tierName = await getUserTier(db, userId);
  const tierDef = config.tiers.find((t: { name: string }) => t.name === tierName);
  return baseMax * (tierDef?.multiplier ?? 1);
}

/** IP-based outer layer — high ceiling to catch bots/DDoS */
export const globalApiRateLimit = rateLimiter({
  max: async () => (await getRateLimitConfig(db)).limits.globalApi.max,
  windowSeconds: 60,
  prefix: 'rl:ip:api',
});

/** Per-user API limit — tiered by lifetimePurchased */
export const userApiRateLimit = rateLimiter({
  max: async (c) => getTieredMax(c, 'userApi'),
  windowSeconds: 60,
  prefix: 'rl:user:api',
  keyGenerator: (c) => c.get('user')?.id ?? 'anonymous',
});

/** Task creation — strict, per-user, tiered */
export const taskCreationRateLimit = rateLimiter({
  max: async (c) => getTieredMax(c, 'taskCreation'),
  windowSeconds: 60,
  prefix: 'rl:user:tasks',
  keyGenerator: (c) => c.get('user')?.id ?? 'anonymous',
});

/** Auth session checks (get-session) — IP-based, generous for multi-tab */
export const authSessionRateLimit = rateLimiter({
  max: async () => (await getRateLimitConfig(db)).limits.authSession.max,
  windowSeconds: 60,
  prefix: 'rl:auth:session',
});

/** Auth actions (sign-in, sign-up) — IP-based, strict for brute-force protection */
export const authActionRateLimit = rateLimiter({
  max: async () => (await getRateLimitConfig(db)).limits.authAction.max,
  windowSeconds: 60,
  prefix: 'rl:auth:action',
});

/** Upload endpoints — IP-based */
export const uploadRateLimit = rateLimiter({
  max: async () => (await getRateLimitConfig(db)).limits.upload.max,
  windowSeconds: 60,
  prefix: 'rl:upload',
});
