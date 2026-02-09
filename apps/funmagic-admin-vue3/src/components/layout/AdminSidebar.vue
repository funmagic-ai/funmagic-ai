<script setup lang="ts">
import { NMenu, NIcon } from 'naive-ui'
import type { MenuOption, MenuGroupOption } from 'naive-ui'
import {
  HomeOutline,
  BuildOutline,
  ListOutline,
  ServerOutline,
  ShieldCheckmarkOutline,
  PeopleOutline,
  ClipboardOutline,
  DocumentTextOutline,
  WalletOutline,
  ImagesOutline,
  LayersOutline,
  ChatboxOutline,
  SpeedometerOutline,
} from '@vicons/ionicons5'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const appStore = useAppStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed<(MenuOption | MenuGroupOption)[]>(() => {
  const items: (MenuOption | MenuGroupOption)[] = [
    // Main
    {
      type: 'group',
      label: 'Main',
      key: 'main-group',
      children: [
        {
          label: t('nav.dashboard'),
          key: 'dashboard',
          icon: renderIcon(HomeOutline),
        },
      ],
    },
    // Content
    {
      type: 'group',
      label: 'Content',
      key: 'content-group',
      children: [
        {
          label: t('nav.tools'),
          key: 'tools',
          icon: renderIcon(BuildOutline),
        },
        {
          label: t('nav.toolTypes'),
          key: 'tool-types',
          icon: renderIcon(ListOutline),
        },
      ],
    },
    // Infrastructure
    {
      type: 'group',
      label: 'Infrastructure',
      key: 'infra-group',
      children: [
        {
          label: t('nav.providers'),
          key: 'providers',
          icon: renderIcon(ServerOutline),
        },
        ...(authStore.isSuperAdmin
          ? [
              {
                label: t('nav.adminProviders'),
                key: 'admin-providers',
                icon: renderIcon(ShieldCheckmarkOutline),
              },
            ]
          : []),
      ],
    },
    // Users & Tasks
    {
      type: 'group',
      label: 'Users & Tasks',
      key: 'users-tasks-group',
      children: [
        {
          label: t('nav.users'),
          key: 'users',
          icon: renderIcon(PeopleOutline),
        },
        {
          label: t('nav.tasks'),
          key: 'tasks',
          icon: renderIcon(ClipboardOutline),
        },
        {
          label: t('nav.aiTasks'),
          key: 'ai-tasks',
          icon: renderIcon(DocumentTextOutline),
        },
      ],
    },
    // Business
    {
      type: 'group',
      label: 'Business',
      key: 'business-group',
      children: [
        {
          label: t('nav.packages'),
          key: 'packages',
          icon: renderIcon(WalletOutline),
        },
        {
          label: t('nav.banners'),
          key: 'banners',
          icon: renderIcon(ImagesOutline),
        },
      ],
    },
    // System
    {
      type: 'group',
      label: 'System',
      key: 'system-group',
      children: [
        {
          label: t('nav.queue'),
          key: 'queue',
          icon: renderIcon(LayersOutline),
        },
        {
          label: t('nav.aiStudio'),
          key: 'ai-studio',
          icon: renderIcon(ChatboxOutline),
        },
      ],
    },
  ]
  return items
})

const activeKey = computed(() => {
  const name = route.name as string | undefined
  if (!name) return 'dashboard'
  // Map route names to menu keys
  if (name.startsWith('packages') || name === 'packages') return 'packages'
  if (name.startsWith('banners') || name === 'banners') return 'banners'
  if (name.startsWith('tool-types')) return 'tool-types'
  if (name.startsWith('admin-providers')) return 'admin-providers'
  if (name.startsWith('ai-tasks')) return 'ai-tasks'
  if (name.startsWith('ai-studio')) return 'ai-studio'
  if (name.startsWith('tools')) return 'tools'
  if (name.startsWith('providers')) return 'providers'
  if (name.startsWith('users')) return 'users'
  if (name.startsWith('tasks')) return 'tasks'
  if (name === 'queue') return 'queue'
  return 'dashboard'
})

const ROUTE_MAP: Record<string, string> = {
  dashboard: '/dashboard',
  tools: '/dashboard/tools',
  'tool-types': '/dashboard/tool-types',
  providers: '/dashboard/providers',
  'admin-providers': '/dashboard/admin-providers',
  users: '/dashboard/users',
  tasks: '/dashboard/tasks',
  'ai-tasks': '/dashboard/ai-tasks',
  packages: '/dashboard/billing/packages',
  banners: '/dashboard/content/banners',
  queue: '/dashboard/queue',
  'ai-studio': '/dashboard/ai-studio',
}

function handleUpdateValue(key: string) {
  const path = ROUTE_MAP[key]
  if (path) {
    router.push(path)
  }
}
</script>

<template>
  <aside
    class="flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200"
    :class="appStore.sidebarCollapsed ? 'w-16' : 'w-64'"
  >
    <!-- Logo / Brand -->
    <div class="flex h-16 items-center border-b border-sidebar-border px-4">
      <NIcon :size="24" class="text-primary shrink-0">
        <SpeedometerOutline />
      </NIcon>
      <Transition name="fade">
        <span
          v-if="!appStore.sidebarCollapsed"
          class="ml-2.5 text-base font-bold text-sidebar-foreground whitespace-nowrap"
        >
          {{ t('common.appName') }}
        </span>
      </Transition>
    </div>

    <!-- Navigation Menu -->
    <div class="flex-1 overflow-y-auto overflow-x-hidden py-2">
      <NMenu
        :value="activeKey"
        :collapsed="appStore.sidebarCollapsed"
        :collapsed-width="64"
        :collapsed-icon-size="20"
        :options="menuOptions"
        :indent="20"
        @update:value="handleUpdateValue"
      />
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
