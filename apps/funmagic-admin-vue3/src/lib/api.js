import createClient from 'openapi-fetch';
export const api = createClient({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include',
});
