<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TaskProgress } from '@/composables/useTaskProgress'

const { t } = useI18n()

const props = defineProps<{
  progress: TaskProgress | null
}>()

/** All intermediate states map to "processing" for user-facing display */
const isActive = computed(() => {
  const s = props.progress?.status
  return s === 'connecting' || s === 'connected' || s === 'pending' || s === 'queued' || s === 'processing'
})

const statusColor = computed(() => {
  if (isActive.value) return 'text-blue-500'
  if (props.progress?.status === 'completed') return 'text-green-500'
  if (props.progress?.status === 'failed') return 'text-red-500'
  return 'text-muted-foreground'
})

const progressBarColor = computed(() => {
  if (isActive.value) return 'bg-primary'
  if (props.progress?.status === 'completed') return 'bg-green-500'
  if (props.progress?.status === 'failed') return 'bg-red-500'
  return 'bg-muted-foreground'
})

const statusLabel = computed(() => {
  if (isActive.value) return t('tools.progress.processing')
  if (props.progress?.status === 'completed') return t('tools.progress.completed')
  if (props.progress?.status === 'failed') return t('tools.progress.failed')
  return ''
})

/**
 * Resolve error string to a user-friendly localized message.
 * If the error matches a known error code (e.g. TASK_SERVICE_UNAVAILABLE),
 * look it up in the `errors.*` locale namespace. Otherwise show a generic fallback.
 */
const displayError = computed(() => {
  const raw = props.progress?.error
  if (!raw) return null
  const key = `errors.${raw}`
  const resolved = t(key)
  // vue-i18n returns the key itself when no translation exists
  if (resolved !== key) return resolved
  return t('errors.fallback')
})
</script>

<template>
  <div v-if="progress" class="rounded-xl border bg-card p-6 space-y-4">
    <!-- Status Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Spinning indicator for all active states -->
        <div v-if="isActive" class="h-5 w-5">
          <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
        </div>
        <!-- Check for completed -->
        <div v-else-if="progress.status === 'completed'" class="h-5 w-5 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <!-- X for failed -->
        <div v-else-if="progress.status === 'failed'" class="h-5 w-5 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </div>

        <span class="font-medium" :class="statusColor">{{ statusLabel }}</span>
      </div>
      <span class="text-sm tabular-nums text-muted-foreground">{{ progress.progress }}%</span>
    </div>

    <!-- Progress Bar -->
    <div class="h-2 rounded-full bg-muted overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500 ease-out"
        :class="progressBarColor"
        :style="{ width: `${progress.progress}%` }"
      />
    </div>

    <!-- Error Message -->
    <div v-if="displayError" class="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
      <p class="text-sm text-red-600 dark:text-red-400">{{ displayError }}</p>
    </div>
  </div>
</template>
