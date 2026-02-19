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

const PointCloudViewer = defineAsyncComponent(() =>
  import('@/components/tools/PointCloudViewer.vue'),
)

const { t } = useI18n()
const authStore = useAuthStore()
const route = useRoute()
const locale = computed(() => (route.params.locale as string) || 'en')

const upload = useUpload({ module: 'crystal-memory' })
const currentStep = ref(0)

// Background removal task
const bgRemoveTaskId = ref<string | null>(null)
const bgRemovedAssetId = ref<string | null>(null)

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

// Fetch tool config from API
const { data: toolData, isError: toolError, error: toolErrorData } = useQuery({
  queryKey: ['tool', 'crystal-memory', locale],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/tools/{slug}', {
      params: { path: { slug: 'crystal-memory' }, query: { locale: locale.value as SupportedLocale } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
})

const toolInfo = computed(() => toolData.value?.tool)
const toolTitle = computed(() => toolInfo.value?.title ?? 'Crystal Memory')
const toolDescription = computed(() => toolInfo.value?.description ?? '')
const toolConfig = computed(() => (toolInfo.value?.config ?? { steps: [] }) as { steps: Array<{ id: string; name?: string; cost?: number; [key: string]: unknown }> })
const step0 = computed(() => toolConfig.value.steps[0])
const step1 = computed(() => toolConfig.value.steps[1])
const step0Id = computed(() => step0.value?.id ?? 'background-remove')
const step0Name = computed(() => step0.value?.name ?? t('tools.processing'))
const step1Id = computed(() => step1.value?.id ?? 'vggt')
const step1Name = computed(() => step1.value?.name ?? t('tools.processing'))
const totalCost = computed(() => toolConfig.value.steps.reduce((sum, s) => sum + (s.cost ?? 0), 0))

const steps = computed(() => [
  { id: 'upload', label: t('tools.uploadImage') },
  { id: 'removing-bg', label: step0Name.value },
  { id: 'generating-cloud', label: step1Name.value },
  { id: 'result', label: t('tools.result') },
])

// Background removal progress
const { progress: bgProgress, isFailed: bgFailed } = useTaskProgress(
  bgRemoveTaskId,
  {
    onComplete: (output: unknown) => {
      // Null out task ID to prevent reconnect from firing onComplete again
      bgRemoveTaskId.value = null
      const out = output as Record<string, string>
      bgRemovedAssetId.value = out?.assetId ?? null
      // Auto-start point cloud generation
      if (bgRemovedAssetId.value) {
        startCloudGeneration()
      }
    },
  },
)

// Point cloud generation progress
const { progress: cloudProgress, isFailed: cloudFailed } = useTaskProgress(
  cloudTaskId,
  {
    onComplete: async (output: unknown) => {
      // Null out task ID to prevent reconnect from firing onComplete again
      cloudTaskId.value = null
      const out = output as VGGTOutput | null
      if (!out?.assetId) return

      cloudOutput.value = out
      loadingPointCloud.value = true

      try {
        // Fetch point cloud data from S3 via presigned URL
        const { data: urlData } = await api.GET('/api/assets/{id}/url', {
          params: { path: { id: out.assetId } },
        })
        if (!urlData?.url) throw new Error('Failed to get download URL')

        const response = await fetch(urlData.url)
        if (!response.ok) throw new Error(`Failed to fetch point cloud data: ${response.status}`)

        const data = await response.json() as PointCloudData
        pointCloudData.value = data
        currentStep.value = 3
      } catch (err) {
        console.error('[CrystalMemory] Failed to load point cloud data:', err)
      } finally {
        loadingPointCloud.value = false
      }
    },
  },
)

const submitMutation = useMutation({
  mutationFn: async () => {
    const uploadResult = await upload.uploadOnSubmit()
    if (!uploadResult) throw new Error(upload.error.value ?? 'Upload failed')

    // Start bg-remove task
    const { data, error, response } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'crystal-memory',
        stepId: step0Id.value,
        input: { imageStorageKey: uploadResult.storageKey },
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: (data) => {
    bgRemoveTaskId.value = data.task.id
    currentStep.value = 1
  },
})

const cloudMutation = useMutation({
  mutationFn: async () => {
    const { data, error, response } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'crystal-memory',
        stepId: step1Id.value,
        parentTaskId: bgRemoveTaskId.value ?? undefined,
        input: {
          sourceAssetId: bgRemovedAssetId.value,
        },
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: (data) => {
    cloudTaskId.value = data.task.id
  },
})

function startCloudGeneration() {
  currentStep.value = 2
  cloudMutation.mutate()
}

function handleFileSelect(file: File | null) {
  upload.setFile(file)
}

function handleSubmit() {
  submitMutation.mutate()
}

function handleReset() {
  upload.reset()
  currentStep.value = 0
  bgRemoveTaskId.value = null
  cloudTaskId.value = null
  bgRemovedAssetId.value = null
  cloudOutput.value = null
  pointCloudData.value = null
  loadingPointCloud.value = false
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
              @click="handleSubmit"
            >
              {{ t('tools.startProcessing') }}
              <template v-if="totalCost > 0">
                &nbsp;· {{ totalCost }} {{ t('tools.credits') }}
              </template>
            </n-button>
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

          <!-- Step 2: Point Cloud Generation -->
          <div v-if="currentStep === 2">
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

          <!-- Step 3: Result -->
          <div v-if="currentStep === 3 && pointCloudData" class="space-y-6">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">{{ t('tools.resultReady') }}</h3>
              <p v-if="cloudOutput" class="text-sm text-muted-foreground">
                {{ t('tools.pointCloud.resultDescription', { count: cloudOutput.pointCount.toLocaleString() }) }}
              </p>
            </div>

            <Suspense>
              <PointCloudViewer
                :data="pointCloudData"
                :original-image="upload.preview.value ?? undefined"
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
