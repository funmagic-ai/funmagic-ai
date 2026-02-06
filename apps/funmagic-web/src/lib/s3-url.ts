export function getS3PublicUrl(path: string): string {
  if (!path) return '';
  // Already a full URL or blob URL
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:')) {
    return path;
  }
  // Relative path - prepend S3 base URL
  const s3PublicUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
  if (s3PublicUrl) {
    return `${s3PublicUrl}/${path}`;
  }
  return path;
}
