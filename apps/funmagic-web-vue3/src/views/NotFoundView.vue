<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
const router = useRouter()

function goHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <AppLayout>
    <div class="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-16">
      <div class="text-center">
        <h1 class="text-8xl font-extrabold text-primary/20">404</h1>
        <h2 class="mt-4 text-2xl font-bold text-foreground">{{ t('notFound.title') }}</h2>
        <p class="mt-3 text-muted-foreground max-w-md mx-auto">
          {{ t('notFound.description') }}
        </p>
        <div class="mt-8">
          <n-button type="primary" size="large" @click="goHome">
            {{ t('notFound.goHome') }}
          </n-button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
