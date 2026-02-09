import { useAppStore } from '@/stores/app';
export function useTheme() {
    const appStore = useAppStore();
    return {
        isDark: computed(() => appStore.isDark),
        currentTheme: computed(() => appStore.currentTheme),
        toggleDark: appStore.toggleDark,
        setTheme: (theme) => appStore.setTheme(theme),
    };
}
