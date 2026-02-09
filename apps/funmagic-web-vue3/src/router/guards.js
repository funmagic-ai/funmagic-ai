import { isValidLocale, setLocale, DEFAULT_LOCALE } from '@/lib/i18n';
import { useAuthStore } from '@/stores/auth';
export function setupGuards(router) {
    router.beforeEach(async (to, _from) => {
        // Handle locale from URL
        const locale = to.params.locale;
        if (locale && isValidLocale(locale)) {
            await setLocale(locale);
        }
        else if (locale && !isValidLocale(locale)) {
            // Invalid locale - redirect to default
            const pathWithoutLocale = to.path.replace(`/${locale}`, '') || '/';
            return { path: `/${DEFAULT_LOCALE}${pathWithoutLocale}`, query: to.query };
        }
        // Auth guards
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
        const currentLocale = locale || DEFAULT_LOCALE;
        if (to.meta.requiresAuth && !authStore.isAuthenticated) {
            return { name: 'login', params: { locale: currentLocale } };
        }
        if (to.meta.guestOnly && authStore.isAuthenticated) {
            return { name: 'home', params: { locale: currentLocale } };
        }
    });
}
