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
  getStep, availableStyles, createSubmitMutation, fetchAssetUrl, handleFileSelect, resetBase,
} = useToolBase('vintage-trace', { defaultTitle: 'Vintage Trace' })

const taskId = ref<string | null>(null)
const imageResult = ref<string | null>(null)
const imageAssetId = ref<string | null>(null)
const selectedStyle = ref<string | null>(null)
const step0 = getStep(0)

const steps = computed(() => [
  { id: 'style-upload', label: t('tools.selectStyle') },
  { id: 'generating-image', label: step0.value?.name ?? t('tools.generateImage') },
  { id: 'image-result', label: t('tools.result') },
])

const { progress: imageProgress, isFailed: imageFailed } = useTaskProgress(
  taskId,
  {
    onComplete: async (output: unknown) => {
      currentStep.value = 2
      const out = output as Record<string, string>
      imageAssetId.value = out?.assetId ?? null
      if (out?.assetId) {
        imageResult.value = await fetchAssetUrl(out.assetId)
      }
    },
  },
)

const submitMutation = createSubmitMutation({
  stepId: computed(() => step0.value?.id ?? 'image-gen'),
  buildInput: (uploadResult) => ({
    imageStorageKey: uploadResult.storageKey,
    sourceAssetId: uploadResult.assetId,
    styleReferenceId: selectedStyle.value,
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

  if (task.status === 'pending' || task.status === 'queued' || task.status === 'processing' || task.status === 'failed') {
    currentStep.value = 1
    taskId.value = task.id
  } else if (task.status === 'completed') {
    if (output?.assetId) {
      imageResult.value = await fetchAssetUrl(output.assetId)
      imageAssetId.value = output.assetId
    }
    currentStep.value = 2
    taskId.value = task.id
  }
}, { immediate: true })

function handleReset() {
  resetBase()
  taskId.value = null
  imageResult.value = null
  imageAssetId.value = null
  selectedStyle.value = null
}
</script>

<template>
  <AppLayout>
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="space-y-8">
        <ToolBreadcrumb :tool-name="toolTitle" />

        <div class="space-y-2">
          <div class="flex items-center justify-between gap-4">
            <h1 class="text-3xl sm:text-4xl font-bold">{{ toolTitle }}</h1>
            <span v-if="totalCost > 0" class="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              {{ t('tools.totalCredits', { n: totalCost }) }}
            </span>
          </div>
          <p class="text-muted-foreground">{{ toolDescription }}</p>
        </div>

        <div v-if="toolError" class="flex flex-col items-center justify-center py-20">
          <p class="text-lg text-muted-foreground mb-4">{{ toolErrorData?.message ?? t('common.error') }}</p>
          <n-button type="primary" @click="$router.push({ name: 'tools', params: { locale } })">{{ t('common.back') }}</n-button>
        </div>

        <div v-else-if="!authStore.isAuthenticated" class="rounded-xl border bg-card p-8 text-center space-y-4">
          <p class="text-muted-foreground">{{ t('tools.signInRequired') }}</p>
          <n-button type="primary" @click="$router.push({ name: 'login', params: { locale } })">
            {{ t('auth.signIn') }}
          </n-button>
        </div>

        <template v-else>
          <StepIndicator :steps="steps" :current-step="currentStep" />

          <!-- Step 0: Style Selection + Upload -->
          <div v-if="currentStep === 0" class="space-y-6">
            <div v-if="availableStyles.length > 0" class="rounded-xl border bg-card p-6 space-y-4">
              <h3 class="font-medium">{{ t('tools.selectStyle') }}</h3>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="style in availableStyles"
                  :key="style.id"
                  type="button"
                  class="rounded-lg border overflow-hidden transition-colors"
                  :class="selectedStyle === style.id ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/50'"
                  @click="selectedStyle = style.id"
                >
                  <img v-if="style.imageUrl" :src="style.imageUrl" alt="" class="w-full aspect-square object-cover" />
                </button>
              </div>
            </div>

            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <ImagePicker
                :preview="upload.preview.value"
                :disabled="submitMutation.isPending.value"
                @file-select="handleFileSelect"
              />
            </div>

            <n-button
              type="primary"
              size="large"
              block
              :disabled="!upload.pendingFile.value || (availableStyles.length > 0 && !selectedStyle)"
              :loading="submitMutation.isPending.value || upload.isUploading.value"
              @click="submitMutation.mutate()"
            >
              {{ t('tools.generateImage') }}
              <template v-if="step0?.cost">
                &nbsp;· {{ step0.cost }}/{{ totalCost }} {{ t('tools.credits') }}
              </template>
            </n-button>
            <n-alert v-if="submitMutation.error.value" type="error" :bordered="false">
              {{ submitMutation.error.value.message }}
            </n-alert>
          </div>

          <!-- Step 1: Image Generation Progress -->
          <div v-if="currentStep === 1">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <TaskProgressDisplay :progress="imageProgress" />
              <div v-if="imageFailed" class="flex justify-center mt-4 gap-3">
                <n-button @click="currentStep = 0">{{ t('tools.tryAgain') }}</n-button>
                <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
              </div>
            </div>
          </div>

          <!-- Step 2: Image Result -->
          <div v-if="currentStep === 2" class="space-y-6">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <p class="text-sm font-medium text-muted-foreground">{{ t('tools.original') }}</p>
                  <div class="rounded-lg border overflow-hidden bg-muted">
                    <img v-if="originalPreview" :src="originalPreview" :alt="t('tools.original')" class="w-full object-contain" />
                  </div>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-medium text-muted-foreground">{{ t('tools.generated') }}</p>
                  <div class="rounded-lg border overflow-hidden bg-muted">
                    <img v-if="imageResult" :src="imageResult" :alt="t('tools.generated')" class="w-full object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-center gap-3">
              <n-button v-if="imageResult" tag="a" :href="imageResult" download>
                {{ t('tools.download') }}
              </n-button>
              <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
            </div>
          </div>
        </template>
      </div>
    </main>
  </AppLayout>
</template>
