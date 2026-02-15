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
  ChatbubblesOutline,
  WalletOutline,
  ImagesOutline,
  LayersOutline,
  ColorPaletteOutline,
  SpeedometerOutline,
  SettingsOutline,
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
    // Overview
    {
      type: 'group',
      label: t('nav.groups.overview'),
      key: 'overview-group',
      children: [
        {
          label: t('nav.dashboard'),
          key: 'dashboard',
          icon: renderIcon(HomeOutline),
        },
      ],
    },
    // Catalog
    {
      type: 'group',
      label: t('nav.groups.catalog'),
      key: 'catalog-group',
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
    // Providers
    {
      type: 'group',
      label: t('nav.groups.providers'),
      key: 'providers-group',
      children: [
        {
          label: t('nav.providers'),
          key: 'providers',
          icon: renderIcon(ServerOutline),
        },
      ],
    },
    // Operations
    {
      type: 'group',
      label: t('nav.groups.operations'),
      key: 'operations-group',
      children: [
        {
          label: t('nav.users'),
          key: 'users',
          icon: renderIcon(PeopleOutline),
        },
        {
          label: t('nav.taskHistory'),
          key: 'tasks',
          icon: renderIcon(ClipboardOutline),
        },
      ],
    },
    // Business
    {
      type: 'group',
      label: t('nav.groups.business'),
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
    // Creative Studio
    {
      type: 'group',
      label: t('nav.groups.creativeStudio'),
      key: 'creative-studio-group',
      children: [
        {
          label: t('nav.studio'),
          key: 'studio',
          icon: renderIcon(ColorPaletteOutline),
        },
        {
          label: t('nav.studioProjects'),
          key: 'studio-projects',
          icon: renderIcon(ChatbubblesOutline),
        },
        ...(authStore.isSuperAdmin
          ? [
              {
                label: t('nav.systemProviders'),
                key: 'admin-providers',
                icon: renderIcon(ShieldCheckmarkOutline),
              },
            ]
          : []),
      ],
    },
    // System
    {
      type: 'group',
      label: t('nav.groups.system'),
      key: 'system-group',
      children: [
        {
          label: t('nav.queue'),
          key: 'queue',
          icon: renderIcon(LayersOutline),
        },
        {
          label: t('nav.rateLimits'),
          key: 'settings-rate-limits',
          icon: renderIcon(SettingsOutline),
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
  if (name.startsWith('studio-projects')) return 'studio-projects'
  if (name.startsWith('studio')) return 'studio'
  if (name.startsWith('tools')) return 'tools'
  if (name.startsWith('providers')) return 'providers'
  if (name.startsWith('users')) return 'users'
  if (name.startsWith('tasks')) return 'tasks'
  if (name === 'queue') return 'queue'
  if (name.startsWith('settings')) return 'settings-rate-limits'
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
  'studio-projects': '/dashboard/studio/projects',
  packages: '/dashboard/billing/packages',
  banners: '/dashboard/content/banners',
  queue: '/dashboard/queue',
  studio: '/dashboard/studio',
  'settings-rate-limits': '/dashboard/settings/rate-limits',
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
    class="flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 motion-reduce:transition-none overflow-hidden"
    :class="appStore.sidebarCollapsed ? 'w-0 border-r-0' : 'w-64'"
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
    <div class="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden py-2">
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

/* Theme-aware scrollbar */
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--sidebar-border) transparent;
}

.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background-color: var(--sidebar-border);
  border-radius: 4px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--muted-foreground);
}
</style>
