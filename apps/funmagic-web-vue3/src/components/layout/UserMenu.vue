<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { NIcon } from 'naive-ui'
import {
  PersonOutline,
  ImagesOutline,
  LogOutOutline,
} from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentLocale = computed(() => (route.params.locale as string) || 'en')

const userInitial = computed(() => {
  const name = authStore.user?.name
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
})

// Fetch credit balance
const { data: balanceData } = useQuery({
  queryKey: ['credit-balance'],
  queryFn: async () => {
    const { data } = await api.GET('/api/credits/balance')
    return data
  },
  enabled: computed(() => authStore.isAuthenticated),
})

const creditBalance = computed(() => {
  const bal = balanceData.value as Record<string, unknown> | undefined
  return (bal?.balance as number) ?? 0
})

const menuOptions = computed<DropdownOption[]>(() => [
  // Email header (non-clickable)
  {
    key: 'user-info',
    type: 'render',
    render: () =>
      h('div', { class: 'px-3 py-2' }, [
        h('p', { class: 'text-sm font-medium text-foreground' }, authStore.user?.name || ''),
        h('p', { class: 'text-xs text-muted-foreground mt-0.5' }, authStore.user?.email || ''),
      ]),
  },
  { type: 'divider', key: 'd0' },
  {
    label: t('nav.profile'),
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(PersonOutline) }),
  },
  {
    label: t('nav.assets'),
    key: 'assets',
    icon: () => h(NIcon, null, { default: () => h(ImagesOutline) }),
  },
  { type: 'divider', key: 'd1' },
  {
    label: t('nav.logout'),
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  },
])

async function handleSelect(key: string) {
  if (key === 'user-info') return
  if (key === 'logout') {
    await authStore.signOut()
    router.push({ name: 'home', params: { locale: currentLocale.value } })
  } else {
    router.push({ name: key, params: { locale: currentLocale.value } })
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Credits display (not clickable) -->
    <span class="hidden items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 md:flex">
      {{ creditBalance }} {{ t('tools.credits') }}
    </span>

    <!-- Avatar dropdown -->
    <n-dropdown
      :options="menuOptions"
      trigger="click"
      @select="handleSelect"
    >
      <button class="flex cursor-pointer items-center rounded-full border-0 bg-transparent p-0.5 transition-colors hover:bg-accent">
        <n-avatar
          round
          :size="28"
          :src="authStore.user?.image ?? undefined"
        >
          <template v-if="!authStore.user?.image">
            {{ userInitial }}
          </template>
        </n-avatar>
      </button>
    </n-dropdown>
  </div>
</template>
