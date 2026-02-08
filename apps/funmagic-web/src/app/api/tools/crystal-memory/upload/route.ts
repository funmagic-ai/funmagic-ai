import { type Router, RejectUpload, route } from '@better-upload/server'
import { toRouteHandler } from '@better-upload/server/adapters/next'
import { custom } from '@better-upload/server/clients'
import { auth } from '@funmagic/auth/server'
import { headers } from 'next/headers'

function getUploadConfig() {
  if (!process.env.MAX_IMAGE_UPLOAD_SIZE) throw new Error('MAX_IMAGE_UPLOAD_SIZE env var is required')
  if (!process.env.ALLOWED_IMAGE_TYPES) throw new Error('ALLOWED_IMAGE_TYPES env var is required')
  return {
    maxFileSize: parseInt(process.env.MAX_IMAGE_UPLOAD_SIZE, 10),
    fileTypes: process.env.ALLOWED_IMAGE_TYPES.split(','),
  }
}

function getS3Client() {
  return custom({
    host: process.env.S3_ENDPOINT!.replace(/^https?:\/\//, ''),
    region: process.env.S3_REGION!,
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
    secure: process.env.S3_ENDPOINT?.startsWith('https') ?? false,
    forcePathStyle: true,
  })
}

function createRouter(): Router {
  const config = getUploadConfig()
  return {
    client: getS3Client(),
    bucketName: process.env.S3_BUCKET_PRIVATE!,
    routes: {
      input: route({
        fileTypes: config.fileTypes,
        maxFileSize: config.maxFileSize,
        onBeforeUpload: async ({ file }) => {
          const session = await auth.api.getSession({ headers: await headers() })

          if (!session) {
            throw new RejectUpload('Authentication required')
          }

          const userId = session.user.id
          const timestamp = Date.now()
          const ext = file.name.split('.').pop() || 'bin'
          const key = `uploads/${userId}/crystal-memory/${timestamp}-${crypto.randomUUID()}.${ext}`

          return {
            objectInfo: {
              key,
              metadata: {
                userId,
                originalName: file.name,
                module: 'crystal-memory',
              },
            },
          }
        },
      }),
    },
  }
}

export const POST = async (request: Request) => {
  const router = createRouter()
  const handler = toRouteHandler(router)
  return handler.POST(request)
}
