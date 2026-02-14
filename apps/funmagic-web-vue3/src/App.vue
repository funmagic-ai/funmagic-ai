<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  NNotificationProvider,
  NLoadingBarProvider,
  darkTheme,
  type GlobalThemeOverrides,
} from 'naive-ui'
import { useAppStore, type ThemeName } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const appStore = useAppStore()
const authStore = useAuthStore()

const THEME_PRIMARY_COLORS: Record<ThemeName, string> = {
  purple: '#7c3aed',
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  red: '#dc2626',
  teal: '#0d9488',
  indigo: '#4f46e5',
  slate: '#475569',
}

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const primary = THEME_PRIMARY_COLORS[appStore.currentTheme] || '#9333ea'
  return {
    common: {
      primaryColor: primary,
      primaryColorHover: primary,
      primaryColorPressed: primary,
      primaryColorSuppl: primary,
      borderRadius: '10px',
      borderRadiusSmall: '8px',
    },
  }
})

const theme = computed(() => (appStore.isDark ? darkTheme : null))
</script>

<template>
  <NConfigProvider :theme="theme" :theme-overrides="themeOverrides">
    <NLoadingBarProvider>
      <NMessageProvider>
        <NDialogProvider>
          <NNotificationProvider>
            <div v-if="authStore.isLoading" class="flex h-dvh items-center justify-center">
              <n-spin size="large" />
            </div>
            <ErrorBoundary v-else>
              <router-view />
            </ErrorBoundary>
          </NNotificationProvider>
        </NDialogProvider>
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
