import { useAuthStore } from '@/stores/auth'

export function useAuth() {
  const authStore = useAuthStore()

  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    isLoading: computed(() => authStore.isLoading),
    isAdmin: computed(() => authStore.isAdmin),
    isSuperAdmin: computed(() => authStore.isSuperAdmin),
    signIn: authStore.signIn,
    signOut: authStore.signOut,
  }
}
