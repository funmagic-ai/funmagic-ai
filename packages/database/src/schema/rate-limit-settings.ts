import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';

// Types for rate limit configuration

export interface RateLimitTier {
  name: string;           // e.g. 'free', 'basic', 'premium'
  minPurchased: number;   // minimum lifetimePurchased to qualify
  multiplier: number;     // applied to base max
}

export interface RateLimitLimitEntry {
  max: number;
  windowSeconds: number;
}

export interface RateLimitLimits {
  userApi: RateLimitLimitEntry;
  taskCreation: RateLimitLimitEntry;
  upload: RateLimitLimitEntry;
  authSession: RateLimitLimitEntry;
  authAction: RateLimitLimitEntry;
  globalApi: RateLimitLimitEntry;
}

export interface RateLimitConfig {
  tiers: RateLimitTier[];
  limits: RateLimitLimits;
}

// Default configuration
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  tiers: [
    { name: 'free', minPurchased: 0, multiplier: 1 },
    { name: 'basic', minPurchased: 1, multiplier: 2 },
    { name: 'premium', minPurchased: 1000, multiplier: 3 },
  ],
  limits: {
    globalApi: { max: 500, windowSeconds: 60 },
    userApi: { max: 200, windowSeconds: 60 },
    taskCreation: { max: 10, windowSeconds: 60 },
    upload: { max: 20, windowSeconds: 60 },
    authSession: { max: 60, windowSeconds: 60 },
    authAction: { max: 10, windowSeconds: 60 },
  },
};

// Database table — single-row config
export const rateLimitSettings = pgTable('rate_limit_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  tiers: jsonb('tiers').notNull().$type<RateLimitTier[]>(),
  limits: jsonb('limits').notNull().$type<RateLimitLimits>(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
