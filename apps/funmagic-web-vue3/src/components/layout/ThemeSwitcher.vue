<script setup lang="ts">
import { NDropdown, NIcon, type DropdownOption } from 'naive-ui'
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

const options: DropdownOption[] = [
  {
    key: 'header',
    type: 'render',
    render: () =>
      h('div', { class: 'px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider', style: 'min-width:220px' }, 'Theme'),
  },
  { type: 'divider', key: 'd0' },
  ...THEMES.map((theme) => ({
    key: theme,
    label: theme.charAt(0).toUpperCase() + theme.slice(1),
  })),
]

function handleSelect(key: string) {
  appStore.setTheme(key as ThemeName)
}
</script>

<template>
  <NDropdown
    trigger="click"
    :options="options"
    @select="handleSelect"
  >
    <template #default>
      <n-button quaternary circle aria-label="Change theme">
        <template #icon>
          <n-icon :size="20">
            <ColorPaletteOutline />
          </n-icon>
        </template>
      </n-button>
    </template>
    <template #renderLabel="{ option }">
      <div
        class="flex items-center gap-3 min-w-[160px] py-0.5 rounded"
        :style="option.key === appStore.currentTheme ? { background: 'color-mix(in oklch, var(--primary) 15%, transparent)' } : undefined"
      >
        <span
          class="inline-block h-4 w-4 rounded-full border border-border shrink-0"
          :style="{ backgroundColor: THEME_COLORS[option.key as ThemeName] }"
        />
        <span
          class="text-sm flex-1"
          :style="option.key === appStore.currentTheme ? { color: 'var(--foreground)', fontWeight: 600 } : undefined"
        >
          {{ option.label }}
        </span>
        <span
          v-if="option.key === appStore.currentTheme"
          class="text-xs shrink-0"
          :style="{ color: 'var(--foreground)' }"
        >
          &#10003;
        </span>
      </div>
    </template>
  </NDropdown>
</template>
