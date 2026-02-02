import { route, type Router, RejectUpload } from '@better-upload/server'
import { toRouteHandler } from '@better-upload/server/adapters/next'
import { custom } from '@better-upload/server/clients'
import { auth } from '@funmagic/auth/server'
import { headers } from 'next/headers'

// S3-compatible storage (MinIO for local/docker, AWS S3 for production)
const s3Client = custom({
  host: process.env.S3_ENDPOINT?.replace(/^https?:\/\//, '') || 'localhost:9000',
  region: process.env.S3_REGION || 'us-east-2',
  accessKeyId: process.env.S3_ACCESS_KEY || 'funmagic',
  secretAccessKey: process.env.S3_SECRET_KEY || 'funmagic_dev',
  secure: process.env.S3_ENDPOINT?.startsWith('https') ?? false,
  forcePathStyle: true, // Required for MinIO
})

const router: Router = {
  client: s3Client,
  bucketName: process.env.S3_BUCKET_PRIVATE || 'funmagic-private',
  routes: {
    'tool-input': route({
      fileTypes: ['image/*'],
      maxFileSize: 20 * 1024 * 1024,
      onBeforeUpload: async ({ req, file }) => {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session) {
          throw new RejectUpload('Authentication required')
        }

        const userId = session.user.id
        const timestamp = Date.now()
        const ext = file.name.split('.').pop() || 'bin'
        const key = `uploads/${userId}/tool-input/${timestamp}-${crypto.randomUUID()}.${ext}`

        return {
          objectInfo: {
            key,
            metadata: {
              userId,
              originalName: file.name,
              module: 'tool-input',
            },
          },
        }
      },
    }),
    avatar: route({
      fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024,
      onBeforeUpload: async ({ req, file }) => {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session) {
          throw new RejectUpload('Authentication required')
        }

        const userId = session.user.id
        const ext = file.name.split('.').pop() || 'png'
        const key = `uploads/${userId}/avatar/avatar.${ext}`

        return {
          objectInfo: {
            key,
            metadata: {
              userId,
              originalName: file.name,
              module: 'avatar',
            },
          },
        }
      },
    }),
  },
}

export const { POST } = toRouteHandler(router)
