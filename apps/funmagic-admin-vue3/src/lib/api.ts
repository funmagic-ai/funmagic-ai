import createClient from 'openapi-fetch'
import type { paths } from '@funmagic/shared/api'

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
})
