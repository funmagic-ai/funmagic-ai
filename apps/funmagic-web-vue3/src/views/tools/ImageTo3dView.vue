<script setup lang="ts">
import { useToolBase } from '@/composables/useToolBase'
import { useTaskProgress } from '@/composables/useTaskProgress'
import { useApiError } from '@/composables/useApiError'
import { useMutation } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import AppLayout from '@/components/layout/AppLayout.vue'
const ModelViewer = defineAsyncComponent(() =>
  import('@/components/tools/ModelViewer.vue'),
)
import ImagePicker from '@/components/upload/ImagePicker.vue'
import StepIndicator from '@/components/tools/StepIndicator.vue'
import ToolBreadcrumb from '@/components/tools/ToolBreadcrumb.vue'
import TaskProgressDisplay from '@/components/tools/TaskProgressDisplay.vue'

const {
  t, locale, authStore, upload, queryClient, toolInfo,
  toolTitle, toolDescription, toolError, toolErrorData, toolData, totalCost,
  currentStep, originalPreview, restored,
  restoreTaskId, fetchRestoreData, fetchSourceImage,
  getStep, fetchAssetUrl, handleFileSelect, resetBase,
} = useToolBase('image-to-3d', { defaultTitle: 'Image to 3D' })

const { handleError } = useApiError()

const taskId = ref<string | null>(null)
const threeDResult = ref<string | null>(null)
const selectedProvider = ref<'tripo' | 'hunyuan'>('tripo')

// Tripo options
const tripoModelVersion = ref('v3.0-20250812')
const tripoFaceLimit = ref<number | null>(null)
const tripoPbr = ref(true)

// Hunyuan options
const hunyuanGenerateType = ref<'Normal' | 'LowPoly' | 'Geometry' | 'Sketch'>('Normal')
const hunyuanFaceCount = ref<number | null>(null)
const hunyuanPbr = ref(false)

const step0 = getStep(0)

const steps = computed(() => [
  { id: 'upload-config', label: t('tools.imageTo3d.uploadAndConfigure') },
  { id: 'generating-3d', label: step0.value?.name ?? t('tools.generate3D') },
  { id: '3d-result', label: t('tools.result') },
])

const { progress, isFailed } = useTaskProgress(
  taskId,
  {
    onComplete: async (output: unknown) => {
      currentStep.value = 2
      const out = output as Record<string, string>
      if (out?.modelAssetId) {
        threeDResult.value = await fetchAssetUrl(out.modelAssetId)
      }
    },
  },
)

function buildProviderOptions(): Record<string, unknown> {
  if (selectedProvider.value === 'tripo') {
    const opts: Record<string, unknown> = {
      model_version: tripoModelVersion.value,
      pbr: tripoPbr.value,
    }
    if (tripoFaceLimit.value != null && tripoFaceLimit.value > 0) {
      opts.face_limit = tripoFaceLimit.value
    }
    return opts
  }
  // hunyuan
  const opts: Record<string, unknown> = {
    GenerateType: hunyuanGenerateType.value,
    EnablePBR: hunyuanPbr.value,
  }
  if (hunyuanFaceCount.value != null && hunyuanFaceCount.value > 0) {
    opts.FaceCount = hunyuanFaceCount.value
  }
  return opts
}

