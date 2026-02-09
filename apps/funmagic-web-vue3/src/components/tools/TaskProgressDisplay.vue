<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TaskProgress } from '@/composables/useTaskProgress'

const { t } = useI18n()

const props = defineProps<{
  progress: TaskProgress | null
}>()

const friendlyMessages: Record<string, string> = {
  // Background removal step
  'Preparing image': 'Preparing your image...',
  'Uploading to processing server': 'Processing your image...',
  'Starting background removal': 'Removing background...',
  'Processing background removal...': 'Removing background...',
  'Processing...': 'Working on it...',
  'Saving result': 'Almost done...',
  'Complete': 'Done!',
  // VGGT step
  'Preparing image for VGGT': 'Preparing for 3D generation...',
  'Initializing Replicate client': 'Initializing 3D engine...',
  'Calling VGGT API': 'Generating 3D point cloud...',
  'Processing VGGT output': 'Processing 3D data...',
  'Processing point cloud data': 'Building point cloud...',
  'Extracting colors': 'Extracting colors...',
  'Generating output': 'Finalizing...',
}

const friendlySteps: Record<string, string> = {
  'Remove Background': 'Removing Background',
  'Generate Point Cloud': 'Creating 3D Model',
}

const displayMessage = computed(() => {
  const raw = props.progress?.message
  if (!raw) return null
  return friendlyMessages[raw] ?? raw
})

const displayStep = computed(() => {
  const raw = props.progress?.currentStep
  if (!raw) return null
  return friendlySteps[raw] ?? raw
})

const statusColor = computed(() => {
  switch (props.progress?.status) {
    case 'processing': return 'text-blue-500'
    case 'completed': return 'text-green-500'
    case 'failed': return 'text-red-500'
    default: return 'text-muted-foreground'
  }
})

const progressBarColor = computed(() => {
  switch (props.progress?.status) {
    case 'processing': return 'bg-primary'
    case 'completed': return 'bg-green-500'
    case 'failed': return 'bg-red-500'
    default: return 'bg-muted-foreground'
  }
})

const statusLabel = computed(() => {
  switch (props.progress?.status) {
    case 'connecting': return t('tools.progress.connecting')
    case 'connected': return t('tools.progress.connected')
    case 'pending': return t('tools.progress.pending')
    case 'queued': return t('tools.progress.queued')
    case 'processing': return t('tools.progress.processing')
    case 'completed': return t('tools.progress.completed')
    case 'failed': return t('tools.progress.failed')
    default: return ''
  }
})
</script>

<template>
  <div v-if="progress" class="rounded-xl border bg-card p-6 space-y-4">
    <!-- Status Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Spinning indicator for processing -->
        <div v-if="progress.status === 'processing' || progress.status === 'connecting'" class="h-5 w-5">
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

    <!-- Current Step & Message -->
    <div v-if="displayStep || displayMessage" class="space-y-1">
      <p v-if="displayStep" class="text-sm font-medium text-muted-foreground">
        {{ displayStep }}
      </p>
      <p v-if="displayMessage" class="text-xs text-muted-foreground">
        {{ displayMessage }}
      </p>
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
    <div v-if="progress.error" class="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
      <p class="text-sm text-red-600 dark:text-red-400">{{ progress.error }}</p>
    </div>
  </div>
</template>
