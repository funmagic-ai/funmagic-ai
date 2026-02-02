import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, assets } from '@funmagic/database';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment variables for URL expirations
const PRESIGNED_URL_EXPIRATION_PRIVATE = parseInt(process.env.PRESIGNED_URL_EXPIRATION_PRIVATE ?? '900', 10);
const PRESIGNED_URL_EXPIRATION_UPLOAD = parseInt(process.env.PRESIGNED_URL_EXPIRATION_UPLOAD ?? '3600', 10);

// S3 Configuration
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
});

// Bucket configuration
const BUCKETS = {
  public: process.env.S3_BUCKET_PUBLIC!,
  private: process.env.S3_BUCKET_PRIVATE!,
  admin: process.env.S3_BUCKET_ADMIN!,
} as const;

// CDN configuration
const CDN_BASE_URL = process.env.CDN_BASE_URL || '';
const PRIVATE_CDN_BASE_URL = process.env.PRIVATE_CDN_BASE_URL || '';

// Helper to generate storage keys
function generateStorageKey(userId: string, module: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${module}/${timestamp}_${sanitizedFilename}`;
}

// Helper to get bucket for visibility
function getBucketForVisibility(visibility: 'public' | 'private' | 'admin-private'): string {
  switch (visibility) {
    case 'public':
      return BUCKETS.public;
    case 'private':
      return BUCKETS.private;
    case 'admin-private':
      return BUCKETS.admin;
    default:
      return BUCKETS.private;
  }
}

// Schemas
const AssetSchema = z.object({
  id: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  visibility: z.enum(['private', 'public', 'admin-private']),
  module: z.string(),
  createdAt: z.string(),
}).openapi('Asset');

const AssetsListSchema = z.object({
  assets: z.array(AssetSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  }),
}).openapi('AssetsList');

const UploadRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  size: z.number().positive('Size must be positive'),
  module: z.string().min(1, 'Module is required'),
}).openapi('UploadRequest');

const UploadResponseSchema = z.object({
  presignedUrl: z.string(),
  assetId: z.string().uuid(),
  storageKey: z.string(),
  bucket: z.string(),
}).openapi('UploadResponse');

const DownloadResponseSchema = z.object({
  url: z.string(),
  expiresIn: z.number(),
}).openapi('DownloadResponse');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('AssetError');

// Routes
const uploadRoute = createRoute({
  method: 'post',
  path: '/upload',
  tags: ['Assets'],
  request: {
    body: {
      content: { 'application/json': { schema: UploadRequestSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: UploadResponseSchema } },
      description: 'Presigned upload URL generated',
    },
  },
});

const getUrlRoute = createRoute({
  method: 'get',
  path: '/{id}/url',
  tags: ['Assets'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: DownloadResponseSchema } },
      description: 'Download URL',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Asset not found',
    },
  },
});

const listAssetsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Assets'],
  request: {
    query: z.object({
      module: z.string().optional(),
      limit: z.coerce.number().default(20),
      offset: z.coerce.number().default(0),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: AssetsListSchema } },
      description: 'List of user assets',
    },
  },
});

const publishAssetRoute = createRoute({
  method: 'post',
  path: '/{id}/publish',
  tags: ['Assets'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ url: z.string() }).openapi('PublishResponse') } },
      description: 'Asset published',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Asset not found',
    },
  },
});

const deleteAssetRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Assets'],
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ success: z.boolean() }).openapi('DeleteAssetSuccess') } },
      description: 'Asset deleted',
    },
    403: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Forbidden',
    },
    404: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Asset not found',
    },
  },
});

// Asset routes (protected - requires auth middleware)
export const assetsRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .openapi(uploadRoute, async (c) => {
    const user = c.get('user');
    const { filename, contentType, size, module } = c.req.valid('json');

    const bucket = BUCKETS.private; // Default to private bucket
    const storageKey = generateStorageKey(user.id, module, filename);

    // Create asset record first
    const [asset] = await db.insert(assets).values({
      userId: user.id,
      storageKey,
      bucket,
      filename,
      mimeType: contentType,
      size,
      visibility: 'private',
      module,
    }).returning();

    // Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_EXPIRATION_UPLOAD });

    return c.json({
      presignedUrl,
      assetId: asset.id,
      storageKey,
      bucket,
    }, 200);
  })
  .openapi(getUrlRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), isNull(assets.deletedAt)),
    });

    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    // Handle visibility-based URL resolution
    switch (asset.visibility) {
      case 'public': {
        // For public bucket, use direct URL (CDN or MinIO public endpoint)
        // MinIO bucket has public download policy, no presigned URL needed
        const url = CDN_BASE_URL
          ? `${CDN_BASE_URL}/${asset.storageKey}`
          : `${process.env.S3_ENDPOINT}/${BUCKETS.public}/${asset.storageKey}`;
        return c.json({ url, expiresIn: -1 }, 200);
      }
      case 'private': {
        // Verify ownership for private assets
        if (asset.userId !== user.id) {
          return c.json({ error: 'Forbidden' }, 403);
        }
        // Generate presigned download URL
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
          Bucket: asset.bucket,
          Key: asset.storageKey,
        }), { expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE });
        return c.json({ url, expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE }, 200);
      }
      case 'admin-private': {
        // S3 direct presigned URL for admin assets
        const url = await getSignedUrl(s3Client, new GetObjectCommand({
          Bucket: asset.bucket,
          Key: asset.storageKey,
        }), { expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE });
        return c.json({ url, expiresIn: PRESIGNED_URL_EXPIRATION_PRIVATE }, 200);
      }
      default:
        return c.json({ error: 'Invalid visibility' }, 403);
    }
  })
  .openapi(listAssetsRoute, async (c) => {
    const user = c.get('user');
    const { module, limit, offset } = c.req.valid('query');

    const conditions = [
      eq(assets.userId, user.id),
      isNull(assets.deletedAt),
    ];

    if (module) {
      conditions.push(eq(assets.module, module));
    }

    const userAssets = await db.query.assets.findMany({
      where: and(...conditions),
      orderBy: desc(assets.createdAt),
      limit,
      offset,
    });

    // Get total count for pagination
    const allAssets = await db.query.assets.findMany({
      where: and(...conditions),
      columns: { id: true },
    });

    return c.json({
      assets: userAssets.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        visibility: a.visibility as 'private' | 'public' | 'admin-private',
        module: a.module,
        createdAt: a.createdAt.toISOString(),
      })),
      pagination: {
        total: allAssets.length,
        limit,
        offset,
      },
    }, 200);
  })
  .openapi(publishAssetRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), isNull(assets.deletedAt)),
    });

    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    // Verify ownership
    if (asset.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Already public
    if (asset.visibility === 'public') {
      const url = CDN_BASE_URL
        ? `${CDN_BASE_URL}/${asset.storageKey}`
        : `${process.env.S3_ENDPOINT}/${asset.bucket}/${asset.storageKey}`;
      return c.json({ url }, 200);
    }

    // Copy from private to public bucket
    const newStorageKey = `shared/${asset.userId}/${asset.id}/${asset.filename}`;

    await s3Client.send(new CopyObjectCommand({
      Bucket: BUCKETS.public,
      Key: newStorageKey,
      CopySource: `${asset.bucket}/${asset.storageKey}`,
    }));

    // Update asset record
    await db.update(assets)
      .set({
        bucket: BUCKETS.public,
        storageKey: newStorageKey,
        visibility: 'public',
        publishedAt: new Date(),
      })
      .where(eq(assets.id, id));

    // Delete from private bucket
    await s3Client.send(new DeleteObjectCommand({
      Bucket: asset.bucket,
      Key: asset.storageKey,
    }));

    const url = CDN_BASE_URL
      ? `${CDN_BASE_URL}/${newStorageKey}`
      : `${process.env.S3_ENDPOINT}/${BUCKETS.public}/${newStorageKey}`;

    return c.json({ url }, 200);
  })
  .openapi(deleteAssetRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), isNull(assets.deletedAt)),
    });

    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    // Verify ownership
    if (asset.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Soft delete
    await db.update(assets)
      .set({ deletedAt: new Date() })
      .where(eq(assets.id, id));

    return c.json({ success: true }, 200);
  });
