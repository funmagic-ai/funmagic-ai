import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { getPresignedUploadUrl, generateStorageKey, getBucketForVisibility } from '@funmagic/services';

const DEFAULT_ALLOWED_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/json,text/plain';
const ALLOWED_CONTENT_TYPES = (process.env.ALLOWED_UPLOAD_TYPES ?? DEFAULT_ALLOWED_TYPES).split(',').map(t => t.trim());

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_UPLOAD_SIZE ?? String(20 * 1024 * 1024), 10);

const PresignSchema = z.object({
  module: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().optional(),
  visibility: z.enum(['public', 'private']).optional(),
}).openapi('PresignRequest');

const PresignResponseSchema = z.object({
  uploadUrl: z.string(),
  storageKey: z.string(),
  bucket: z.string(),
}).openapi('PresignResponse');

const ErrorSchema = z.object({
  error: z.string(),
}).openapi('UploadError');

const presignRoute = createRoute({
  method: 'post',
  path: '/presign',
  tags: ['Upload'],
  request: {
    body: {
      content: { 'application/json': { schema: PresignSchema } },
    },
  },
  responses: {
    200: {
      content: { 'application/json': { schema: PresignResponseSchema } },
      description: 'Presigned upload URL generated',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid request',
    },
  },
});

export const uploadRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .openapi(presignRoute, async (c) => {
    const user = c.get('user');
    if (!user?.id) {
      return c.json({ error: 'Authentication required' }, 401 as any);
    }

    const { module, filename, contentType, contentLength, visibility } = c.req.valid('json');

    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return c.json({ error: `Content type "${contentType}" is not allowed. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}` }, 400);
    }

    if (contentLength && contentLength > MAX_FILE_SIZE) {
      return c.json({ error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` }, 400);
    }

    const storageKey = generateStorageKey(user.id, module, filename);
    const bucket = getBucketForVisibility(visibility ?? 'private');

    const uploadUrl = await getPresignedUploadUrl({
      bucket,
      storageKey,
      contentType,
      contentLength,
    });

    return c.json({
      uploadUrl,
      storageKey,
      bucket,
    }, 200);
  });
