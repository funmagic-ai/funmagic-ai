<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import type { SupportedLocale } from '@/lib/i18n'
import { useUpload } from '@/composables/useUpload'
import { useTaskProgress } from '@/composables/useTaskProgress'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import ImagePicker from '@/components/upload/ImagePicker.vue'
import StepIndicator from '@/components/tools/StepIndicator.vue'
import ToolBreadcrumb from '@/components/tools/ToolBreadcrumb.vue'
import TaskProgressDisplay from '@/components/tools/TaskProgressDisplay.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const route = useRoute()
const locale = computed(() => (route.params.locale as string) || 'en')

const upload = useUpload({ module: 'background-remove' })
const currentStep = ref(0)
const taskId = ref<string | null>(null)
const resultUrl = ref<string | null>(null)

// Fetch tool config from API
const { data: toolData, isError: toolError, error: toolErrorData } = useQuery({
  queryKey: ['tool', 'background-remove', locale],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/tools/{slug}', {
      params: { path: { slug: 'background-remove' }, query: { locale: locale.value as SupportedLocale } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
})

const toolInfo = computed(() => toolData.value?.tool)
const toolTitle = computed(() => toolInfo.value?.title ?? 'Background Remover')
const toolDescription = computed(() => toolInfo.value?.description ?? '')
const toolConfig = computed(() => (toolInfo.value?.config ?? { steps: [] }) as { steps: Array<{ id: string; name?: string; cost?: number; [key: string]: unknown }> })
const firstStep = computed(() => toolConfig.value.steps[0])
const totalCost = computed(() => toolConfig.value.steps.reduce((sum, s) => sum + (s.cost ?? 0), 0))

const steps = computed(() => [
  { id: 'upload', label: t('tools.uploadImage') },
  { id: 'processing', label: firstStep.value?.name ?? t('tools.processing') },
  { id: 'result', label: t('tools.result') },
])

const { progress, isFailed } = useTaskProgress(
  taskId,
  {
    onComplete: async (output: unknown) => {
      // Null out task ID to prevent reconnect from firing onComplete again
      taskId.value = null
      currentStep.value = 2
      const out = output as Record<string, string>
      if (out?.assetId) {
        const { data } = await api.GET('/api/assets/{id}/url', {
          params: { path: { id: out.assetId } },
        })
        resultUrl.value = data?.url ?? null
      }
    },
    onFailed: () => {
      // Stay on processing step but show error
    },
  },
)

const submitMutation = useMutation({
  mutationFn: async () => {
    // Upload file
    const uploadResult = await upload.uploadOnSubmit()
    if (!uploadResult) throw new Error(upload.error.value ?? 'Upload failed')

    // Create task
    const { data, error, response } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'background-remove',
        stepId: firstStep.value?.id ?? 'remove-bg',
        input: { imageStorageKey: uploadResult.storageKey },
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: (data) => {
    taskId.value = data.task.id
    currentStep.value = 1
  },
})

function handleFileSelect(file: File | null) {
  upload.setFile(file)
}

function handleSubmit() {
  submitMutation.mutate()
}

function handleRetry() {
  currentStep.value = 0
  taskId.value = null
  resultUrl.value = null
}

function handleReset() {
  upload.reset()
  currentStep.value = 0
  taskId.value = null
  resultUrl.value = null
}
</script>

<template>
  <AppLayout>
    <main class="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="space-y-8">
        <!-- Breadcrumb -->
        <ToolBreadcrumb :tool-name="toolTitle" />

        <!-- Header -->
        <div class="space-y-2">
          <h1 class="text-3xl sm:text-4xl font-bold">{{ toolTitle }}</h1>
          <p class="text-muted-foreground">{{ toolDescription }}</p>
        </div>

        <!-- Error State -->
        <div v-if="toolError" class="flex flex-col items-center justify-center py-20">
          <p class="text-lg text-muted-foreground mb-4">{{ toolErrorData?.message ?? t('common.error') }}</p>
          <n-button type="primary" @click="$router.push({ name: 'tools', params: { locale } })">{{ t('common.back') }}</n-button>
        </div>

        <!-- Auth Gate -->
        <div v-else-if="!authStore.isAuthenticated" class="rounded-xl border bg-card p-8 text-center space-y-4">
          <p class="text-muted-foreground">{{ t('tools.signInRequired') }}</p>
          <n-button type="primary" @click="$router.push({ name: 'login', params: { locale } })">
            {{ t('auth.signIn') }}
          </n-button>
        </div>

        <template v-else>
          <!-- Step Indicator -->
          <StepIndicator :steps="steps" :current-step="currentStep" />

          <!-- Step 0: Upload -->
          <div v-if="currentStep === 0" class="space-y-6">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <ImagePicker
                :preview="upload.preview.value"
                :disabled="submitMutation.isPending.value || upload.isUploading.value"
                @file-select="handleFileSelect"
              />
            </div>
            <n-button
              type="primary"
              size="large"
              block
              :disabled="!upload.pendingFile.value"
              :loading="submitMutation.isPending.value || upload.isUploading.value"
              @click="handleSubmit"
            >
              {{ t('tools.startProcessing') }}
              <template v-if="totalCost > 0">
                &nbsp;· {{ totalCost }} {{ t('tools.credits') }}
              </template>
            </n-button>
          </div>

          <!-- Step 1: Processing -->
          <div v-if="currentStep === 1">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <TaskProgressDisplay :progress="progress" />
              <div v-if="isFailed" class="flex justify-center mt-4 gap-3">
                <n-button @click="handleRetry">
                  {{ t('common.retry') }}
                </n-button>
                <n-button @click="handleReset">
                  {{ t('tools.processAnother') }}
                </n-button>
              </div>
            </div>
          </div>

          <!-- Step 2: Result -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Original -->
                <div class="space-y-2">
                  <p class="text-sm font-medium text-muted-foreground">{{ t('tools.original') }}</p>
                  <div class="rounded-lg border overflow-hidden bg-muted">
                    <img
                      v-if="upload.preview.value"
                      :src="upload.preview.value"
                      :alt="t('tools.original')"
                      class="w-full object-contain"
                    />
                  </div>
                </div>
                <!-- Result -->
                <div class="space-y-2">
                  <p class="text-sm font-medium text-muted-foreground">{{ t('tools.result') }}</p>
                  <div class="rounded-lg border overflow-hidden bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZGRkIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNkZGQiLz48L3N2Zz4=')]">
                    <img
                      v-if="resultUrl"
                      :src="resultUrl"
                      :alt="t('tools.result')"
                      class="w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-center gap-3">
              <n-button v-if="resultUrl" tag="a" :href="resultUrl" download type="primary">
                {{ t('tools.download') }}
              </n-button>
              <n-button @click="handleReset">
                {{ t('tools.processAnother') }}
              </n-button>
            </div>
          </div>
        </template>
      </div>
    </main>
  </AppLayout>
</template>
