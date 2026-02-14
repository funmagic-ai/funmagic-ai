<script setup lang="ts">
import { NIcon, NDropdown, type DropdownOption } from 'naive-ui'
import {
  MenuOutline,
  PersonCircleOutline,
  LogOutOutline,
  MoonOutline,
  SunnyOutline,
  LanguageOutline,
} from '@vicons/ionicons5'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import {
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  setLocale,
  type SupportedLocale,
} from '@/lib/i18n'
import { useI18n } from 'vue-i18n'
import ThemeSwitcher from './ThemeSwitcher.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const { locale, t } = useI18n()

// Injected from DashboardLayout for responsive sidebar toggle
const toggleSidebar = inject<() => void>('toggleSidebar', () => appStore.toggleSidebar())

// Locale switcher options
const localeOptions: DropdownOption[] = [
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

async function handleLocaleSelect(key: string) {
  await setLocale(key as SupportedLocale)
}

// User dropdown options
const userOptions = computed(() => [
  {
    key: 'logout',
    label: t('nav.logout'),
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  },
])

async function handleUserSelect(key: string) {
  if (key === 'logout') {
    await authStore.signOut()
    router.push('/login')
  }
}
</script>

<template>
  <header
    class="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4"
  >
    <!-- Left side -->
    <div class="flex items-center gap-2">
      <!-- Sidebar toggle -->
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent"
        aria-label="Toggle sidebar"
        @click="toggleSidebar()"
      >
        <NIcon :size="20">
          <MenuOutline />
        </NIcon>
      </button>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-1">
      <!-- Locale switcher -->
      <NDropdown
        trigger="click"
        :options="localeOptions"
        @select="handleLocaleSelect"
      >
        <button
          class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent"
          aria-label="Change language"
        >
          <NIcon :size="20">
            <LanguageOutline />
          </NIcon>
        </button>
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
      </NDropdown>

      <!-- Theme switcher -->
      <ThemeSwitcher />

      <!-- Dark mode toggle -->
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-accent"
        :aria-label="appStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="appStore.toggleDark()"
      >
        <NIcon :size="20">
          <MoonOutline v-if="!appStore.isDark" />
          <SunnyOutline v-else />
        </NIcon>
      </button>

      <!-- Divider -->
      <div class="mx-1 h-6 w-px bg-border" />

      <!-- User dropdown -->
      <NDropdown
        trigger="click"
        :options="userOptions"
        @select="handleUserSelect"
      >
        <button
          class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-accent"
          aria-label="User menu"
        >
          <NIcon :size="20">
            <PersonCircleOutline />
          </NIcon>
          <span class="hidden text-sm font-medium sm:inline">
            {{ authStore.user?.name || authStore.user?.email || 'Admin' }}
          </span>
        </button>
      </NDropdown>
    </div>
  </header>
</template>
