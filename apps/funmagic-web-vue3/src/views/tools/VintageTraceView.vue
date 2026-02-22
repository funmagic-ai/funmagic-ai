<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import type { SupportedLocale } from '@/lib/i18n'
import { useUpload } from '@/composables/useUpload'
import { useTaskProgress } from '@/composables/useTaskProgress'
import { useTaskRestore } from '@/composables/useTaskRestore'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import ImagePicker from '@/components/upload/ImagePicker.vue'
import StepIndicator from '@/components/tools/StepIndicator.vue'
import ToolBreadcrumb from '@/components/tools/ToolBreadcrumb.vue'
import TaskProgressDisplay from '@/components/tools/TaskProgressDisplay.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const queryClient = useQueryClient()
const route = useRoute()
const locale = computed(() => (route.params.locale as string) || 'en')

const upload = useUpload({ module: 'vintage-trace' })
const currentStep = ref(0)
const taskId = ref<string | null>(null)
const imageResult = ref<string | null>(null)
const imageAssetId = ref<string | null>(null)
const selectedStyle = ref<string | null>(null)

// Task restore
const { restoreTaskId, sourceImageUrl, fetchRestoreData, fetchSourceImage } = useTaskRestore('vintage-trace')
const restored = ref(false)
const originalPreview = computed(() => upload.preview.value || sourceImageUrl.value)

// Fetch tool config from API
const { data: toolData, isError: toolError, error: toolErrorData } = useQuery({
  queryKey: ['tool', 'vintage-trace', locale],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/tools/{slug}', {
      params: { path: { slug: 'vintage-trace' }, query: { locale: locale.value as SupportedLocale } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
})

const toolInfo = computed(() => toolData.value?.tool)
const toolTitle = computed(() => toolInfo.value?.title ?? 'Vintage Trace')
const toolDescription = computed(() => toolInfo.value?.description ?? '')
const toolConfig = computed(() => (toolInfo.value?.config ?? { steps: [] }) as { steps: Array<{ id: string; name?: string; cost?: number; styleReferences?: Array<{ imageUrl?: string }>; [key: string]: unknown }> })
const step0 = computed(() => toolConfig.value.steps[0])
const totalCost = computed(() => toolConfig.value.steps.reduce((sum, s) => sum + (s.cost ?? 0), 0))
const step0Id = computed(() => step0.value?.id ?? 'image-gen')
const step0Name = computed(() => step0.value?.name ?? t('tools.generateImage'))

const steps = computed(() => [
  { id: 'style-upload', label: t('tools.selectStyle') },
  { id: 'generating-image', label: step0Name.value },
  { id: 'image-result', label: t('tools.result') },
])

const availableStyles = computed(() => {
  const s0 = toolConfig.value.steps[0]
  const rawStyles = (s0?.styleReferences ?? []) as Array<{ imageUrl?: string }>
  return rawStyles.map((s, i) => ({
    id: String(i),
    imageUrl: s.imageUrl || '',
  }))
})

// Image generation progress
const { progress: imageProgress, isFailed: imageFailed } = useTaskProgress(
  taskId,
  {
    onComplete: async (output: unknown) => {
      currentStep.value = 2
      const out = output as Record<string, string>
      imageAssetId.value = out?.assetId ?? null
      if (out?.assetId) {
        const { data } = await api.GET('/api/assets/{id}/url', {
          params: { path: { id: out.assetId } },
        })
        imageResult.value = data?.url ?? null
      }
    },
  },
)

const submitMutation = useMutation({
  mutationFn: async () => {
    const uploadResult = await upload.uploadOnSubmit()
    if (!uploadResult) throw new Error(upload.error.value ?? 'Upload failed')

    const { data, error, response } = await api.POST('/api/tasks', {
      body: {
        toolSlug: toolInfo.value?.slug ?? 'vintage-trace',
        stepId: step0Id.value,
        input: {
          imageStorageKey: uploadResult.storageKey,
          sourceAssetId: uploadResult.assetId,
          styleReferenceId: selectedStyle.value,
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

  // Fetch source image preview
  if (input?.sourceAssetId) {
    fetchSourceImage(input.sourceAssetId)
  }

  // Helper to fetch image result URL
  async function loadImageResult(assetId: string) {
    const { data: urlData } = await api.GET('/api/assets/{id}/url', {
      params: { path: { id: assetId } },
    })
    imageResult.value = urlData?.url ?? null
    imageAssetId.value = assetId
  }

  if (task.status === 'pending' || task.status === 'queued' || task.status === 'processing') {
    // Image generation in progress
    currentStep.value = 1
    taskId.value = task.id
  } else if (task.status === 'failed') {
    currentStep.value = 1
    taskId.value = task.id
  } else if (task.status === 'completed') {
    if (output?.assetId) {
      await loadImageResult(output.assetId)
    }
    currentStep.value = 2
    taskId.value = task.id
  }
}, { immediate: true })

function handleFileSelect(file: File | null) {
  upload.setFile(file)
}

function handleSubmit() {
  submitMutation.mutate()
}

const router = useRouter()

function handleReset() {
  upload.reset()
  currentStep.value = 0
  taskId.value = null
  imageResult.value = null
  imageAssetId.value = null
  selectedStyle.value = null
  sourceImageUrl.value = null
  restored.value = false
  if (route.query.taskId) {
    router.replace({ query: { ...route.query, taskId: undefined } })
  }
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
          <StepIndicator :steps="steps" :current-step="currentStep" />

          <!-- Step 0: Style Selection + Upload -->
          <div v-if="currentStep === 0" class="space-y-6">
            <!-- Style Selector -->
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

            <!-- Upload -->
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
              @click="handleSubmit"
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
