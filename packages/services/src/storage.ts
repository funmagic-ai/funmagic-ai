import { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSignedUrl as getCloudFrontSignedUrlFn } from '@aws-sdk/cloudfront-signer';

// Environment variables for URL expirations
const PRESIGNED_URL_EXPIRATION_PRIVATE = parseInt(process.env.PRESIGNED_URL_EXPIRATION_PRIVATE!, 10);
const PRESIGNED_URL_EXPIRATION_UPLOAD = parseInt(process.env.PRESIGNED_URL_EXPIRATION_UPLOAD!, 10);

// Types
export type Visibility = 'public' | 'private' | 'admin-private';

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  buckets: {
    public: string;
    private: string;
    admin: string;
  };
  cdnBaseUrl?: string;
  privateCdnBaseUrl?: string;
  cloudFrontKeyPairId?: string;
  cloudFrontPrivateKey?: string;
}

export interface PresignedUploadParams {
  bucket: string;
  storageKey: string;
  contentType: string;
  contentLength?: number;
  expiresIn?: number;
}

export interface PresignedDownloadParams {
  bucket: string;
  storageKey: string;
  expiresIn?: number;
}

// Default config from environment
function getDefaultConfig(): StorageConfig {
  return {
    endpoint: process.env.S3_ENDPOINT!,
    region: process.env.S3_REGION!,
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
    buckets: {
      public: process.env.S3_BUCKET_PUBLIC!,
      private: process.env.S3_BUCKET_PRIVATE!,
      admin: process.env.S3_BUCKET_ADMIN!,
    },
    cdnBaseUrl: process.env.CDN_BASE_URL,
    privateCdnBaseUrl: process.env.PRIVATE_CDN_BASE_URL,
    cloudFrontKeyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
    cloudFrontPrivateKey: process.env.CLOUDFRONT_PRIVATE_KEY,
  };
}

// Create S3 client
function createS3Client(config?: Partial<StorageConfig>): S3Client {
  const finalConfig = { ...getDefaultConfig(), ...config };
  return new S3Client({
    endpoint: finalConfig.endpoint,
    region: finalConfig.region,
    credentials: {
      accessKeyId: finalConfig.accessKeyId,
      secretAccessKey: finalConfig.secretAccessKey,
    },
    forcePathStyle: true, // Required for MinIO
  });
}

// Singleton client instance
let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = createS3Client();
  }
  return s3ClientInstance;
}

/**
 * Get the bucket name for a given visibility level
 */
export function getBucketForVisibility(visibility: Visibility, config?: StorageConfig): string {
  const buckets = config?.buckets || getDefaultConfig().buckets;
  switch (visibility) {
    case 'public':
      return buckets.public;
    case 'private':
      return buckets.private;
    case 'admin-private':
      return buckets.admin;
    default:
      return buckets.private;
  }
}

/**
 * Generate a storage key for a file
 */
export function generateStorageKey(userId: string, module: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${module}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Generate a presigned URL for uploading a file to S3
 */
export async function getPresignedUploadUrl(params: PresignedUploadParams): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.storageKey,
    ContentType: params.contentType,
    ...(params.contentLength && { ContentLength: params.contentLength }),
  });

  return getSignedUrl(client, command, { expiresIn: params.expiresIn || PRESIGNED_URL_EXPIRATION_UPLOAD });
}

/**
 * Generate a presigned URL for downloading a file from S3
 */
export async function getPresignedDownloadUrl(params: PresignedDownloadParams): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: params.bucket,
    Key: params.storageKey,
  });

  return getSignedUrl(client, command, { expiresIn: params.expiresIn || PRESIGNED_URL_EXPIRATION_PRIVATE });
}

/**
 * Get a CloudFront signed URL for private CDN access
 */
