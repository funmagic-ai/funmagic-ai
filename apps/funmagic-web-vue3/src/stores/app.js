import { defineStore } from 'pinia';
import { useColorMode, useStorage } from '@vueuse/core';
export const THEMES = ['purple', 'blue', 'green', 'orange', 'red', 'teal', 'indigo', 'slate'];
export const useAppStore = defineStore('app', () => {
    const colorMode = useColorMode({ attribute: 'class' });
    const currentTheme = useStorage('funmagic-theme', 'purple');
    const isDark = computed({
        get: () => colorMode.value === 'dark',
        set: (value) => {
            colorMode.value = value ? 'dark' : 'light';
        },
    });
    function toggleDark() {
        isDark.value = !isDark.value;
    }
    function setTheme(theme) {
        currentTheme.value = theme;
        document.documentElement.setAttribute('data-theme', theme);
    }
    // Initialize theme on store creation
    document.documentElement.setAttribute('data-theme', currentTheme.value);
    return {
        isDark,
        currentTheme,
        toggleDark,
        setTheme,
    };
});
