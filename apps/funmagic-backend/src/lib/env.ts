/**
 * Validate required environment variables at startup.
 * Fails fast with a clear error message listing all missing variables.
 */
export function validateEnv(requiredVars: string[]): void {
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error(`[Env] Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}`);
    process.exit(1);
  }
}

/** Required env vars for the backend server */
export const BACKEND_REQUIRED_ENV = [
  'DATABASE_URL',
  'REDIS_URL',
  'CORS_ORIGINS',
  'SECRET_KEY',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'S3_BUCKET_PUBLIC',
  'S3_BUCKET_PRIVATE',
  'S3_BUCKET_ADMIN',
  'ALLOWED_UPLOAD_TYPES',
  'MAX_IMAGE_UPLOAD_SIZE',
  'MAX_FILE_UPLOAD_SIZE',
  'JOB_BACKOFF_DELAY_MS',
  'SSE_MAX_DURATION_MS',
  'HEALTH_CHECK_TIMEOUT_MS',
  'PORT',
  'PRESIGNED_URL_EXPIRATION_PRIVATE',
  'PRESIGNED_URL_EXPIRATION_UPLOAD',
  'LOG_LEVEL',
] as const;

