/**
 * Registry for pending file uploads
 * Maps blob URLs to File objects so they can be uploaded on form submit
 */

const pendingFiles = new Map<string, File>();

export function registerPendingFile(blobUrl: string, file: File): void {
  pendingFiles.set(blobUrl, file);
}

export function getPendingFile(blobUrl: string): File | undefined {
  return pendingFiles.get(blobUrl);
}

export function removePendingFile(blobUrl: string): void {
  pendingFiles.delete(blobUrl);
}

export function getAllPendingFiles(): Map<string, File> {
  return new Map(pendingFiles);
}

export function clearPendingFiles(): void {
  pendingFiles.clear();
}

/**
 * Check if a URL is a pending blob URL
 */
export function isPendingUrl(url: string): boolean {
  return url.startsWith('blob:');
}
