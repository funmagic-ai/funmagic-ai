<script setup lang="ts">
import { NIcon, NSpin, NEmpty, NButton } from 'naive-ui'
import {
  HourglassOutline,
  FlashOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TimeOutline,
  RefreshOutline,
} from '@vicons/ionicons5'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()

// Queue stats API may not exist - we'll handle gracefully
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['queue-stats'],
  queryFn: async () => {
    // Placeholder: the /api/admin/queue/stats endpoint may not exist
    // If it doesn't, we'll catch the error and show a placeholder
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/queue/stats`,
        { credentials: 'include' },
      )
      if (!response.ok) throw new Error('API not available')
      return await response.json() as {
        waiting: number
        active: number
        completed: number
        failed: number
        delayed: number
      }
    } catch {
      throw new Error('Queue API is not available')
    }
  },
  retry: false,
})

const stats = computed(() => [
  {
    label: t('queue.waiting'),
    value: data.value?.waiting ?? 0,
    icon: HourglassOutline,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
  {
    label: t('queue.active'),
    value: data.value?.active ?? 0,
    icon: FlashOutline,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    label: t('queue.completed'),
    value: data.value?.completed ?? 0,
    icon: CheckmarkCircleOutline,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    label: t('queue.failed'),
    value: data.value?.failed ?? 0,
    icon: CloseCircleOutline,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
  {
    label: t('queue.delayed'),
    value: data.value?.delayed ?? 0,
    icon: TimeOutline,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
])
</script>

<template>
  <div>
    <PageHeader :title="t('queue.title')" :description="t('queue.description')">
      <template #actions>
        <NButton :loading="isLoading" @click="() => refetch()">
          <template #icon>
            <NIcon><RefreshOutline /></NIcon>
          </template>
          {{ t('queue.refresh') }}
        </NButton>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <template v-else-if="isError">
      <n-card>
        <NEmpty :description="t('queue.notAvailable')" class="py-12">
          <template #extra>
            <p class="text-sm text-muted-foreground">
              {{ t('queue.notAvailableHint') }}
            </p>
          </template>
        </NEmpty>
      </n-card>

      <!-- Show placeholder stat cards -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <n-card v-for="stat in stats" :key="stat.label" size="small">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg" :class="stat.bg">
              <NIcon :size="24" :class="stat.color">
                <component :is="stat.icon" />
              </NIcon>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
              <p class="text-xl font-bold text-foreground">--</p>
            </div>
          </div>
        </n-card>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <n-card v-for="stat in stats" :key="stat.label" size="small">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg" :class="stat.bg">
              <NIcon :size="24" :class="stat.color">
                <component :is="stat.icon" />
              </NIcon>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
              <p class="text-xl font-bold text-foreground">{{ stat.value.toLocaleString() }}</p>
            </div>
          </div>
        </n-card>
      </div>
    </template>
  </div>
</template>
