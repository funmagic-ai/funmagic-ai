export interface ProviderRateLimitConfig {
  /** Max simultaneous in-flight requests (default: unlimited) */
  maxConcurrency?: number;
  /** RPM limit (default: unlimited) */
  maxPerMinute?: number;
  /** RPD limit (default: unlimited) */
  maxPerDay?: number;
  /** Auto-retry on provider 429 (default: true) */
  retryOn429?: boolean;
  /** Max 429 retries before failing (default: 3) */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff (default: 1000) */
  baseBackoffMs?: number;
}

export interface ProviderConfig {
  rateLimit?: ProviderRateLimitConfig;
  [key: string]: unknown;
}
