import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db, assets } from '@funmagic/database';

// Environment variable for URL expiration
const PRESIGNED_URL_EXPIRATION_PRIVATE = parseInt(process.env.PRESIGNED_URL_EXPIRATION_PRIVATE ?? '900', 10);

// S3 Configuration
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'funmagic',
    secretAccessKey: process.env.S3_SECRET_KEY || 'funmagic_dev',
  },
  forcePathStyle: true,
});

const BUCKET_PRIVATE = process.env.S3_BUCKET_PRIVATE || 'funmagic-private';

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

  // Fetch the file from the URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();

  // Generate storage key
  const timestamp = Date.now();
  const extension = getExtensionFromContentType(contentType);
  const finalFilename = filename || `result_${timestamp}${extension}`;
  const storageKey = `${userId}/${module}/${timestamp}_${finalFilename}`;

  // Upload to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_PRIVATE,
    Key: storageKey,
    Body: Buffer.from(buffer),
    ContentType: contentType,
  }));

  // Create asset record
  const [asset] = await db.insert(assets).values({
    userId,
    storageKey,
    bucket: BUCKET_PRIVATE,
    filename: finalFilename,
    mimeType: contentType,
    size: buffer.byteLength,
    visibility: 'private',
    module,
    taskId,
  }).returning();

  return {
    id: asset.id,
    storageKey,
    bucket: BUCKET_PRIVATE,
  };
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

  // Convert to Uint8Array for S3 upload
  const bodyBytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // Upload to S3
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_PRIVATE,
    Key: storageKey,
    Body: bodyBytes,
    ContentType: contentType,
  }));

  // Create asset record
  const [asset] = await db.insert(assets).values({
    userId,
    storageKey,
    bucket: BUCKET_PRIVATE,
    filename,
    mimeType: contentType,
    size: bodyBytes.byteLength,
    visibility: 'private',
    module,
    taskId,
  }).returning();

  return {
    id: asset.id,
    storageKey,
    bucket: BUCKET_PRIVATE,
  };
}

/**
 * Get a presigned download URL for an asset
 */
export async function getDownloadUrl(storageKey: string, expiresIn: number = PRESIGNED_URL_EXPIRATION_PRIVATE): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_PRIVATE,
    Key: storageKey,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
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
