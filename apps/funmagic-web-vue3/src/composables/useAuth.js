import { useAuthStore } from '@/stores/auth';
export function useAuth() {
    const authStore = useAuthStore();
    return {
        user: computed(() => authStore.user),
        isAuthenticated: computed(() => authStore.isAuthenticated),
        isLoading: computed(() => authStore.isLoading),
        isAdmin: computed(() => authStore.isAdmin),
        signIn: authStore.signIn,
        signUp: authStore.signUp,
        signOut: authStore.signOut,
    };
}
