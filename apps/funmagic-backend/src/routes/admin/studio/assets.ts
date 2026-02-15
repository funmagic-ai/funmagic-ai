import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { getPresignedDownloadUrl, getBucketForVisibility } from '@funmagic/services';
import { ASSET_VISIBILITY, ERROR_CODES } from '@funmagic/shared';
import { badRequest } from '../../../lib/errors';
import { ErrorSchema } from '../../../schemas';

const BUCKET_ADMIN = getBucketForVisibility(ASSET_VISIBILITY.ADMIN_PRIVATE);

const getAssetUrlRoute = createRoute({
  method: 'get',
  path: '/assets/url',
  tags: ['Admin - Studio'],
  request: {
    query: z.object({
      storageKey: z.string().min(1, 'Storage key is required'),
    }),
  },
  responses: {
    200: {
      content: { 'application/json': { schema: z.object({ url: z.string(), expiresIn: z.number() }) } },
      description: 'Presigned download URL',
    },
    400: {
      content: { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid storage key',
    },
  },
});

export const assetsRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .openapi(getAssetUrlRoute, async (c) => {
    const { storageKey } = c.req.valid('query');

    if (!storageKey || storageKey.includes('..')) {
      throw badRequest(ERROR_CODES.STORAGE_KEY_INVALID, 'Invalid storage key');
    }

    try {
      const url = await getPresignedDownloadUrl({ bucket: BUCKET_ADMIN, storageKey });

      return c.json({ url, expiresIn: -1 }, 200);
    } catch (error) {
      console.error('[Studio] Failed to generate presigned URL:', error);
      throw badRequest(ERROR_CODES.URL_GENERATION_FAILED, 'Failed to generate URL');
    }
  });
