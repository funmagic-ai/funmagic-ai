import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { db, assets } from '@funmagic/database';
import { eq, and, isNull, desc } from 'drizzle-orm';
import {
  generateStorageKey,
  getBucketForVisibility,
  getPresignedUploadUrl,
  resolveAssetUrl,
  getPublicCdnUrl,
  copyObject,
  deleteObject,
} from '@funmagic/services';
import { ASSET_VISIBILITY, type AssetVisibility, AppError, ERROR_CODES } from '@funmagic/shared';
import { notFound, forbidden, badRequest } from '../lib/errors';
import { ErrorSchema } from '../schemas';

// Environment variables
const ALLOWED_CONTENT_TYPES = process.env.ALLOWED_UPLOAD_TYPES!.split(',').map(t => t.trim());
const MAX_IMAGE_UPLOAD_SIZE = parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE!, 10);
const MAX_FILE_UPLOAD_SIZE = parseInt(process.env.MAX_FILE_UPLOAD_SIZE!, 10);

/**
 * Validate that a claimed content type matches the file extension.
 * This prevents uploading executable files disguised as images, etc.
 */
const EXTENSION_MIME_MAP: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.svg': ['image/svg+xml'],
  '.json': ['application/json'],
  '.txt': ['text/plain'],
};

function validateFilenameMatchesMimeType(filename: string, contentType: string): boolean {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const allowedMimes = EXTENSION_MIME_MAP[ext];
  if (!allowedMimes) {
    // Unknown extension — reject unless it's in the allowed content types
    return ALLOWED_CONTENT_TYPES.includes(contentType);
  }
  return allowedMimes.includes(contentType);
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
  visibility: z.enum(['public', 'private', 'admin-private']).optional().default('private'),
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
    const { filename, contentType, size, module, visibility } = c.req.valid('json');

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw badRequest(ERROR_CODES.UPLOAD_INVALID_TYPE, `Content type "${contentType}" is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`);
    }

    // Validate filename extension matches claimed content type
    if (!validateFilenameMatchesMimeType(filename, contentType)) {
      throw badRequest(ERROR_CODES.UPLOAD_EXTENSION_MISMATCH, `File extension does not match content type "${contentType}"`);
    }

    // Validate file size (different limits for images vs other files)
    const isImage = contentType.startsWith('image/');
    const maxSize = isImage ? MAX_IMAGE_UPLOAD_SIZE : MAX_FILE_UPLOAD_SIZE;
    if (size > maxSize) {
      throw badRequest(ERROR_CODES.UPLOAD_SIZE_EXCEEDED, `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    const bucket = getBucketForVisibility(visibility);
    const storageKey = generateStorageKey(user.id, module, filename);

    // Create asset record first
    const [asset] = await db.insert(assets).values({
      userId: user.id,
      storageKey,
      bucket,
      filename,
      mimeType: contentType,
      size,
      visibility,
      module,
    }).returning();

    // Generate presigned PUT URL
    const presignedUrl = await getPresignedUploadUrl({
      bucket,
      storageKey,
      contentType,
      contentLength: size,
    });

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
      throw notFound('Asset');
    }

    try {
      const result = await resolveAssetUrl({ ...asset, visibility: asset.visibility as AssetVisibility }, user.id);
      return c.json(result, 200);
    } catch (e) {
      throw forbidden(e instanceof Error ? e.message : 'Forbidden');
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
        visibility: a.visibility as AssetVisibility,
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
      throw notFound('Asset');
    }

    // Verify ownership
    if (asset.userId !== user.id) {
      throw forbidden();
    }

    // Already public
    if (asset.visibility === ASSET_VISIBILITY.PUBLIC) {
      return c.json({ url: getPublicCdnUrl(asset.storageKey) }, 200);
    }

    // Copy from private to public bucket
    const publicBucket = getBucketForVisibility(ASSET_VISIBILITY.PUBLIC);
    const newStorageKey = `shared/${asset.userId}/${asset.id}/${asset.filename}`;

    await copyObject(asset.bucket, asset.storageKey, publicBucket, newStorageKey);

    // Update asset record
    await db.update(assets)
      .set({
        bucket: publicBucket,
        storageKey: newStorageKey,
        visibility: ASSET_VISIBILITY.PUBLIC,
        publishedAt: new Date(),
      })
      .where(eq(assets.id, id));

    // Delete from private bucket
    await deleteObject(asset.bucket, asset.storageKey);

    return c.json({ url: getPublicCdnUrl(newStorageKey) }, 200);
  })
  .openapi(deleteAssetRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');

    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, id), isNull(assets.deletedAt)),
    });

    if (!asset) {
      throw notFound('Asset');
    }

    // Verify ownership
    if (asset.userId !== user.id) {
      throw forbidden();
    }

    // Soft delete
    await db.update(assets)
      .set({ deletedAt: new Date() })
      .where(eq(assets.id, id));

    return c.json({ success: true }, 200);
  });
