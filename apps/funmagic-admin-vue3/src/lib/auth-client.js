import { createAuthClient } from 'better-auth/vue';
import { inferAdditionalFields } from 'better-auth/client/plugins';
export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_URL,
    plugins: [
        inferAdditionalFields(),
    ],
});
