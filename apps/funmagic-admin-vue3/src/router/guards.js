import { useAuthStore } from '@/stores/auth';
export function setupGuards(router) {
    router.beforeEach(async (to) => {
        const authStore = useAuthStore();
        // Wait for session to load on first navigation
        if (authStore.isLoading) {
            await new Promise((resolve) => {
                const unwatch = watch(() => authStore.isLoading, (loading) => {
                    if (!loading) {
                        unwatch();
                        resolve();
                    }
                }, { immediate: true });
            });
        }
        // Guest-only pages (login)
        if (to.meta.guestOnly && authStore.isAuthenticated) {
            return { name: 'dashboard' };
        }
        // Auth required
        if (to.meta.requiresAuth && !authStore.isAuthenticated) {
            return { name: 'login' };
        }
        // Admin role required
        if (to.meta.requiresAdmin && !authStore.isAdmin) {
            return { name: 'unauthorized' };
        }
        // Super admin role required
        if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
            return { name: 'unauthorized' };
        }
    });
}
