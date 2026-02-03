import { route, RejectUpload, type Router } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { custom } from '@better-upload/server/clients';
import { auth, type Session } from '@funmagic/auth/server';
import { isAdmin } from '@funmagic/auth/permissions';
import { headers } from 'next/headers';

const MAX_THUMBNAIL_SIZE = parseInt(process.env.MAX_THUMBNAIL_SIZE ?? '5242880', 10); // 5MB default

const s3 = custom({
  host: process.env.S3_ENDPOINT!.replace(/^https?:\/\//, ''),
  region: process.env.S3_REGION!,
  accessKeyId: process.env.S3_ACCESS_KEY!,
  secretAccessKey: process.env.S3_SECRET_KEY!,
  secure: process.env.S3_ENDPOINT?.startsWith('https') ?? false,
  forcePathStyle: true,
});

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  }) as Session | null;
  if (!session || !isAdmin(session.user.role)) {
    throw new RejectUpload('Unauthorized');
  }
  return session;
}

const router: Router = {
  client: s3,
  bucketName: process.env.S3_BUCKET_PUBLIC!,
  routes: {
    thumbnails: route({
      fileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxFileSize: MAX_THUMBNAIL_SIZE,
      multipleFiles: true,
      maxFiles: 1,
      onBeforeUpload: async () => {
        await requireAdmin();
        return {
          generateObjectInfo: ({ file }: { file: { name: string } }) => ({
            key: `public/ops/tools/thumbnails/${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
          }),
        };
      },
    }),
  },
};

export const { POST } = toRouteHandler(router);
