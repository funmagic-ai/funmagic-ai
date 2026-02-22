<script setup lang="ts">
import { useToolBase } from '@/composables/useToolBase'
import { useTaskProgress } from '@/composables/useTaskProgress'
import AppLayout from '@/components/layout/AppLayout.vue'
import ImagePicker from '@/components/upload/ImagePicker.vue'
import StepIndicator from '@/components/tools/StepIndicator.vue'
import ToolBreadcrumb from '@/components/tools/ToolBreadcrumb.vue'
import TaskProgressDisplay from '@/components/tools/TaskProgressDisplay.vue'

const {
  t, locale, authStore, upload,
  toolTitle, toolDescription, toolError, toolErrorData, toolData, totalCost,
  currentStep, originalPreview, restored,
  restoreTaskId, fetchRestoreData, fetchSourceImage,
  getStep, createSubmitMutation, fetchAssetUrl, handleFileSelect, resetBase,
} = useToolBase('background-remove', { defaultTitle: 'Background Remover' })

const taskId = ref<string | null>(null)
const resultUrl = ref<string | null>(null)
const firstStep = getStep(0)

const steps = computed(() => [
  { id: 'upload', label: t('tools.uploadImage') },
  { id: 'processing', label: firstStep.value?.name ?? t('tools.processing') },
  { id: 'result', label: t('tools.result') },
])

const { progress, isFailed } = useTaskProgress(
  taskId,
  {
    onComplete: async (output: unknown) => {
      taskId.value = null
      currentStep.value = 2
      const out = output as Record<string, string>
      if (out?.assetId) {
        resultUrl.value = await fetchAssetUrl(out.assetId)
      }
    },
    onFailed: () => {},
  },
)

const submitMutation = createSubmitMutation({
  stepId: computed(() => firstStep.value?.id ?? 'remove-bg'),
  buildInput: (uploadResult) => ({
    imageStorageKey: uploadResult.storageKey,
    sourceAssetId: uploadResult.assetId,
  }),
  onSuccess: (id) => {
    taskId.value = id
    currentStep.value = 1
  },
})

// Restore task state from URL query param
watch([restoreTaskId, toolData], async ([taskIdParam, tool]) => {
  if (!taskIdParam || !tool || restored.value) return
  restored.value = true
  const data = await fetchRestoreData()
  if (!data) return

  const task = data.task
  const input = task.payload?.input as Record<string, string> | null
  const output = task.payload?.output as Record<string, string> | null

  if (input?.sourceAssetId) fetchSourceImage(input.sourceAssetId)

  if (task.status === 'completed') {
    currentStep.value = 2
    if (output?.assetId) {
      resultUrl.value = await fetchAssetUrl(output.assetId)
    }
  } else if (task.status === 'failed' || task.status === 'pending' || task.status === 'queued' || task.status === 'processing') {
    currentStep.value = 1
    taskId.value = task.id
  }
}, { immediate: true })

function handleRetry() {
  currentStep.value = 0
  taskId.value = null
  resultUrl.value = null
}

function handleReset() {
  resetBase()
  taskId.value = null
  resultUrl.value = null
}
</script>

<template>
  <AppLayout>
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="space-y-8">
        <!-- Breadcrumb -->
        <ToolBreadcrumb :tool-name="toolTitle" />

        <!-- Header -->
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-4">
            <h1 class="text-3xl sm:text-4xl font-bold">{{ toolTitle }}</h1>
            <span v-if="totalCost > 0" class="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {{ t('tools.totalCredits', { n: totalCost }) }}
            </span>
          </div>
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
              @click="submitMutation.mutate()"
            >
              {{ t('tools.startProcessing') }}
              <template v-if="totalCost > 0">
                &nbsp;· {{ totalCost }} {{ t('tools.credits') }}
              </template>
            </n-button>
            <n-alert v-if="submitMutation.error.value" type="error" :bordered="false">
              {{ submitMutation.error.value.message }}
            </n-alert>
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
                      v-if="originalPreview"
                      :src="originalPreview"
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
