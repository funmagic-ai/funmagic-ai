<script setup lang="ts">
import { NDropdown, NIcon } from 'naive-ui'
import { ColorPaletteOutline } from '@vicons/ionicons5'
import { useAppStore, THEMES, type ThemeName } from '@/stores/app'

const appStore = useAppStore()

const THEME_COLORS: Record<ThemeName, string> = {
  purple: '#7c3aed',
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  red: '#dc2626',
  teal: '#0d9488',
  indigo: '#4f46e5',
  slate: '#475569',
}

const options = THEMES.map((theme) => ({
  key: theme,
  label: theme.charAt(0).toUpperCase() + theme.slice(1),
}))

function handleSelect(key: string) {
  appStore.setTheme(key as ThemeName)
}
</script>

<template>
  <NDropdown
    trigger="click"
    :options="options"
    :value="appStore.currentTheme"
    @select="handleSelect"
  >
    <template #default>
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent"
      >
        <NIcon :size="20">
          <ColorPaletteOutline />
        </NIcon>
      </button>
    </template>
    <template #renderLabel="{ option }">
      <div class="flex items-center gap-2.5 py-0.5">
        <span
          class="inline-block h-4 w-4 rounded-full border border-border"
          :style="{ backgroundColor: THEME_COLORS[option.key as ThemeName] }"
        />
        <span
          :class="[
            'text-sm',
            option.key === appStore.currentTheme ? 'font-semibold text-primary' : '',
          ]"
        >
          {{ option.label }}
        </span>
        <span v-if="option.key === appStore.currentTheme" class="ml-auto text-xs text-primary">
          &#10003;
        </span>
      </div>
    </template>
  </NDropdown>
</template>
