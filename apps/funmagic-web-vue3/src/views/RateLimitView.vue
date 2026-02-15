<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { TimerOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const isReady = computed(() => secondsLeft.value <= 0)

onMounted(() => {
  const retry = Number(route.query.retry)
  secondsLeft.value = !Number.isNaN(retry) && retry > 0 ? retry : 60

  timer = setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value--
    } else if (timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

function goBack() {
  router.back()
}
</script>

<template>
  <AppLayout>
    <div class="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 py-16">
      <div class="text-center">
        <div class="mb-6 flex justify-center">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive"
          >
            <NIcon :size="32">
              <TimerOutline />
            </NIcon>
          </div>
        </div>

        <h1 class="mb-2 text-2xl font-bold text-foreground">
          {{ t('rateLimit.title') }}
        </h1>
        <p class="mb-6 max-w-md mx-auto text-muted-foreground">
          {{ t('rateLimit.description') }}
        </p>

        <p v-if="!isReady" class="mb-8 text-lg font-medium text-foreground">
          {{ t('rateLimit.countdown', { seconds: secondsLeft }) }}
        </p>
        <p v-else class="mb-8 text-lg font-medium text-primary">
          {{ t('rateLimit.ready') }}
        </p>

        <NButton v-if="isReady" type="primary" size="large" @click="goBack">
          {{ t('rateLimit.goBack') }}
        </NButton>
      </div>
    </div>
  </AppLayout>
</template>
