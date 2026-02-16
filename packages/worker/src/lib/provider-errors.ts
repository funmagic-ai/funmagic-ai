/**
 * Detect provider 429 (rate limit) errors across different SDK error shapes.
 */
export function isProvider429Error(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // OpenAI SDK: APIError with status 429
  if ('status' in error && (error as any).status === 429) return true;

  // Google GenAI: RESOURCE_EXHAUSTED
  if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) return true;

  // Fal.ai / generic: statusCode property
  if ('statusCode' in error && (error as any).statusCode === 429) return true;

  // Replicate / generic: response property with status
  if ('response' in error) {
    const resp = (error as any).response;
    if (resp?.status === 429 || resp?.statusCode === 429) return true;
  }

  return false;
}

/**
 * Calculate exponential backoff delay, capped at 60 seconds.
 */
export function calculateBackoff(attempt: number, baseMs: number): number {
  return Math.min(baseMs * Math.pow(2, attempt), 60_000);
}
