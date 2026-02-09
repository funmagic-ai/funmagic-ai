import { defineStore } from 'pinia'
import { useColorMode, useStorage } from '@vueuse/core'

export type ThemeName = 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'teal' | 'indigo' | 'slate'

export const THEMES: ThemeName[] = ['purple', 'blue', 'green', 'orange', 'red', 'teal', 'indigo', 'slate']

export const useAppStore = defineStore('app', () => {
  const colorMode = useColorMode({ attribute: 'class' })
  const currentTheme = useStorage<ThemeName>('funmagic-theme', 'purple')

  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (value: boolean) => {
      colorMode.value = value ? 'dark' : 'light'
    },
  })

  function toggleDark() {
    isDark.value = !isDark.value
  }

  function setTheme(theme: ThemeName) {
    currentTheme.value = theme
    document.documentElement.setAttribute('data-theme', theme)
  }

  // Initialize theme on store creation
  document.documentElement.setAttribute('data-theme', currentTheme.value)

  return {
    isDark,
    currentTheme,
    toggleDark,
    setTheme,
  }
})
