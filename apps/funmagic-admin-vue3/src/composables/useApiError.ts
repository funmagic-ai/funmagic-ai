import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { ApiError } from '@/lib/api-error'

export function useApiError() {
  const message = useMessage()
  const router = useRouter()

  function handleError(err: Error) {
    if (err instanceof ApiError) {
      if (err.statusCode === 429) {
        const retry = err.retryAfter ?? 60
        router.push({ path: '/rate-limit', query: { retry: String(retry) } })
        return
      }

      if (err.statusCode === 401) {
        router.push('/login')
      }
    }

    message.error(err.message)
  }

  return { handleError }
}
