import { useMessage } from 'naive-ui'
import { useRouter, useRoute } from 'vue-router'
import { ApiError } from '@/lib/api-error'

export function useApiError() {
  const message = useMessage()
  const router = useRouter()
  const route = useRoute()

  function handleError(err: Error) {
    if (err instanceof ApiError) {
      const locale = (route.params.locale as string) || 'en'

      if (err.statusCode === 429) {
        const retry = err.retryAfter ?? 60
        router.push({ name: 'rate-limit', params: { locale }, query: { retry: String(retry) } })
        return
      }

      if (err.statusCode === 401) {
        router.push({ name: 'login', params: { locale } })
      }
    }

    message.error(err.message)
  }

  return { handleError }
}