// Custom submit that passes providerName + providerOptions in input
const submitMutation = useMutation({
  mutationFn: async () => {
    const uploadResult = await upload.uploadOnSubmit()
    if (!uploadResult) throw new Error(upload.error.value ?? 'Upload failed')

    const { data, error, response } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'image-to-3d',
        stepId: step0.value?.id ?? '3d-gen',
        input: {
          imageStorageKey: uploadResult.storageKey,
          sourceAssetId: uploadResult.assetId,
          providerName: selectedProvider.value,
          providerOptions: buildProviderOptions(),
        },
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: (data) => {
    taskId.value = data.task.id
    currentStep.value = 1
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

  if (input?.sourceAssetId) fetchSourceImage(input.sourceAssetId)

  if (task.status === 'completed') {
    currentStep.value = 2
    if (output?.modelAssetId) {
      threeDResult.value = await fetchAssetUrl(output.modelAssetId)
    }
  } else if (['failed', 'pending', 'queued', 'processing'].includes(task.status)) {
    currentStep.value = 1
    taskId.value = task.id
  }
}, { immediate: true })

function handleReset() {
  resetBase()
  taskId.value = null
  threeDResult.value = null
  selectedProvider.value = 'tripo'
  tripoModelVersion.value = 'v3.0-20250812'
  tripoFaceLimit.value = null
  tripoPbr.value = true
  hunyuanGenerateType.value = 'Normal'
  hunyuanFaceCount.value = null
  hunyuanPbr.value = false
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

          <!-- Step 0: Upload + Provider Config -->
          <div v-if="currentStep === 0" class="space-y-6">
            <!-- Provider Selection -->
            <div class="rounded-xl border bg-card p-6 space-y-4">
              <h3 class="font-medium">{{ t('tools.imageTo3d.selectProvider') }}</h3>
              <div class="flex gap-3">
                <button
                  type="button"
                  class="flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
                  :class="selectedProvider === 'tripo' ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'"
                  @click="selectedProvider = 'tripo'"
                >
                  {{ t('tools.imageTo3d.tripoProvider') }}
                </button>
                <button
                  type="button"
                  class="flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors"
                  :class="selectedProvider === 'hunyuan' ? 'border-primary bg-primary/10 text-primary' : 'hover:border-primary/50'"
                  @click="selectedProvider = 'hunyuan'"
                >
                  {{ t('tools.imageTo3d.hunyuanProvider') }}
                </button>
              </div>
            </div>

            <!-- Provider Options -->
            <div class="rounded-xl border bg-card p-6 space-y-4">
              <h3 class="font-medium">{{ t('tools.imageTo3d.providerOptions') }}</h3>

              <!-- Tripo Options -->
              <template v-if="selectedProvider === 'tripo'">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-sm text-muted-foreground">{{ t('tools.imageTo3d.modelVersion') }}</label>
                    <n-select
                      v-model:value="tripoModelVersion"
                      :options="[
                        { label: 'Turbo v1.0', value: 'Turbo-v1.0-20250506' },
                        { label: 'v2.0', value: 'v2.0-20240919' },
                        { label: 'v2.5', value: 'v2.5-20250123' },
                        { label: 'v3.0 (Latest)', value: 'v3.0-20250812' },
                      ]"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-sm text-muted-foreground">{{ t('tools.imageTo3d.faceLimit') }}</label>
                    <n-input-number
                      v-model:value="tripoFaceLimit"
                      :min="1000"
                      :max="500000"
                      :step="1000"
                      placeholder="Default"
                      clearable
                    />
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <n-switch v-model:value="tripoPbr" />
                  <span class="text-sm">{{ t('tools.imageTo3d.enablePBR') }}</span>
                </div>
              </template>

              <!-- Hunyuan Options -->
              <template v-if="selectedProvider === 'hunyuan'">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-sm text-muted-foreground">{{ t('tools.imageTo3d.generateType') }}</label>
                    <n-select
                      v-model:value="hunyuanGenerateType"
                      :options="[
                        { label: t('tools.imageTo3d.generateTypeNormal'), value: 'Normal' },
                        { label: t('tools.imageTo3d.generateTypeLowPoly'), value: 'LowPoly' },
                        { label: t('tools.imageTo3d.generateTypeGeometry'), value: 'Geometry' },
                        { label: t('tools.imageTo3d.generateTypeSketch'), value: 'Sketch' },
                      ]"
                    />
                  </div>
                  <div class="space-y-1.5">
                    <label class="text-sm text-muted-foreground">{{ t('tools.imageTo3d.faceCount') }}</label>
                    <n-input-number
                      v-model:value="hunyuanFaceCount"
                      :min="40000"
                      :max="1500000"
                      :step="10000"
                      placeholder="500000"
                      clearable
                    />
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <n-switch v-model:value="hunyuanPbr" />
                  <span class="text-sm">{{ t('tools.imageTo3d.enablePBR') }}</span>
                </div>
              </template>
            </div>

            <!-- Image Upload -->
            <div class="rounded-xl border bg-card p-6 min-h-[400px] flex flex-col justify-center">
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
              :disabled="!upload.pendingFile.value"
              :loading="submitMutation.isPending.value || upload.isUploading.value"
              @click="submitMutation.mutate()"
            >
              {{ t('tools.imageTo3d.generate3DModel') }}
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
                <n-button @click="currentStep = 0">{{ t('tools.tryAgain') }}</n-button>
                <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
              </div>
            </div>
          </div>

          <!-- Step 2: 3D Result -->
          <div v-if="currentStep === 2" class="space-y-6">
            <Suspense v-if="threeDResult">
              <ModelViewer
                :url="threeDResult"
                :original-image="originalPreview ?? undefined"
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
