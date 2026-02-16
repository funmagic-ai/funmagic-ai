import createClient from 'openapi-fetch'
import type { paths } from '@funmagic/shared/api'

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
})

// Inject X-Request-Id header on every outgoing request for end-to-end tracing
api.use({
  async onRequest({ request }) {
    request.headers.set('X-Request-Id', crypto.randomUUID())
    return request
  },
})
