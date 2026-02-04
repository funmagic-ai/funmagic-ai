import { createApiClient } from '@funmagic/shared/api';

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
}

export const api = createApiClient(baseUrl);