export function getCloudFrontSignedUrl(
  storageKey: string,
  expiresIn: number = 900,
  config?: StorageConfig
): string {
  const finalConfig = config || getDefaultConfig();

  if (!finalConfig.privateCdnBaseUrl || !finalConfig.cloudFrontKeyPairId || !finalConfig.cloudFrontPrivateKey) {
    throw new Error('CloudFront configuration not set. Required: PRIVATE_CDN_BASE_URL, CLOUDFRONT_KEY_PAIR_ID, CLOUDFRONT_PRIVATE_KEY');
  }

  const url = `${finalConfig.privateCdnBaseUrl}/${storageKey}`;
  const dateLessThan = new Date(Date.now() + expiresIn * 1000).toISOString();

  return getCloudFrontSignedUrlFn({
    url,
    keyPairId: finalConfig.cloudFrontKeyPairId,
    privateKey: finalConfig.cloudFrontPrivateKey,
    dateLessThan,
  });
}

/**
 * Get a public CDN URL for public assets
 */
export function getPublicCdnUrl(storageKey: string, config?: StorageConfig): string {
  const finalConfig = config || getDefaultConfig();

  if (!finalConfig.cdnBaseUrl) {
    // Fallback to S3 direct URL
    return `${finalConfig.endpoint}/${finalConfig.buckets.public}/${storageKey}`;
  }

  return `${finalConfig.cdnBaseUrl}/${storageKey}`;
}

/**
 * Resolve the appropriate URL for an asset based on visibility
 */
export async function resolveAssetUrl(
  asset: { visibility: Visibility; bucket: string; storageKey: string; userId: string },
  requestingUserId: string,
  config?: StorageConfig
): Promise<{ url: string; expiresIn: number }> {
  const finalConfig = config || getDefaultConfig();

  switch (asset.visibility) {
    case 'public': {
      // For public bucket, use direct URL (CDN or MinIO public endpoint)
      // MinIO bucket has public download policy, no presigned URL needed
      const url = finalConfig.cdnBaseUrl
        ? `${finalConfig.cdnBaseUrl}/${asset.storageKey}`
        : `${finalConfig.endpoint}/${finalConfig.buckets.public}/${asset.storageKey}`;
      return { url, expiresIn: -1 }; // No expiration for public assets
    }
    case 'private': {
      // Verify ownership for private assets
      if (asset.userId !== requestingUserId) {
        throw new Error('Forbidden: You do not have access to this asset');
      }

      // Use CloudFront signed URL if available
      if (finalConfig.privateCdnBaseUrl && finalConfig.cloudFrontKeyPairId && finalConfig.cloudFrontPrivateKey) {
        const url = getCloudFrontSignedUrl(asset.storageKey, PRESIGNED_URL_EXPIRATION_PRIVATE, finalConfig);
        return { url, expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE };
      }

      // Fallback to S3 presigned URL
      const url = await getPresignedDownloadUrl({ bucket: asset.bucket, storageKey: asset.storageKey, expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE });
      return { url, expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE };
    }
    case 'admin-private': {
      // S3 direct presigned URL for admin assets (bypasses CDN)
      const url = await getPresignedDownloadUrl({ bucket: asset.bucket, storageKey: asset.storageKey, expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE });
      return { url, expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE };
    }
    default:
      throw new Error('Invalid visibility');
  }
}

/**
 * Upload a buffer directly to S3
 */
export async function putObject(params: {
  bucket: string;
  storageKey: string;
  body: Buffer | Uint8Array | ArrayBuffer;
  contentType: string;
}): Promise<void> {
  const client = getS3Client();
  const body = params.body instanceof ArrayBuffer
    ? new Uint8Array(params.body)
    : params.body;

  await client.send(new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.storageKey,
    Body: body,
    ContentType: params.contentType,
  }));
}

/**
 * Copy an object between buckets
 */
export async function copyObject(
  sourceBucket: string,
  sourceKey: string,
  destBucket: string,
  destKey: string
): Promise<void> {
  const client = getS3Client();
  await client.send(new CopyObjectCommand({
    Bucket: destBucket,
    Key: destKey,
    CopySource: `${sourceBucket}/${sourceKey}`,
  }));
}

/**
 * Delete an object from S3
 */
export async function deleteObject(bucket: string, storageKey: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: storageKey,
  }));
}

/**
 * Check if an object exists in S3
 */
export async function objectExists(bucket: string, storageKey: string): Promise<boolean> {
  const client = getS3Client();
  try {
    await client.send(new HeadObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    }));
    return true;
  } catch {
    return false;
  }
}
