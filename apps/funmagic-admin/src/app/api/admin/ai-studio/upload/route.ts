import { type Router, RejectUpload } from '@better-upload/server';
import { toRouteHandler } from '@better-upload/server/adapters/next';
import { custom } from '@better-upload/server/clients';
import { auth, type Session } from '@funmagic/auth/server';
import { isAdmin } from '@funmagic/auth/permissions';
import { headers } from 'next/headers';

function getUploadConfig() {
  if (!process.env.MAX_IMAGE_UPLOAD_SIZE) throw new Error('MAX_IMAGE_UPLOAD_SIZE env var is required');
  if (!process.env.ALLOWED_IMAGE_TYPES) throw new Error('ALLOWED_IMAGE_TYPES env var is required');
  return {
    maxFileSize: parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE, 10),
    fileTypes: process.env.ALLOWED_IMAGE_TYPES.split(','),
  };
}

function getS3Client() {
  return custom({
    host: process.env.S3_ENDPOINT!.replace(/^https?:\/\//, ''),
    region: process.env.S3_REGION!,
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
    secure: process.env.S3_ENDPOINT?.startsWith('https') ?? false,
    forcePathStyle: true,
  });
}

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  }) as Session | null;
  if (!session || !isAdmin(session.user.role)) {
    throw new RejectUpload('Unauthorized');
  }
  return session;
}

function createRouter(): Router {
  const config = getUploadConfig();
  return {
    client: getS3Client(),
    bucketName: process.env.S3_BUCKET_PUBLIC!,
    routes: {
      'ai-studio': () => ({
        fileTypes: config.fileTypes,
        maxFileSize: config.maxFileSize,
        maxFiles: 5,
        onBeforeUpload: async () => {
          const session = await requireAdmin();
          return {
            generateObjectInfo: ({ file }: { file: { name: string } }) => ({
              key: `admin/ai-studio/${session.user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`,
            }),
          };
        },
      }),
    },
  };
}

export const POST = async (request: Request) => {
  const router = createRouter();
  const handler = toRouteHandler(router);
  return handler.POST(request);
};
