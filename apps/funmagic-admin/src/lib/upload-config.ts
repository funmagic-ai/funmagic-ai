/**
 * Shared upload configuration for client-side components.
 * These values should match the server-side env vars:
 * - ALLOWED_IMAGE_TYPES
 * - MAX_IMAGE_UPLOAD_SIZE
 */

// Allowed image MIME types (must match ALLOWED_IMAGE_TYPES env var)
export const ALLOWED_IMAGE_MIME_TYPES = 'image/jpeg,image/png,image/webp';

// Human-readable file type labels
export const ALLOWED_IMAGE_TYPES_LABEL = 'JPEG, PNG, WebP';

// Max file size in bytes (must match MAX_IMAGE_UPLOAD_SIZE env var)
export const MAX_IMAGE_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB

// Human-readable max file size
export const MAX_IMAGE_UPLOAD_SIZE_LABEL = '20MB';

// Default upload description for image dropzones
export const IMAGE_UPLOAD_DESCRIPTION = {
  fileTypes: ALLOWED_IMAGE_TYPES_LABEL,
  maxFileSize: MAX_IMAGE_UPLOAD_SIZE_LABEL,
  maxFiles: 1,
} as const;
