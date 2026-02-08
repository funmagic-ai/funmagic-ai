import type { QuotedImage, GeneratedImage, AdminWorkerContext } from './types';
import { createAdminProgressTracker } from './progress';
import { uploadBufferWithoutRecord, getAdminDownloadUrl } from '../lib/storage';

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
 * Upload base64 image data to S3 without creating a database record.
 * Admin AI Studio images don't need asset tracking and using uploadBuffer
 * would cause foreign key violations since adminId may not exist in users table.
 * Returns only storageKey - URL is generated on-demand via presigned URL endpoint.
 */
export async function uploadBase64Image(
  base64Data: string,
  context: AdminWorkerContext,
  index: number,
  prefix: string = 'generated'
): Promise<GeneratedImage> {
  const buffer = Buffer.from(base64Data, 'base64');

  const result = await uploadBufferWithoutRecord({
    buffer,
    userId: context.adminId,
    module: 'ai-studio',
    taskId: context.messageId, // Use messageId as the task reference
    filename: `${prefix}_${Date.now()}_${index}.png`,
    contentType: 'image/png',
  });

  // Return only storageKey - URL is generated on-demand via presigned URL endpoint
  return {
    storageKey: result.storageKey,
    type: 'generated',
  };
}

/**
 * Create a progress tracker for a context
 */
export function createProgressTracker(context: AdminWorkerContext) {
  return createAdminProgressTracker(context.redis, context.messageId);
}

// Re-export storage functions for convenience
export { uploadBuffer, uploadBufferWithoutRecord, uploadFromUrl, uploadFromUrlWithoutRecord, getDownloadUrl, getAdminDownloadUrl } from '../lib/storage';
