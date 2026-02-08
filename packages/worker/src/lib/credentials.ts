import { createDecipheriv, scryptSync } from 'crypto';
import type { ProviderCredentials } from '../types';

// Encryption constants (must match admin backend)
const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;
const SALT = 'funmagic-salt';

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

/**
 * Decrypt a single credential encrypted with the admin's encryptCredential
 * Format: iv:authTag:encryptedData (all base64)
 */
function decryptCredential(encrypted: string | null): string | null {
  if (!encrypted) return null;

  // Check if it's in encrypted format (contains colons)
  if (!encrypted.includes(':')) {
    // Not encrypted, return as-is (legacy/unencrypted data)
    return encrypted;
  }

  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    console.warn('[Worker] SECRET_KEY not configured, cannot decrypt');
    return encrypted;
  }

  try {
    const [ivBase64, authTagBase64, encryptedData] = encrypted.split(':');

    if (!ivBase64 || !authTagBase64 || !encryptedData) {
      return encrypted; // Invalid format, return as-is
    }

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    const key = scryptSync(secretKey, SALT, 32);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Worker] Failed to decrypt credential:', error);
    return encrypted; // Return as-is on error
  }
}

/**
 * Decrypt all provider credentials
 */
export function decryptCredentials(provider: {
  apiKey: string | null;
  apiSecret: string | null;
  baseUrl: string | null;
  config: unknown;
}): ProviderCredentials {
  return {
    apiKey: decryptCredential(provider.apiKey) || undefined,
    apiSecret: decryptCredential(provider.apiSecret) || undefined,
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
