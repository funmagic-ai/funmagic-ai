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
  purple: '#7c3aed',
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  red: '#dc2626',
  teal: '#0d9488',
  indigo: '#4f46e5',
  slate: '#475569',
}

const THEME_DARK_PRIMARY_COLORS: Record<ThemeName, string> = {
  purple: '#a78bfa',
  blue: '#60a5fa',
  green: '#4ade80',
  orange: '#fb923c',
  red: '#f87171',
  teal: '#2dd4bf',
  indigo: '#818cf8',
  slate: '#94a3b8',
}

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const colors = appStore.isDark ? THEME_DARK_PRIMARY_COLORS : THEME_PRIMARY_COLORS
  const primary = colors[appStore.currentTheme] || '#9333ea'
  const radius = '0.625rem'
  const radiusLg = '0.75rem'
  return {
    common: {
      primaryColor: primary,
      primaryColorHover: primary,
      primaryColorPressed: primary,
      primaryColorSuppl: primary,
      borderRadius: radius,
      borderRadiusSmall: radius,
    },
    Card: {
      borderRadius: radiusLg,
    },
    Button: {
      borderRadiusTiny: radius,
      borderRadiusSmall: radius,
      borderRadiusMedium: radius,
      borderRadiusLarge: radius,
    },
    Input: {
      borderRadius: radius,
    },
    Select: {
      peers: {
        InternalSelection: {
          borderRadius: radius,
        },
      },
    },
    Tag: {
      borderRadius: radius,
    },
    DataTable: {
      borderRadius: radiusLg,
    },
    Dialog: {
      borderRadius: radiusLg,
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
