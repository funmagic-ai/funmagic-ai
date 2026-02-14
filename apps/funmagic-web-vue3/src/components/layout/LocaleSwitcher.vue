<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, LOCALE_LABELS, setLocale, type SupportedLocale } from '@/lib/i18n'
import { GlobeOutline } from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()

const options: DropdownOption[] = [
  {
    key: 'header',
    type: 'render',
    render: () =>
      h('div', { class: 'px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider', style: 'min-width:220px' }, 'Language'),
  },
  { type: 'divider', key: 'd0' },
  ...SUPPORTED_LOCALES.map((loc) => ({
    key: loc,
    label: LOCALE_LABELS[loc],
  })),
]

async function handleSelect(key: string) {
  const newLocale = key as SupportedLocale
  await setLocale(newLocale)

  // Update the locale param in the current route
  router.replace({
    name: route.name ?? undefined,
    params: { ...route.params, locale: newLocale },
    query: route.query,
    hash: route.hash,
  })
}
</script>

<template>
  <n-dropdown
    :options="options"
    trigger="click"
    @select="handleSelect"
  >
    <n-button quaternary circle aria-label="Change language">
      <template #icon>
        <n-icon :size="20">
          <GlobeOutline />
        </n-icon>
      </template>
    </n-button>
    <template #renderLabel="{ option }">
      <div
        class="flex items-center gap-3 min-w-[160px] py-0.5 rounded"
        :style="option.key === locale ? { background: 'color-mix(in oklch, var(--primary) 15%, transparent)' } : undefined"
      >
        <span
          :class="['inline-flex h-5 w-7 items-center justify-center rounded text-[10px] font-bold uppercase shrink-0', option.key === locale ? 'bg-primary/20' : 'bg-muted text-muted-foreground']"
          :style="option.key === locale ? { color: 'var(--foreground)' } : undefined"
        >
          {{ (option.key as string).toUpperCase() }}
        </span>
        <span
          class="text-sm flex-1"
          :style="option.key === locale ? { color: 'var(--foreground)', fontWeight: 600 } : undefined"
        >
          {{ option.label }}
        </span>
        <span
          v-if="option.key === locale"
          class="text-xs shrink-0"
          :style="{ color: 'var(--foreground)' }"
        >&#10003;</span>
      </div>
    </template>
  </n-dropdown>
</template>
