import type { ProviderCredentials } from '../types';

// Provider limits structure (stored in providers.config.limits)
// Keep for future rate limiting implementation
export interface ProviderLimits {
  rpm?: number;           // requests per minute
  rpd?: number;           // requests per day
  concurrency?: number;   // max concurrent requests
  costPerRequest?: number;
  costPerToken?: number;
  costPerSecond?: number;
}

// Provider type with config field
interface ProviderWithConfig {
  type: string;
  baseUrl: string | null;
  config: unknown;
}

// Get provider limits for future rate limiting
export function getProviderLimits(provider: ProviderWithConfig): ProviderLimits {
  const config = provider.config as Record<string, unknown> | null;
  return (config?.limits as ProviderLimits) ?? {};
}

// Simple credential decryption
// In production, use proper encryption with SECRET_KEY
export function decryptCredentials(provider: {
  apiKey: string | null;
  apiSecret: string | null;
  baseUrl: string | null;
  config: unknown;
}): ProviderCredentials {
  // TODO: Implement proper decryption with crypto
  // For now, return as-is (credentials stored unencrypted in dev)
  return {
    apiKey: provider.apiKey || undefined,
    apiSecret: provider.apiSecret || undefined,
    baseUrl: provider.baseUrl || undefined,
    config: provider.config as Record<string, unknown> | undefined,
  };
}

// Mask credentials for logging
export function maskCredential(value: string | undefined): string {
  if (!value) return '[not set]';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
