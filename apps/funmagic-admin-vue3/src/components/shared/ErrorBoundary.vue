<script setup lang="ts">
import { NButton, NIcon, NResult } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'

withDefaults(defineProps<{
  fallbackTitle?: string
  fallbackDescription?: string
}>(), {
  fallbackTitle: 'Something went wrong',
  fallbackDescription: 'An unexpected error occurred. Please try again.',
})

const error = ref<Error | null>(null)
const errorInfo = ref('')

onErrorCaptured((err: Error, _instance, info) => {
  error.value = err
  errorInfo.value = info
  console.error('[ErrorBoundary]', info, err)
  // Returning false prevents the error from propagating further
  return false
})

function handleRetry() {
  error.value = null
  errorInfo.value = ''
}
</script>

<template>
  <slot v-if="!error" />
  <div v-else class="flex items-center justify-center py-16">
    <NResult status="error" :title="fallbackTitle" :description="fallbackDescription">
      <template #footer>
        <div class="space-y-4">
          <NButton type="primary" @click="handleRetry">
            <template #icon>
              <NIcon><RefreshOutline /></NIcon>
            </template>
            Try Again
          </NButton>
          <details v-if="error" class="mt-4 text-left text-sm">
            <summary class="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Error Details
            </summary>
            <pre class="mt-2 max-h-48 overflow-auto rounded bg-gray-100 p-3 text-xs dark:bg-gray-800">{{ error.message }}

{{ error.stack }}</pre>
          </details>
        </div>
      </template>
    </NResult>
  </div>
</template>
