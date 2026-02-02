import createClient from 'openapi-fetch';
import type { paths } from './types';

export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}

// Re-export types for convenience
export type * from './types';
