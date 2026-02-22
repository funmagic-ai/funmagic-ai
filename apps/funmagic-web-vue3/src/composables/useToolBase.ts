import { useI18n } from 'vue-i18n'
import { useQuery, useQueryClient, useMutation } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import type { SupportedLocale } from '@/lib/i18n'
import { useUpload } from '@/composables/useUpload'
import { useTaskRestore } from '@/composables/useTaskRestore'
import { useAuthStore } from '@/stores/auth'

interface ToolStep {
  id: string
  name?: string
  cost?: number
  styleReferences?: Array<{ imageUrl?: string }>
  [key: string]: unknown
}

interface ToolConfig {
  steps: ToolStep[]
}

export function useToolBase(slug: string, options?: { defaultTitle?: string }) {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const queryClient = useQueryClient()
  const route = useRoute()
  const router = useRouter()
  const locale = computed(() => (route.params.locale as string) || 'en')

  // Upload
  const upload = useUpload({ module: slug })

  // State
  const currentStep = ref(0)
  const restored = ref(false)

  // Task restore
  const { restoreTaskId, sourceImageUrl, fetchRestoreData, fetchSourceImage } = useTaskRestore(slug)
  const originalPreview = computed(() => upload.preview.value || sourceImageUrl.value)

  // Tool config
  const { data: toolData, isError: toolError, error: toolErrorData } = useQuery({
    queryKey: ['tool', slug, locale],
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/tools/{slug}', {
        params: { path: { slug }, query: { locale: locale.value as SupportedLocale } },
      })
      if (error) throw extractApiError(error, response)
      return data
    },
  })

  const toolInfo = computed(() => toolData.value?.tool)
  const toolTitle = computed(() => toolInfo.value?.title ?? (options?.defaultTitle ?? slug))
  const toolDescription = computed(() => toolInfo.value?.description ?? '')
  const toolConfig = computed(() => (toolInfo.value?.config ?? { steps: [] }) as ToolConfig)
  const totalCost = computed(() => toolConfig.value.steps.reduce((sum, s) => sum + (s.cost ?? 0), 0))

  /** Get step config by index */
  function getStep(index: number) {
    return computed(() => toolConfig.value.steps[index])
  }

  /** Available style references from step 0 config */
  const availableStyles = computed(() => {
    const rawStyles = toolConfig.value.steps[0]?.styleReferences ?? []
    return rawStyles.map((s, i) => ({
      id: String(i),
      imageUrl: s.imageUrl || '',
    }))
  })

  /** Create a submit mutation that uploads then creates a task */
  function createSubmitMutation(params: {
    stepId: Ref<string> | ComputedRef<string>
    buildInput: (uploadResult: { storageKey: string; assetId: string }) => Record<string, unknown>
    onSuccess: (taskId: string) => void
  }) {
    return useMutation({
      mutationFn: async () => {
        const uploadResult = await upload.uploadOnSubmit()
        if (!uploadResult) throw new Error(upload.error.value ?? 'Upload failed')

        const { data, error, response } = await api.POST('/api/tasks', {
          body: {
            toolSlug: toolInfo.value?.slug ?? slug,
            stepId: unref(params.stepId),
            input: params.buildInput(uploadResult),
          },
        })
        if (error) throw extractApiError(error, response)
        return data
      },
      onSuccess: (data) => {
        params.onSuccess(data.task.id)
        queryClient.invalidateQueries({ queryKey: ['user-tasks'] })
      },
    })
  }

  /** Fetch asset download URL */
  async function fetchAssetUrl(assetId: string): Promise<string | null> {
    const { data } = await api.GET('/api/assets/{id}/url', {
      params: { path: { id: assetId } },
    })
    return data?.url ?? null
  }

  /** Reset all state */
  function resetBase() {
    upload.reset()
    currentStep.value = 0
    sourceImageUrl.value = null
    restored.value = false
    if (route.query.taskId) {
      router.replace({ query: { ...route.query, taskId: undefined } })
    }
  }

  function handleFileSelect(file: File | null) {
    upload.setFile(file)
  }

  return {
    // i18n & routing
    t,
    locale,
    route,
    router,
    authStore,
    queryClient,

    // Tool config
    toolData,
    toolInfo,
    toolTitle,
    toolDescription,
    toolConfig,
    toolError,
    toolErrorData,
    totalCost,
    getStep,
    availableStyles,

    // Upload
    upload,

    // State
    currentStep,
    restored,

    // Restore
    restoreTaskId,
    sourceImageUrl,
    originalPreview,
    fetchRestoreData,
    fetchSourceImage,

    // Actions
    createSubmitMutation,
    fetchAssetUrl,
    handleFileSelect,
    resetBase,
  }
}
