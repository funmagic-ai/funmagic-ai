<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useToolBase } from '@/composables/useToolBase'
import { useTaskProgress } from '@/composables/useTaskProgress'
import { useApiError } from '@/composables/useApiError'
import AppLayout from '@/components/layout/AppLayout.vue'
import ImagePicker from '@/components/upload/ImagePicker.vue'
import StepIndicator from '@/components/tools/StepIndicator.vue'
import ToolBreadcrumb from '@/components/tools/ToolBreadcrumb.vue'
import TaskProgressDisplay from '@/components/tools/TaskProgressDisplay.vue'

const PointCloudViewer = defineAsyncComponent(() =>
  import('@/components/tools/PointCloudViewer.vue'),
)

const {
  t, locale, route, authStore, upload, queryClient,
  toolInfo, toolTitle, toolDescription, toolError, toolErrorData, toolData, totalCost,
  currentStep, originalPreview, restored,
  restoreTaskId, fetchRestoreData, fetchSourceImage,
  getStep, createSubmitMutation, fetchAssetUrl, handleFileSelect, resetBase,
} = useToolBase('crystal-memory', { defaultTitle: 'Crystal Memory' })

const { handleError } = useApiError()

// Background removal task
const bgRemoveTaskId = ref<string | null>(null)
const bgRemovedAssetId = ref<string | null>(null)
const bgRemovedImageUrl = ref<string | null>(null)

// Point cloud generation task
const cloudTaskId = ref<string | null>(null)

interface VGGTOutput {
  assetId: string
  storageKey: string
  pointCount: number
  dimensions: { height: number; width: number }
}

interface PointCloudData {
  txt: string
  conf: number[]
}

const cloudOutput = ref<VGGTOutput | null>(null)
const pointCloudData = ref<PointCloudData | null>(null)
const loadingPointCloud = ref(false)
const showExport = computed(() => route.query.query === 'bsltest')

const step0 = getStep(0)
const step1 = getStep(1)

const steps = computed(() => [
  { id: 'upload', label: t('tools.uploadImage') },
  { id: 'removing-bg', label: step0.value?.name ?? t('tools.processing') },
  { id: 'bg-result', label: t('tools.result') },
  { id: 'generating-cloud', label: step1.value?.name ?? t('tools.processing') },
  { id: 'result', label: t('tools.result') },
])

// Background removal progress
const { progress: bgProgress, isFailed: bgFailed } = useTaskProgress(
  bgRemoveTaskId,
  {
    onComplete: async (output: unknown) => {
      currentStep.value = 2
      const out = output as Record<string, string>
      bgRemovedAssetId.value = out?.assetId ?? null
      if (out?.assetId) {
        bgRemovedImageUrl.value = await fetchAssetUrl(out.assetId)
      }
    },
  },
)

