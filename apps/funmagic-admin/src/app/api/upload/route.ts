import { route, RejectUpload, type Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { custom } from '@better-upload/server/clients';
import { auth } from '@funmagic/auth/server';
import { isAdmin } from '@funmagic/auth/permissions';
import { headers } from 'next/headers';

// Environment variables for file limits
const MAX_STYLE_IMAGE_SIZE = parseInt(process.env.MAX_STYLE_IMAGE_SIZE ?? '5242880', 10);
const MAX_STYLE_IMAGES = parseInt(process.env.MAX_STYLE_IMAGES ?? '8', 10);
const MAX_BANNER_IMAGE_SIZE = parseInt(process.env.MAX_BANNER_IMAGE_SIZE ?? '10485760', 10);

const s3 = custom({
  host: process.env.S3_ENDPOINT?.replace(/^https?:\/\//, '') || 'localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  accessKeyId: process.env.S3_ACCESS_KEY || 'placeholder',
  secretAccessKey: process.env.S3_SECRET_KEY || 'placeholder',
  secure: process.env.S3_ENDPOINT?.startsWith('https') ?? false,
  forcePathStyle: true,
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !isAdmin(session.user.role)) {
    throw new RejectUpload('Unauthorized');
  }
  return session;
}

const router: Router = {
  client: s3,
  bucketName: process.env.S3_BUCKET_PUBLIC || 'funmagic-public',
  routes: {
    'style-images': route({
      fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: MAX_STYLE_IMAGE_SIZE,
      multipleFiles: true,
      maxFiles: MAX_STYLE_IMAGES,
      onBeforeUpload: async () => {
        const session = await requireAdmin();
        return {
          generateObjectInfo: ({ file }: { file: { name: string } }) => ({
            key: `public/ops/styles/${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
            metadata: { uploadedBy: session.user.id },
          }),
        };
      },
    }),
    'banner-images': route({
      fileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxFileSize: MAX_BANNER_IMAGE_SIZE,
      multipleFiles: true,
      maxFiles: 1,
      onBeforeUpload: async () => {
        await requireAdmin();
        return {
          generateObjectInfo: ({ file }: { file: { name: string } }) => ({
            key: `public/ops/banners/${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
          }),
        };
      },
    }),
  },
};

export const { POST } = toRouteHandler(router);
