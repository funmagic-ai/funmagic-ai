<script setup lang="ts">
import { NButton, NIcon, NResult } from 'naive-ui'
import { RefreshOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

withDefaults(defineProps<{
  fallbackTitle?: string
  fallbackDescription?: string
}>(), {
  fallbackTitle: undefined,
  fallbackDescription: undefined,
})

const error = ref<Error | null>(null)
const errorInfo = ref('')

onErrorCaptured((err: Error, _instance, info) => {
  error.value = err
  errorInfo.value = info
  console.error('[ErrorBoundary]', info, err)
  return false
})

function handleRetry() {
  error.value = null
  errorInfo.value = ''
}

const isDev = import.meta.env.DEV
</script>

<template>
  <slot v-if="!error" />
  <div v-else class="flex items-center justify-center py-16">
    <NResult
      status="error"
      :title="fallbackTitle ?? t('errors.INTERNAL_ERROR')"
      :description="fallbackDescription ?? t('errors.fallback')"
    >
      <template #footer>
        <div class="space-y-4">
          <NButton type="primary" @click="handleRetry">
            <template #icon>
              <NIcon><RefreshOutline /></NIcon>
            </template>
            {{ t('common.retry') }}
          </NButton>
          <details v-if="isDev && error" class="mt-4 text-left text-sm">
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