// Point cloud generation progress
const { progress: cloudProgress, isFailed: cloudFailed } = useTaskProgress(
  cloudTaskId,
  {
    onComplete: async (output: unknown) => {
      cloudTaskId.value = null
      const out = output as VGGTOutput | null
      if (!out?.assetId) return

      cloudOutput.value = out
      loadingPointCloud.value = true

      try {
        const url = await fetchAssetUrl(out.assetId)
        if (!url) throw new Error('Failed to get download URL')

        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to fetch point cloud data: ${response.status}`)

        pointCloudData.value = await response.json() as PointCloudData
        currentStep.value = 4
      } catch (err) {
        console.error('[CrystalMemory] Failed to load point cloud data:', err)
      } finally {
        loadingPointCloud.value = false
      }
    },
  },
)

const submitMutation = createSubmitMutation({
  stepId: computed(() => step0.value?.id ?? 'background-remove'),
  buildInput: (uploadResult) => ({
    imageStorageKey: uploadResult.storageKey,
    sourceAssetId: uploadResult.assetId,
  }),
  onSuccess: (id) => {
    bgRemoveTaskId.value = id
    currentStep.value = 1
  },
})

const cloudMutation = useMutation({
  mutationFn: async () => {
    const { data, error, response } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'crystal-memory',
        stepId: step1.value?.id ?? 'vggt',
        parentTaskId: bgRemoveTaskId.value ?? undefined,
        input: { sourceAssetId: bgRemovedAssetId.value },
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: (data) => {
    cloudTaskId.value = data.task.id
    queryClient.invalidateQueries({ queryKey: ['user-tasks'] })
  },
  onError: handleError,
})

function startCloudGeneration() {
  if (cloudTaskId.value || cloudMutation.isPending.value) return
  currentStep.value = 3
  cloudMutation.mutate()
}

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
    bgRemoveTaskId.value = task.id
  } else if (task.status === 'completed') {
    if (output?.assetId) bgRemovedAssetId.value = output.assetId

    if (!childTask) {
      currentStep.value = 2
      bgRemoveTaskId.value = task.id
      if (output?.assetId) {
        bgRemovedImageUrl.value = await fetchAssetUrl(output.assetId)
      }
    } else if (childTask.status === 'completed') {
      const childOutput = childTask.payload?.output as VGGTOutput | null
      if (childOutput?.assetId) {
        cloudOutput.value = childOutput
        loadingPointCloud.value = true
        try {
          const url = await fetchAssetUrl(childOutput.assetId)
          if (url) {
            const response = await fetch(url)
            if (response.ok) {
              pointCloudData.value = await response.json()
              currentStep.value = 4
            }
          }
        } finally {
          loadingPointCloud.value = false
        }
      }
    } else {
      currentStep.value = 3
      cloudTaskId.value = childTask.id
    }
  }
}, { immediate: true })

function handleReset() {
  resetBase()
  bgRemoveTaskId.value = null
  cloudTaskId.value = null
  bgRemovedAssetId.value = null
  bgRemovedImageUrl.value = null
  cloudOutput.value = null
  pointCloudData.value = null
  loadingPointCloud.value = false
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

          <!-- Step 0: Upload -->
          <div v-if="currentStep === 0" class="space-y-6">
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
              :disabled="!upload.pendingFile.value"
              :loading="submitMutation.isPending.value || upload.isUploading.value"
              @click="submitMutation.mutate()"
            >
              {{ t('tools.startProcessing') }}
              <template v-if="step0?.cost">
                &nbsp;· {{ step0.cost }}/{{ totalCost }} {{ t('tools.credits') }}
              </template>
            </n-button>
            <n-alert v-if="submitMutation.error.value" type="error" :bordered="false">
              {{ submitMutation.error.value.message }}
            </n-alert>
          </div>

          <!-- Step 1: Background Removal -->
          <div v-if="currentStep === 1">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center">
              <TaskProgressDisplay :progress="bgProgress" />
              <div v-if="bgFailed" class="flex justify-center mt-4 gap-3">
                <n-button @click="currentStep = 0">{{ t('tools.tryAgain') }}</n-button>
                <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
              </div>
            </div>
          </div>

          <!-- Step 2: Background Removal Result -->
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
                  <p class="text-sm font-medium text-muted-foreground">{{ t('tools.result') }}</p>
                  <div class="rounded-lg border overflow-hidden bg-muted">
                    <img v-if="bgRemovedImageUrl" :src="bgRemovedImageUrl" :alt="t('tools.result')" class="w-full object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-center gap-3">
              <n-button
                type="primary"
                :loading="cloudMutation.isPending.value"
                @click="startCloudGeneration"
              >
                {{ step1?.name ?? t('tools.processing') }}
                <template v-if="step1?.cost">
                  &nbsp;· {{ step1.cost }}/{{ totalCost }} {{ t('tools.credits') }}
                </template>
              </n-button>
              <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
            </div>
          </div>

          <!-- Step 3: Point Cloud Generation -->
          <div v-if="currentStep === 3">
            <div class="rounded-xl border bg-card p-6 min-h-[500px] flex flex-col justify-center space-y-4">
              <TaskProgressDisplay :progress="cloudProgress" />
              <div v-if="loadingPointCloud" class="flex items-center justify-center gap-2 py-4">
                <div class="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                <span class="text-sm text-muted-foreground">{{ t('tools.pointCloud.loadingData') }}</span>
              </div>
              <div v-if="cloudFailed" class="flex justify-center mt-4 gap-3">
                <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
              </div>
            </div>
          </div>

          <!-- Step 4: Result -->
          <div v-if="currentStep === 4 && pointCloudData" class="space-y-6">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">{{ t('tools.resultReady') }}</h3>
              <p v-if="cloudOutput" class="text-sm text-muted-foreground">
                {{ t('tools.pointCloud.resultDescription', { count: cloudOutput.pointCount.toLocaleString() }) }}
              </p>
            </div>

            <Suspense>
              <PointCloudViewer
                :data="pointCloudData"
                :original-image="originalPreview ?? undefined"
                :show-export="showExport"
              />
              <template #fallback>
                <div class="rounded-lg bg-zinc-900 h-[500px] flex items-center justify-center">
                  <div class="text-center text-muted-foreground">
                    <div class="animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
                    <p class="text-sm">{{ t('tools.pointCloud.loading') }}</p>
                  </div>
                </div>
              </template>
            </Suspense>
          </div>
        </template>
      </div>
    </main>
  </AppLayout>
</template>
