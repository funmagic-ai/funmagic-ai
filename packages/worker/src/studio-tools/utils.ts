import type { QuotedImage, GeneratedImage, StudioWorkerContext } from './types';
import { createStudioProgressTracker } from './progress';
import { uploadBufferAdmin, getAdminDownloadUrl } from '../lib/storage';
import { ASSET_MODULE } from '@funmagic/shared';

/**
 * Get presigned URL for a storage key or return the URL as-is if it's already a full URL
 */
export async function getPresignedUrl(imageRef: QuotedImage): Promise<string> {
  // If it's already a full URL, return as-is
  if (imageRef.url.startsWith('http')) {
    return imageRef.url;
  }

  // If it has a storage key, get presigned URL from admin bucket
  if (imageRef.storageKey) {
    return getAdminDownloadUrl(imageRef.storageKey);
  }

  // Treat the url as a storage key
  return getAdminDownloadUrl(imageRef.url);
}

/**
 * Fetch image as base64 from URL or storage key
 */
export async function fetchImageAsBase64(imageRef: QuotedImage): Promise<string> {
  const imageUrl = await getPresignedUrl(imageRef);

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Fetch image and return as a base64 data URI (data:image/png;base64,...)
 * Suitable for APIs that accept data URIs (e.g. OpenAI input_image)
 */
export async function fetchImageAsDataUri(imageRef: QuotedImage): Promise<string> {
  const imageUrl = await getPresignedUrl(imageRef);

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
}

/**
 * Upload base64 image data to S3 admin bucket with asset record.
 * Returns only storageKey - URL is generated on-demand via presigned URL endpoint.
 */
export async function uploadBase64Image(
  base64Data: string,
  context: StudioWorkerContext,
  index: number,
  prefix: string = 'generated'
): Promise<GeneratedImage> {
  const buffer = Buffer.from(base64Data, 'base64');

  const result = await uploadBufferAdmin({
    buffer,
    userId: context.adminId,
    module: ASSET_MODULE.STUDIO,
    taskId: context.messageId,
    filename: `${prefix}_${Date.now()}_${index}.png`,
    contentType: 'image/png',
  });

  return {
    storageKey: result.storageKey,
    type: 'generated',
  };
}

/**
 * Create a progress tracker for a context
 */
export function createProgressTracker(context: StudioWorkerContext) {
  return createStudioProgressTracker(context.redis, context.messageId, context.adminId);
}

// Re-export storage functions for convenience
export { uploadBuffer, uploadBufferAdmin, uploadFromUrl, uploadFromUrlAdmin, getDownloadUrl, getAdminDownloadUrl } from '../lib/storage';
