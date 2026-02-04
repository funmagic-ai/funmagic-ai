import { createCipheriv, scryptSync, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT = 'funmagic-salt';

/**
 * Encrypts a credential value using AES-256-GCM.
 * Compatible with the backend decryption in funmagic-backend.
 *
 * @param value - The plaintext credential to encrypt
 * @returns Encrypted string in format "iv:authTag:encrypted" or null if value is empty
 */
export function encryptCredential(value: string | undefined): string | null {
  if (!value) return null;

  const secretKey = process.env.SECRET_KEY;
  if (!secretKey || secretKey.length < 16) {
    console.warn('[Admin] SECRET_KEY not configured or too short, storing unencrypted');
    return value;
  }

  const key = scryptSync(secretKey, SALT, 32);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}
