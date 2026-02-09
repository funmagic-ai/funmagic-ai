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
import ErrorBoundary from '@/components/shared/ErrorBoundary.vue'

const appStore = useAppStore()
const authStore = useAuthStore()

const THEME_PRIMARY_COLORS: Record<ThemeName, string> = {
  purple: '#9333ea',
  blue: '#3b82f6',
  green: '#22c55e',
  orange: '#f97316',
  red: '#ef4444',
  teal: '#14b8a6',
  indigo: '#6366f1',
  slate: '#64748b',
}

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const primary = THEME_PRIMARY_COLORS[appStore.currentTheme] || '#9333ea'
  return {
    common: {
      primaryColor: primary,
      primaryColorHover: primary,
      primaryColorPressed: primary,
      primaryColorSuppl: primary,
    },
    Card: {
      borderRadius: '0.75rem',
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
            <div v-if="authStore.isLoading" class="flex h-screen items-center justify-center">
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
