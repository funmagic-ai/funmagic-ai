import { i18n } from './i18n'

export class ApiError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly retryAfter?: number

  constructor(code: string, message: string, statusCode: number, retryAfter?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.retryAfter = retryAfter
  }
}

/**
 * Parse an API error response into an ApiError with a localized message.
 *
 * Supports both the new structured format `{ error: { code, message } }`
 * and the legacy flat format `{ error: string }`.
 */
export function extractApiError(
  body: unknown,
  response?: { status: number; headers?: { get(name: string): string | null } },
): ApiError {
  const statusCode = response?.status ?? 500
  const t = i18n.global.t

  // Parse Retry-After header for 429 responses
  let retryAfter: number | undefined
  if (statusCode === 429 && response?.headers) {
    const raw = response.headers.get('Retry-After')
    if (raw) {
      const parsed = Number(raw)
      if (!Number.isNaN(parsed) && parsed > 0) {
        retryAfter = parsed
      }
    }
  }

  // New structured format: { error: { code, message } }
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof (body as any).error === 'object' &&
    (body as any).error !== null
  ) {
    const { code, message } = (body as any).error as { code?: string; message?: string }
    if (code) {
      const i18nKey = `errors.${code}`
      const localized = t(i18nKey)
      // vue-i18n returns the key itself when no translation is found
      const finalMessage = localized !== i18nKey ? localized : (message ?? t('errors.fallback'))
      return new ApiError(code, finalMessage, statusCode, retryAfter)
    }
  }

  // Legacy flat format: { error: string }
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    typeof (body as any).error === 'string'
  ) {
    return new ApiError('UNKNOWN', (body as any).error, statusCode, retryAfter)
  }

  return new ApiError('INTERNAL_ERROR', t('errors.fallback'), statusCode, retryAfter)
}
