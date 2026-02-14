import { db, assets } from '@funmagic/database';
import {
  getBucketForVisibility,
  getPresignedDownloadUrl,
  putObject,
} from '@funmagic/services';
import { ASSET_VISIBILITY } from '@funmagic/shared';

const BUCKET_PRIVATE = getBucketForVisibility(ASSET_VISIBILITY.PRIVATE);
const BUCKET_ADMIN = getBucketForVisibility(ASSET_VISIBILITY.ADMIN_PRIVATE);

interface UploadResult {
  id: string;
  storageKey: string;
  bucket: string;
}

/**
 * Download a file from a URL and upload it to S3
 * Used for saving AI-generated results
 */
export async function uploadFromUrl(params: {
  url: string;
  userId: string;
  module: string;
  taskId: string;
  filename?: string;
}): Promise<UploadResult> {
  const { url, userId, module, taskId, filename } = params;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();

  const timestamp = Date.now();
  const extension = getExtensionFromContentType(contentType);
  const finalFilename = filename || `result_${timestamp}${extension}`;
  const storageKey = `${userId}/${module}/${timestamp}_${finalFilename}`;

  await putObject({
    bucket: BUCKET_PRIVATE,
    storageKey,
    body: buffer,
    contentType,
  });

  const [asset] = await db.insert(assets).values({
    userId,
    storageKey,
    bucket: BUCKET_PRIVATE,
    filename: finalFilename,
    mimeType: contentType,
    size: buffer.byteLength,
    visibility: ASSET_VISIBILITY.PRIVATE,
    module,
    taskId,
  }).returning();

  return { id: asset.id, storageKey, bucket: BUCKET_PRIVATE };
}

/**
 * Upload a buffer directly to S3
 */
export async function uploadBuffer(params: {
  buffer: Buffer | ArrayBuffer;
  userId: string;
  module: string;
  taskId: string;
  filename: string;
  contentType: string;
}): Promise<UploadResult> {
  const { buffer, userId, module, taskId, filename, contentType } = params;

  const timestamp = Date.now();
  const storageKey = `${userId}/${module}/${timestamp}_${filename}`;

  const bodyBytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  await putObject({
    bucket: BUCKET_PRIVATE,
    storageKey,
    body: bodyBytes,
    contentType,
  });

  const [asset] = await db.insert(assets).values({
    userId,
    storageKey,
    bucket: BUCKET_PRIVATE,
    filename,
    mimeType: contentType,
    size: bodyBytes.byteLength,
    visibility: ASSET_VISIBILITY.PRIVATE,
    module,
    taskId,
  }).returning();

  return { id: asset.id, storageKey, bucket: BUCKET_PRIVATE };
}

/**
 * Upload a buffer directly to S3 admin bucket and create an asset record.
 * Used for admin AI Studio images.
 */
export async function uploadBufferAdmin(params: {
  buffer: Buffer | ArrayBuffer;
  userId: string;
  module: string;
  taskId: string;
  filename: string;
  contentType: string;
}): Promise<UploadResult> {
  const { buffer, userId, module, taskId, filename, contentType } = params;

  const timestamp = Date.now();
  const storageKey = `${userId}/${module}/${timestamp}_${filename}`;

  const bodyBytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  await putObject({
    bucket: BUCKET_ADMIN,
    storageKey,
    body: bodyBytes,
    contentType,
  });

  const [asset] = await db.insert(assets).values({
    userId,
    storageKey,
    bucket: BUCKET_ADMIN,
    filename,
    mimeType: contentType,
    size: bodyBytes.byteLength,
    visibility: ASSET_VISIBILITY.ADMIN_PRIVATE,
    module,
  }).returning();

  return { id: asset.id, storageKey, bucket: BUCKET_ADMIN };
}

/**
 * Download a file from a URL and upload it to S3 admin bucket with asset record.
 * Used for admin AI Studio images.
 * Returns a presigned URL for immediate display.
 */
export async function uploadFromUrlAdmin(params: {
  url: string;
  userId: string;
  module: string;
  taskId: string;
  filename?: string;
}): Promise<{ id: string; storageKey: string; bucket: string; presignedUrl: string }> {
  const { url, userId, module, taskId, filename } = params;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();

  const timestamp = Date.now();
  const extension = getExtensionFromContentType(contentType);
  const finalFilename = filename || `result_${timestamp}${extension}`;
  const storageKey = `${userId}/${module}/${timestamp}_${finalFilename}`;

  await putObject({
    bucket: BUCKET_ADMIN,
    storageKey,
    body: buffer,
    contentType,
  });

  const [asset] = await db.insert(assets).values({
    userId,
    storageKey,
    bucket: BUCKET_ADMIN,
    filename: finalFilename,
    mimeType: contentType,
    size: buffer.byteLength,
    visibility: ASSET_VISIBILITY.ADMIN_PRIVATE,
    module,
  }).returning();

  const presignedUrl = await getPresignedDownloadUrl({ bucket: BUCKET_ADMIN, storageKey });

  return { id: asset.id, storageKey, bucket: BUCKET_ADMIN, presignedUrl };
}

/**
 * Get a presigned download URL for a private asset
 */
export async function getDownloadUrl(storageKey: string, expiresIn?: number): Promise<string> {
  return getPresignedDownloadUrl({ bucket: BUCKET_PRIVATE, storageKey, expiresIn });
}

/**
 * Get a presigned download URL for an admin asset
 */
export async function getAdminDownloadUrl(storageKey: string, expiresIn?: number): Promise<string> {
  return getPresignedDownloadUrl({ bucket: BUCKET_ADMIN, storageKey, expiresIn });
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'application/pdf': '.pdf',
    'application/json': '.json',
    'text/plain': '.txt',
  };

  return map[contentType] || '';
}
