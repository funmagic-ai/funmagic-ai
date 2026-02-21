<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppLogo from './AppLogo.vue'
import AppWordmark from './AppWordmark.vue'
import LocaleSwitcher from './LocaleSwitcher.vue'
import UserMenu from './UserMenu.vue'
import {
  SunnyOutline,
  MoonOutline,
  MenuOutline,
  CloseOutline,
} from '@vicons/ionicons5'
import ThemeSwitcher from './ThemeSwitcher.vue'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const appStore = useAppStore()

const mobileMenuOpen = ref(false)

const currentLocale = computed(() => (route.params.locale as string) || 'en')

interface NavLink {
  name: string
  labelKey: string
  /** Path prefix for active matching (e.g., '/tools' matches '/tools/crystal-memory') */
  pathPrefix: string
}

const navLinks: NavLink[] = [
  { name: 'home', labelKey: 'nav.home', pathPrefix: '' },
  { name: 'tools', labelKey: 'nav.tools', pathPrefix: '/tools' },
  { name: 'pricing', labelKey: 'nav.pricing', pathPrefix: '/pricing' },
]

/** Strip locale prefix from path to get the clean path for comparison */
function stripLocale(path: string): string {
  const segments = path.split('/').filter(Boolean)
  // If first segment looks like a locale (2-char), strip it
  if (segments.length > 0 && /^[a-z]{2}$/.test(segments[0])) {
    return '/' + segments.slice(1).join('/')
  }
  return '/' + segments.join('/')
}

function isNavActive(link: NavLink): boolean {
  const cleanPath = stripLocale(route.path)
  if (link.pathPrefix === '') {
    // Home: only active on exact root
    return cleanPath === '/' || cleanPath === ''
  }
  return cleanPath === link.pathPrefix || cleanPath.startsWith(link.pathPrefix + '/')
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}

// Close mobile menu on route change
watch(() => route.fullPath, () => {
  mobileMenuOpen.value = false
})
</script>

<template>
  <n-layout-header bordered class="sticky top-0 z-50 bg-background/80 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- Left: Logo + Navigation -->
      <div class="flex items-center gap-1">
        <router-link
          :to="{ name: 'home', params: { locale: currentLocale } }"
          class="flex items-center gap-2 no-underline mr-4"
        >
          <AppLogo />
          <AppWordmark class="hidden sm:inline-block" />
        </router-link>

        <!-- Desktop Navigation -->
        <nav class="hidden items-center gap-1 md:flex">
          <router-link
            v-for="link in navLinks"
            :key="link.name"
            :to="{ name: link.name, params: { locale: currentLocale } }"
            class="rounded-lg px-4 py-2 text-sm font-medium no-underline transition-colors"
            :class="isNavActive(link) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-accent hover:text-foreground'"
          >
            {{ t(link.labelKey) }}
          </router-link>
        </nav>
      </div>

      <!-- Right Side Actions -->
      <div class="flex items-center gap-1">
        <!-- Locale Switcher -->
        <LocaleSwitcher />

        <!-- Theme Switcher -->
        <ThemeSwitcher />

        <!-- Dark Mode Toggle -->
        <n-button quaternary circle :aria-label="appStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'" @click="appStore.toggleDark">
          <template #icon>
            <n-icon :size="20">
              <MoonOutline v-if="!appStore.isDark" />
              <SunnyOutline v-else />
            </n-icon>
          </template>
        </n-button>

        <!-- Auth Section (Desktop) -->
        <div class="hidden items-center gap-2 md:flex">
          <template v-if="authStore.isAuthenticated">
            <UserMenu />
          </template>
          <template v-else>
            <router-link
              :to="{ name: 'login', params: { locale: currentLocale } }"
              class="no-underline"
            >
              <n-button quaternary size="small">
                {{ t('nav.login') }}
              </n-button>
            </router-link>
            <router-link
              :to="{ name: 'register', params: { locale: currentLocale } }"
              class="no-underline"
            >
              <n-button type="primary" size="small">
                {{ t('nav.register') }}
              </n-button>
            </router-link>
          </template>
        </div>

        <!-- Mobile Hamburger -->
        <div class="md:hidden">
          <n-button
            quaternary
            circle
            :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
            @click="mobileMenuOpen = !mobileMenuOpen"
          >
            <template #icon>
              <n-icon :size="22">
                <CloseOutline v-if="mobileMenuOpen" />
                <MenuOutline v-else />
              </n-icon>
            </template>
          </n-button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-96 opacity-100"
      leave-active-class="transition-all duration-150 ease-in motion-reduce:transition-none"
      leave-from-class="max-h-96 opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="overflow-hidden border-t border-border md:hidden"
      >
        <nav class="flex flex-col gap-1 px-4 py-3">
          <router-link
            v-for="link in navLinks"
            :key="link.name"
            :to="{ name: link.name, params: { locale: currentLocale } }"
            class="rounded-lg px-4 py-2.5 text-sm font-medium no-underline transition-colors"
            :class="isNavActive(link) ? 'bg-primary/10 text-primary' : 'text-foreground/70 hover:bg-accent hover:text-foreground'"
            @click="closeMobileMenu"
          >
            {{ t(link.labelKey) }}
          </router-link>

          <!-- Mobile Auth -->
          <div class="mt-2 border-t border-border pt-3">
            <template v-if="authStore.isAuthenticated">
              <div class="mb-2 flex items-center gap-3 px-4">
                <n-avatar
                  round
                  :size="28"
                  :src="authStore.user?.image ?? undefined"
                  :img-props="{ referrerpolicy: 'no-referrer' }"
                >
                  {{ authStore.user?.name?.charAt(0)?.toUpperCase() ?? '?' }}
                </n-avatar>
                <span class="text-sm font-medium">{{ authStore.user?.name }}</span>
              </div>
              <router-link
                :to="{ name: 'profile', params: { locale: currentLocale } }"
                class="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/70 no-underline transition-colors hover:bg-accent"
                @click="closeMobileMenu"
              >
                {{ t('nav.profile') }}
              </router-link>
              <router-link
                :to="{ name: 'assets', params: { locale: currentLocale } }"
                class="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground/70 no-underline transition-colors hover:bg-accent"
                @click="closeMobileMenu"
              >
                {{ t('nav.assets') }}
              </router-link>
              <button
                class="w-full cursor-pointer rounded-lg border-0 bg-transparent px-4 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-accent"
                @click="async () => { await authStore.signOut(); closeMobileMenu() }"
              >
                {{ t('nav.logout') }}
              </button>
            </template>
            <template v-else>
              <div class="flex gap-2 px-4">
                <router-link
                  :to="{ name: 'login', params: { locale: currentLocale } }"
                  class="flex-1 no-underline"
                  @click="closeMobileMenu"
                >
                  <n-button block>
                    {{ t('nav.login') }}
                  </n-button>
                </router-link>
                <router-link
                  :to="{ name: 'register', params: { locale: currentLocale } }"
                  class="flex-1 no-underline"
                  @click="closeMobileMenu"
                >
                  <n-button type="primary" block>
                    {{ t('nav.register') }}
                  </n-button>
                </router-link>
              </div>
            </template>
          </div>
        </nav>
      </div>
    </Transition>
  </n-layout-header>
</template>
