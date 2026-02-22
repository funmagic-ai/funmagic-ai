import { db, assets } from '@funmagic/database';
import { eq } from 'drizzle-orm';
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

// ─── Storage target config ──────────────────────────────────────────

type StorageTarget = 'private' | 'admin';

const TARGET_CONFIG = {
  private: { bucket: BUCKET_PRIVATE, visibility: ASSET_VISIBILITY.PRIVATE },
  admin: { bucket: BUCKET_ADMIN, visibility: ASSET_VISIBILITY.ADMIN_PRIVATE },
} as const;

// ─── Internal helpers ───────────────────────────────────────────────

function toUint8Array(buffer: Buffer | ArrayBuffer): Uint8Array {
  return buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

async function insertAsset(params: {
  userId: string;
  storageKey: string;
  bucket: string;
  filename: string;
  mimeType: string;
  size: number;
  visibility: string;
  module: string;
  taskId?: string;
}) {
  const [asset] = await db.insert(assets).values(params).returning();
  return asset;
}

// ─── Upload from URL ────────────────────────────────────────────────

interface UploadFromUrlParams {
  url: string;
  userId: string;
  module: string;
  taskId: string;
  filename?: string;
}

async function uploadFromUrlInternal(
  params: UploadFromUrlParams,
  target: StorageTarget,
) {
  const { url, userId, module, taskId, filename } = params;
  const { bucket, visibility } = TARGET_CONFIG[target];

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.status}`);
  }

  const rawContentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();

  const timestamp = Date.now();
  const extension = getExtensionFromContentType(rawContentType);
  const finalFilename = filename || `result_${timestamp}${extension}`;

  // If the server returned a generic type, try to infer from filename extension
  const contentType = rawContentType === 'application/octet-stream'
    ? getContentTypeFromFilename(finalFilename) || rawContentType
    : rawContentType;

  const storageKey = `${userId}/${module}/${timestamp}_${finalFilename}`;

  await putObject({ bucket, storageKey, body: buffer, contentType });

  const asset = await insertAsset({
    userId,
    storageKey,
    bucket,
    filename: finalFilename,
    mimeType: contentType,
    size: buffer.byteLength,
    visibility,
    module,
    ...(target === 'private' ? { taskId } : {}),
  });

  return { id: asset.id, storageKey, bucket };
}

/**
 * Download a file from a URL and upload it to S3
 * Used for saving AI-generated results
 */
export async function uploadFromUrl(params: UploadFromUrlParams): Promise<UploadResult> {
  return uploadFromUrlInternal(params, 'private');
}

/**
 * Download a file from a URL and upload it to S3 admin bucket with asset record.
 * Returns a presigned URL for immediate display.
 */
export async function uploadFromUrlAdmin(
  params: UploadFromUrlParams,
): Promise<UploadResult & { presignedUrl: string }> {
  const result = await uploadFromUrlInternal(params, 'admin');
  const presignedUrl = await getPresignedDownloadUrl({
    bucket: result.bucket,
    storageKey: result.storageKey,
  });
  return { ...result, presignedUrl };
}

// ─── Upload buffer ──────────────────────────────────────────────────

interface UploadBufferParams {
  buffer: Buffer | ArrayBuffer;
  userId: string;
  module: string;
  taskId: string;
  filename: string;
  contentType: string;
}

async function uploadBufferInternal(
  params: UploadBufferParams,
  target: StorageTarget,
): Promise<UploadResult> {
  const { buffer, userId, module, taskId, filename, contentType } = params;
  const { bucket, visibility } = TARGET_CONFIG[target];

  const timestamp = Date.now();
  const storageKey = `${userId}/${module}/${timestamp}_${filename}`;
  const bodyBytes = toUint8Array(buffer);

  await putObject({ bucket, storageKey, body: bodyBytes, contentType });

  const asset = await insertAsset({
    userId,
    storageKey,
    bucket,
    filename,
    mimeType: contentType,
    size: bodyBytes.byteLength,
    visibility,
    module,
    ...(target === 'private' ? { taskId } : {}),
  });

  return { id: asset.id, storageKey, bucket };
}

/**
 * Upload a buffer directly to S3
 */
export async function uploadBuffer(params: UploadBufferParams): Promise<UploadResult> {
  return uploadBufferInternal(params, 'private');
}

/**
 * Upload a buffer directly to S3 admin bucket and create an asset record.
 * Used for admin AI Studio images.
 */
export async function uploadBufferAdmin(params: UploadBufferParams): Promise<UploadResult> {
  return uploadBufferInternal(params, 'admin');
}

// ─── Download URLs ──────────────────────────────────────────────────

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
 * Look up an asset by ID and return a presigned download URL.
 * Useful for multi-step workers where step 2 needs to fetch step 1's output.
 */
export async function getAssetDownloadUrl(assetId: string): Promise<string> {
  const asset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });
  if (!asset) throw new Error(`Asset ${assetId} not found`);
  return getDownloadUrl(asset.storageKey);
}

// ─── Content type utilities ─────────────────────────────────────────

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
    'model/gltf-binary': '.glb',
  };
  return map[contentType] || '';
}

function getContentTypeFromFilename(filename: string): string | null {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const map: Record<string, string> = {
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.obj': 'model/obj',
    '.fbx': 'application/octet-stream',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.json': 'application/json',
    '.txt': 'text/plain',
  };
  return map[ext] || null;
}
