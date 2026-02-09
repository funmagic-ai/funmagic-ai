<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
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
const bgRemovedImageUrl = ref<string | null>(null)

// Point cloud generation task
const cloudTaskId = ref<string | null>(null)

interface VGGTOutput {
  txt: string
  conf: number[]
  pointCount: number
}

const cloudOutput = ref<VGGTOutput | null>(null)
const resultTab = ref<'model' | 'original'>('model')

// Fetch tool config from API
const { data: toolData } = useQuery({
  queryKey: ['tool', 'crystal-memory', locale],
  queryFn: async () => {
    const { data } = await api.GET('/api/tools/{slug}', {
      params: { path: { slug: 'crystal-memory' }, query: { locale: locale.value as SupportedLocale } },
    })
    return data
  },
})

const toolInfo = computed(() => toolData.value?.tool)
const toolTitle = computed(() => toolInfo.value?.title ?? 'Crystal Memory')
const toolDescription = computed(() => toolInfo.value?.description ?? toolInfo.value?.shortDescription ?? '')
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
      bgRemovedImageUrl.value = out?.bgRemovedImageUrl ?? null
      // Auto-start point cloud generation
      if (bgRemovedAssetId.value && bgRemovedImageUrl.value) {
        startCloudGeneration()
      }
    },
  },
)

// Point cloud generation progress
const { progress: cloudProgress, isFailed: cloudFailed } = useTaskProgress(
  cloudTaskId,
  {
    onComplete: (output: unknown) => {
      // Null out task ID to prevent reconnect from firing onComplete again
      cloudTaskId.value = null
      currentStep.value = 3
      const out = output as Record<string, any>
      if (out?.txt) {
        cloudOutput.value = {
          txt: out.txt,
          conf: out.conf ?? [],
          pointCount: out.pointCount ?? 0,
        }
      }
    },
  },
)

const submitMutation = useMutation({
  mutationFn: async () => {
    const uploadResult = await upload.uploadOnSubmit()
    if (!uploadResult) throw new Error(upload.error.value ?? 'Upload failed')

    // Start bg-remove task
    const { data, error } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'crystal-memory',
        stepId: step0Id.value,
        input: { imageStorageKey: uploadResult.storageKey },
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to create task')
    return data
  },
  onSuccess: (data) => {
    bgRemoveTaskId.value = data.task?.id ?? data.id
    currentStep.value = 1
  },
})

const cloudMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'crystal-memory',
        stepId: step1Id.value,
        parentTaskId: bgRemoveTaskId.value ?? undefined,
        input: {
          sourceAssetId: bgRemovedAssetId.value,
          bgRemovedImageUrl: bgRemovedImageUrl.value,
        },
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to create cloud task')
    return data
  },
  onSuccess: (data) => {
    cloudTaskId.value = data.task?.id ?? data.id
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
  bgRemovedImageUrl.value = null
  cloudOutput.value = null
  resultTab.value = 'model'
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

        <!-- Auth Gate -->
        <div v-if="!authStore.isAuthenticated" class="rounded-xl border bg-card p-8 text-center space-y-4">
          <p class="text-muted-foreground">{{ t('tools.signInRequired') }}</p>
          <n-button type="primary" @click="$router.push({ name: 'login', params: { locale } })">
            {{ t('auth.signIn') }}
          </n-button>
        </div>

        <template v-else>
          <StepIndicator :steps="steps" :current-step="currentStep" />

          <!-- Step 0: Upload -->
          <div v-if="currentStep === 0" class="space-y-6">
            <div class="rounded-xl border bg-card p-6">
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
            <TaskProgressDisplay :progress="bgProgress" />
            <div v-if="bgFailed" class="flex justify-center mt-4 gap-3">
              <n-button @click="currentStep = 0">{{ t('tools.tryAgain') }}</n-button>
              <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
            </div>
          </div>

          <!-- Step 2: Point Cloud Generation -->
          <div v-if="currentStep === 2">
            <TaskProgressDisplay :progress="cloudProgress" />
            <div v-if="cloudFailed" class="flex justify-center mt-4 gap-3">
              <n-button @click="handleReset">{{ t('tools.startOver') }}</n-button>
            </div>
          </div>

          <!-- Step 3: Result -->
          <div v-if="currentStep === 3" class="space-y-6">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold">{{ t('tools.resultReady') }}</h3>
              <p v-if="cloudOutput" class="text-sm text-muted-foreground">
                {{ t('tools.pointCloud.resultDescription', { count: cloudOutput.pointCount.toLocaleString() }) }}
              </p>
            </div>

            <!-- Tab Switcher -->
            <n-tabs v-model:value="resultTab" type="segment">
              <n-tab-pane name="model" :tab="t('tools.pointCloud.tab3D')">
                <div v-if="cloudOutput" class="pt-4">
                  <Suspense>
                    <PointCloudViewer
                      :data="{ txt: cloudOutput.txt, conf: cloudOutput.conf }"
                      @reset="handleReset"
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
              </n-tab-pane>
              <n-tab-pane name="original" :tab="t('tools.original')">
                <div class="pt-4 space-y-4">
                  <div class="rounded-lg border overflow-hidden bg-muted max-w-lg mx-auto">
                    <img
                      v-if="upload.preview.value"
                      :src="upload.preview.value"
                      :alt="t('tools.original')"
                      class="w-full object-contain"
                    />
                  </div>
                  <n-button @click="handleReset">{{ t('tools.processAnother') }}</n-button>
                </div>
              </n-tab-pane>
            </n-tabs>
          </div>
        </template>
      </div>
    </main>
  </AppLayout>
</template>
