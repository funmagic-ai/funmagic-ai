<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useToolBase } from '@/composables/useToolBase'
import { useTaskProgress } from '@/composables/useTaskProgress'
import { useApiError } from '@/composables/useApiError'
import AppLayout from '@/components/layout/AppLayout.vue'
const ModelViewer = defineAsyncComponent(() =>
  import('@/components/tools/ModelViewer.vue'),
)
import ImagePicker from '@/components/upload/ImagePicker.vue'
import StepIndicator from '@/components/tools/StepIndicator.vue'
import ToolBreadcrumb from '@/components/tools/ToolBreadcrumb.vue'
import TaskProgressDisplay from '@/components/tools/TaskProgressDisplay.vue'

const {
  t, locale, authStore, upload, queryClient,
  toolInfo, toolTitle, toolDescription, toolError, toolErrorData, toolData, totalCost,
  currentStep, originalPreview, restored,
  restoreTaskId, fetchRestoreData, fetchSourceImage,
  getStep, availableStyles, createSubmitMutation, fetchAssetUrl, handleFileSelect, resetBase,
} = useToolBase('figme', { defaultTitle: 'FigMe' })

const { handleError } = useApiError()

const taskId = ref<string | null>(null)
const imageResult = ref<string | null>(null)
const imageAssetId = ref<string | null>(null)
const threeDTaskId = ref<string | null>(null)
const threeDResult = ref<string | null>(null)
const selectedStyle = ref<string | null>(null)

const step0 = getStep(0)
const step1 = getStep(1)
const step0Name = computed(() => step0.value?.name ?? t('tools.generateImage'))
const step1Name = computed(() => step1.value?.name ?? t('tools.generate3D'))

const steps = computed(() => [
  { id: 'style-upload', label: t('tools.selectStyle') },
  { id: 'generating-image', label: step0Name.value },
  { id: 'image-result', label: t('tools.result') },
  { id: 'generating-3d', label: step1Name.value },
  { id: '3d-result', label: t('tools.result') },
])

// Image generation progress
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

// 3D generation progress
const { progress: threeDProgress, isFailed: threeDFailed } = useTaskProgress(
  threeDTaskId,
  {
    onComplete: async (output: unknown) => {
      currentStep.value = 4
      const out = output as Record<string, any>
      if (out?.modelAssetId) {
        threeDResult.value = await fetchAssetUrl(out.modelAssetId)
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

const generate3DMutation = useMutation({
  mutationFn: async () => {
    const { data, error, response } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'figme',
        stepId: step1.value?.id ?? '3d-gen',
        parentTaskId: taskId.value ?? undefined,
        input: { sourceAssetId: imageAssetId.value },
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: (data) => {
    threeDTaskId.value = data.task.id
    currentStep.value = 3
    queryClient.invalidateQueries({ queryKey: ['user-tasks'] })
  },
  onError: handleError,
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
  const childTask = task.childTasks?.[0]

  if (input?.sourceAssetId) fetchSourceImage(input.sourceAssetId)

  if (task.status === 'pending' || task.status === 'queued' || task.status === 'processing' || task.status === 'failed') {
    currentStep.value = 1
    taskId.value = task.id
  } else if (task.status === 'completed') {
    if (output?.assetId) {
      imageResult.value = await fetchAssetUrl(output.assetId)
      imageAssetId.value = output.assetId
    }

    if (!childTask) {
      currentStep.value = 2
      taskId.value = task.id
    } else if (childTask.status === 'completed') {
      currentStep.value = 4
      const childOutput = childTask.payload?.output as Record<string, string> | null
      if (childOutput?.modelAssetId) {
        threeDResult.value = await fetchAssetUrl(childOutput.modelAssetId)
      }
    } else {
      currentStep.value = 3
      threeDTaskId.value = childTask.id
    }
  }
}, { immediate: true })

function handleReset() {
  resetBase()
  taskId.value = null
  threeDTaskId.value = null
  imageResult.value = null
  imageAssetId.value = null
  threeDResult.value = null
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
              <n-button type="primary" :loading="generate3DMutation.isPending.value" @click="generate3DMutation.mutate()">
                {{ t('tools.generate3D') }}
                <template v-if="step1?.cost">
                  &nbsp;· {{ step1.cost }}/{{ totalCost }} {{ t('tools.credits') }}
                </template>
              </n-button>
              <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
            </div>
          </div>

          <!-- Step 3: 3D Generation Progress -->
          <div v-if="currentStep === 3">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <TaskProgressDisplay :progress="threeDProgress" />
              <div v-if="threeDFailed" class="flex justify-center mt-4 gap-3">
                <n-button @click="currentStep = 2">{{ t('tools.backToImage') }}</n-button>
                <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
              </div>
            </div>
          </div>

          <!-- Step 4: 3D Result -->
          <div v-if="currentStep === 4" class="space-y-6">
            <Suspense v-if="threeDResult">
              <ModelViewer
                :url="threeDResult"
                :original-image="imageResult ?? undefined"
              />
              <template #fallback>
                <div class="rounded-lg bg-zinc-900 h-[500px] flex items-center justify-center">
                  <div class="text-center text-muted-foreground">
                    <div class="animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
                    <p class="text-sm">{{ t('tools.modelViewer.loading') }}</p>
                  </div>
                </div>
              </template>
            </Suspense>
            <div v-else class="rounded-lg bg-zinc-900 h-[500px] flex items-center justify-center">
              <div class="text-center text-muted-foreground">
                <div class="animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
                <p class="text-sm">{{ t('tools.modelViewer.loading') }}</p>
              </div>
            </div>
            <n-button block @click="handleReset">{{ t('tools.processAnother') }}</n-button>
          </div>
        </template>
      </div>
    </main>
  </AppLayout>
</template>
