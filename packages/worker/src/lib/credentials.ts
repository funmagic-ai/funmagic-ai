import { createDecipheriv, scryptSync } from 'crypto';
import { createLogger } from '@funmagic/services';
import type { ProviderCredentials } from '../types';

const log = createLogger('Worker');

// Encryption constants (must match admin backend)
const ALGORITHM = 'aes-256-gcm';


/**
 * Decrypt a single credential encrypted with the admin's encryptCredential.
 * Supports new format (4 parts: salt:iv:authTag:encrypted) and legacy format (3 parts: iv:authTag:encrypted).
 */
function decryptCredential(encrypted: string | null): string | null {
  if (!encrypted) return null;

  if (!encrypted.includes(':')) {
    return encrypted;
  }

  const secretKey = process.env.SECRET_KEY;
  if (!secretKey) {
    throw new Error('[Worker] SECRET_KEY not configured - cannot decrypt credentials');
  }

  const parts = encrypted.split(':');

  let salt: Buffer;
  let ivBase64: string;
  let authTagBase64: string;
  let encryptedData: string;

  if (parts.length === 4) {
    [, ivBase64, authTagBase64, encryptedData] = parts;
    salt = Buffer.from(parts[0], 'base64');
  } else if (parts.length === 3) {
    [ivBase64, authTagBase64, encryptedData] = parts;
    salt = Buffer.from('funmagic-salt');
  } else {
    return encrypted;
  }

  if (!ivBase64 || !authTagBase64 || !encryptedData) {
    return encrypted;
  }

  try {
    const key = scryptSync(secretKey, salt, 32);
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    log.error({ err: error }, 'Failed to decrypt credential');
    return null;
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
