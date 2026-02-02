import { route, type Router, RejectUpload } from '@better-upload/server'
import { toRouteHandler } from '@better-upload/server/adapters/next'
import { custom } from '@better-upload/server/clients'
import { auth } from '@funmagic/auth/server'
import { headers } from 'next/headers'

// S3-compatible storage (MinIO for local/docker, AWS S3 for production)
const s3Client = custom({
  host: process.env.S3_ENDPOINT!.replace(/^https?:\/\//, ''),
  region: process.env.S3_REGION!,
  accessKeyId: process.env.S3_ACCESS_KEY!,
  secretAccessKey: process.env.S3_SECRET_KEY!,
  secure: process.env.S3_ENDPOINT?.startsWith('https') ?? false,
  forcePathStyle: true, // Required for MinIO
})

const router: Router = {
  client: s3Client,
  bucketName: process.env.S3_BUCKET_PRIVATE!,
  routes: {
    input: route({
      fileTypes: ['image/*'],
      maxFileSize: 20 * 1024 * 1024,
      onBeforeUpload: async ({ file }) => {
        const session = await auth.api.getSession({ headers: await headers() })

        if (!session) {
          throw new RejectUpload('Authentication required')
        }

        const userId = session.user.id
        const timestamp = Date.now()
        const ext = file.name.split('.').pop() || 'bin'
        const key = `uploads/${userId}/figme/${timestamp}-${crypto.randomUUID()}.${ext}`

        return {
          objectInfo: {
            key,
            metadata: {
              userId,
              originalName: file.name,
              module: 'figme',
            },
          },
        }
      },
    }),
  },
}

export const { POST } = toRouteHandler(router)
