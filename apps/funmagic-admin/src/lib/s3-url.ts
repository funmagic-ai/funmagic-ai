const S3_PUBLIC_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';

export function getS3PublicUrl(path: string): string {
  if (!path) return '';
  // Already a full URL or blob URL
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  // Relative path - prepend S3 base URL
  if (S3_PUBLIC_URL) {
    return `${S3_PUBLIC_URL}/${path}`;
  }
  return path;
}
