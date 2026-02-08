export type ToolErrorCode =
  | 'UNAUTHORIZED'
  | 'INSUFFICIENT_CREDITS'
  | 'TOOL_NOT_FOUND'
  | 'UPLOAD_FAILED'
  | 'SAVE_FAILED'
  | 'TASK_FAILED'
  | 'UNKNOWN'

export type ToolErrorData = {
  available?: number
  required?: number
  message?: string
}

const ERROR_KEY_MAP: Record<ToolErrorCode, string> = {
  INSUFFICIENT_CREDITS: 'insufficientCredits',
  UNAUTHORIZED: 'notAuthenticated',
  TOOL_NOT_FOUND: 'toolNotFound',
  UPLOAD_FAILED: 'uploadFailed',
  SAVE_FAILED: 'saveFailed',
  TASK_FAILED: 'taskFailed',
  UNKNOWN: 'unknownError',
}

export function formatToolError(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  code: ToolErrorCode,
  data?: ToolErrorData
): string {
  // If a custom message is provided, show it with the translated prefix
  if (data?.message) {
    return data.message
  }

  const key = ERROR_KEY_MAP[code] || 'unknownError'

  if (code === 'INSUFFICIENT_CREDITS' && data) {
    return t(key, { available: data.available ?? 0, required: data.required ?? 0 })
  }

  return t(key)
}

export function parseInsufficientCreditsError(message: string): ToolErrorData | undefined {
  const match = message.match(/Available: (\d+), Required: (\d+)/)
  if (match) {
    return { available: parseInt(match[1]), required: parseInt(match[2]) }
  }
  return undefined
}
