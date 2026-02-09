<script setup lang="ts">
import AdminSidebar from '@/components/layout/AdminSidebar.vue'
import AdminHeader from '@/components/layout/AdminHeader.vue'
import { useAppStore } from '@/stores/app'
import { useMediaQuery } from '@vueuse/core'

const appStore = useAppStore()
const route = useRoute()

const isMobile = useMediaQuery('(max-width: 767px)')
const mobileOpen = ref(false)

// Close mobile overlay when navigating
watch(
  () => route.path,
  () => {
    if (isMobile.value) {
      mobileOpen.value = false
    }
  },
)

// Provide toggle function so AdminHeader can call it
function toggleSidebar() {
  if (isMobile.value) {
    mobileOpen.value = !mobileOpen.value
  } else {
    appStore.toggleSidebar()
  }
}

provide('toggleSidebar', toggleSidebar)
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-background">
    <!-- Desktop Sidebar -->
    <div class="hidden md:flex shrink-0">
      <AdminSidebar />
    </div>

    <!-- Mobile Sidebar Overlay -->
    <Teleport to="body">
      <Transition name="overlay">
        <div
          v-if="mobileOpen && isMobile"
          class="fixed inset-0 z-40 bg-black/50 md:hidden"
          @click="mobileOpen = false"
        />
      </Transition>
      <Transition name="slide">
        <div
          v-if="mobileOpen && isMobile"
          class="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
        >
          <AdminSidebar />
        </div>
      </Transition>
    </Teleport>

    <!-- Main Content Area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <AdminHeader />
      <main class="flex-1 overflow-y-auto px-4 pb-4 pt-4 md:px-8 md:pb-8 md:pt-6">
        <div class="mx-auto max-w-7xl">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Overlay fade */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Sidebar slide */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
