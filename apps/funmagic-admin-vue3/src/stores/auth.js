import { defineStore } from 'pinia';
import { authClient } from '@/lib/auth-client';
export const useAuthStore = defineStore('auth', () => {
    const sessionData = shallowRef(null);
    const isLoading = ref(true);
    const user = computed(() => sessionData.value?.user ?? null);
    const isAuthenticated = computed(() => !!sessionData.value?.session);
    const userRole = computed(() => user.value?.role ?? 'user');
    const isAdmin = computed(() => userRole.value === 'admin' || userRole.value === 'super_admin');
    const isSuperAdmin = computed(() => userRole.value === 'super_admin');
    async function fetchSession() {
        try {
            const { data, error } = await authClient.getSession();
            if (data && !error) {
                sessionData.value = data;
            }
        }
        catch {
            // Session fetch failed (CORS, network, not authenticated)
        }
        finally {
            isLoading.value = false;
        }
    }
    async function signIn(email, password) {
        const result = await authClient.signIn.email({ email, password });
        await fetchSession();
        return result;
    }
    async function signOut() {
        const result = await authClient.signOut();
        sessionData.value = null;
        return result;
    }
    // Fetch initial session
    fetchSession();
    return {
        sessionData,
        user,
        isAuthenticated,
        isLoading,
        userRole,
        isAdmin,
        isSuperAdmin,
        signIn,
        signOut,
        fetchSession,
    };
});
