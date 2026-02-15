<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useUpload } from '@/composables/useUpload'
import { useGenerationStream } from '@/composables/useGenerationStream'
import { useI18n } from 'vue-i18n'
import StudioConversation from './StudioConversation.vue'
import StudioPromptBar from './StudioPromptBar.vue'
import StudioBatchPanel from './StudioBatchPanel.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()

const projectId = computed(() => route.params.id as string)
const batchMode = ref(false)
const batchPanelRef = ref<InstanceType<typeof StudioBatchPanel> | null>(null)
const quotedGenerationIds = ref<string[]>([])

const upload = useUpload({ module: 'studio', visibility: 'admin-private' })

// Generation stream for real-time updates
const { connectStream } = useGenerationStream(projectId)

// Fetch project with generations
const { data: projectData, isLoading } = useQuery({
  queryKey: ['studio-project', projectId],
  queryFn: async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/studio/projects/${projectId.value}`,
      { credentials: 'include' },
    )
    if (!res.ok) throw new Error('Failed to fetch project')
    return res.json() as Promise<{
      project: { id: string; title: string | null; createdAt: string; updatedAt: string }
      generations: Array<{
        id: string
        projectId: string
        role: 'user' | 'assistant'
        content: string | null
        quotedImageIds: string[] | null
        provider: string | null
        model: string | null
        providerOptions: Record<string, unknown> | null
        images: Array<{ storageKey: string; type?: string }> | null
        status: string
        error: string | null
        createdAt: string
      }>
    }>
  },
  refetchInterval: (query) => {
    const gens = query.state.data?.generations ?? []
    return gens.some(g => g.status === 'pending' || g.status === 'processing') ? 3000 : false
  },
  refetchIntervalInBackground: false,
})

const generations = computed(() => projectData.value?.generations ?? [])

// Connect SSE streams for pending/processing generations
watch(generations, (gens) => {
  for (const gen of gens) {
    if ((gen.status === 'pending' || gen.status === 'processing') && gen.role === 'assistant') {
      connectStream(gen.id)
    }
  }
}, { immediate: true })

// Send generation mutation
const generateMutation = useMutation({
  mutationFn: async (payload: {
    content: string
    provider: 'openai' | 'google' | 'fal'
    model?: string
    options?: Record<string, unknown>
    uploadedImageUrls?: string[]
    quotedImageIds?: string[]
  }) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/studio/projects/${projectId.value}/generations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || 'Failed to create generation')
    }
    return res.json()
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] })
    queryClient.invalidateQueries({ queryKey: ['studio-projects'] })
    // Connect stream for the new assistant generation
    if (data.assistantGeneration?.id) {
      connectStream(data.assistantGeneration.id)
    }
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

// Batch generation mutation
const batchMutation = useMutation({
  mutationFn: async (payload: {
    prompt: string
    uploadedImageUrls: string[]
    provider: 'openai' | 'google' | 'fal'
    model?: string
    options?: Record<string, unknown>
  }) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/studio/projects/${projectId.value}/batch`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      },
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || 'Failed to create batch')
    }
    return res.json() as Promise<{ generationIds: string[] }>
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['studio-project', projectId] })
    queryClient.invalidateQueries({ queryKey: ['studio-projects'] })
    // Connect streams for all batch generations
    for (const id of data.generationIds) {
      connectStream(id)
    }
    batchPanelRef.value?.clear()
    batchMode.value = false
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function handleQuote(generationId: string) {
  if (!quotedGenerationIds.value.includes(generationId)) {
    quotedGenerationIds.value.push(generationId)
  }
}

function handleUnquote(generationId: string) {
  quotedGenerationIds.value = quotedGenerationIds.value.filter(id => id !== generationId)
}

// Resolve quoted generation IDs to storage keys from the current project's generations
function resolveQuotedStorageKeys(quotedIds: string[]): string[] {
  const keys: string[] = []
  for (const genId of quotedIds) {
    const gen = generations.value.find(g => g.id === genId)
    if (gen?.images) {
      for (const img of gen.images) {
        keys.push(img.storageKey)
      }
    }
  }
  return keys
}

async function handleGenerate(payload: {
  content: string
  provider: 'openai' | 'google' | 'fal'
  model?: string
  options?: Record<string, unknown>
  pendingFiles?: File[]
  quotedImageIds?: string[]
}) {
  // Check if provider changed from the current project's provider
  const prevProvider = lastUsedProvider.value
  const providerSwitched = prevProvider && prevProvider !== payload.provider

  if (batchMode.value && batchPanelRef.value?.batchImages?.length) {
    // Batch mode: upload all batch images first, then send batch request
    const batchImages = batchPanelRef.value.batchImages
    uploadBatchImages(batchImages.map(img => img.file), payload)
  } else {
    // Upload pending files first if any
    let uploadedStorageKeys: string[] | undefined
    if (payload.pendingFiles && payload.pendingFiles.length > 0) {
      uploadedStorageKeys = await uploadFiles(payload.pendingFiles)
      if (uploadedStorageKeys.length === 0) return
    }

    if (providerSwitched) {
      // Provider changed — create a new project and submit the generation there.
      // Resolve quoted image generation IDs to raw storage keys so the new
      // project doesn't need cross-project generation references.
      const quotedKeys = payload.quotedImageIds?.length
        ? resolveQuotedStorageKeys(payload.quotedImageIds)
        : []

      // Merge uploaded + quoted storage keys into a single uploadedImageUrls list
      const allImageKeys = [...(uploadedStorageKeys || []), ...quotedKeys]

      const switchPayload = {
        content: payload.content,
        provider: payload.provider,
        model: payload.model,
        options: payload.options,
        ...(allImageKeys.length > 0 ? { uploadedImageUrls: allImageKeys } : {}),
      }

      try {
        const newProjectId = await createProject()
        await submitGeneration(newProjectId, switchPayload)

        queryClient.invalidateQueries({ queryKey: ['studio-projects'] })

        // Navigate to the new project
        router.push({ name: 'studio-project', params: { id: newProjectId } })

        message.info(t('studio.providerSwitched'))
      } catch (err: unknown) {
        message.error(err instanceof Error ? err.message : 'Failed to create project')
      }
    } else {
      const mutationPayload = {
        content: payload.content,
        provider: payload.provider,
        model: payload.model,
        options: payload.options,
        ...(uploadedStorageKeys ? { uploadedImageUrls: uploadedStorageKeys } : {}),
        ...(payload.quotedImageIds?.length ? { quotedImageIds: payload.quotedImageIds } : {}),
      }
      generateMutation.mutate(mutationPayload)
    }

    // Clear quoted selections after submission
    quotedGenerationIds.value = []
  }
}

// Upload files to S3, return array of storage keys
// The worker resolves these to presigned URLs before sending to AI providers
async function uploadFiles(files: File[]): Promise<string[]> {
  const storageKeys: string[] = []
  for (const file of files) {
    upload.setFile(file)
    const result = await upload.uploadOnSubmit()
    if (result) {
      storageKeys.push(result.storageKey)
    }
    upload.reset()
  }
  return storageKeys
}

async function uploadBatchImages(
  files: File[],
  payload: {
    content: string
    provider: 'openai' | 'google' | 'fal'
    model?: string
    options?: Record<string, unknown>
  },
) {
  const storageKeys: string[] = []

  for (const file of files) {
    upload.setFile(file)
    const result = await upload.uploadOnSubmit()
    if (result) {
      storageKeys.push(result.storageKey)
    }
    upload.reset()
  }

  if (storageKeys.length > 0) {
    batchMutation.mutate({
      prompt: payload.content,
      uploadedImageUrls: storageKeys,
      provider: payload.provider,
      model: payload.model,
      options: payload.options,
    })
  }
}

// Detect the provider used in the current project's generations
const lastUsedProvider = computed(() => {
  const gens = generations.value
  // Find the last assistant generation that has a provider set
  for (let i = gens.length - 1; i >= 0; i--) {
    if (gens[i].role === 'assistant' && gens[i].provider) {
      return gens[i].provider
    }
  }
  return null
})

// Derive initial prompt bar settings from the last assistant generation in this project
const projectSettings = computed(() => {
  const gens = generations.value
  for (let i = gens.length - 1; i >= 0; i--) {
    const gen = gens[i]
    if (gen.role === 'assistant' && gen.provider) {
      return {
        provider: gen.provider as 'openai' | 'google' | 'fal',
        model: gen.model ?? undefined,
        providerOptions: gen.providerOptions ?? undefined,
      }
    }
  }
  return undefined
})

// Create a new project and return its ID
async function createProject(): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/studio/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error('Failed to create project')
  const data = await res.json() as { project: { id: string } }
  return data.project.id
}

// Submit a generation to a specific project (used when auto-creating a new project)
async function submitGeneration(targetProjectId: string, payload: {
  content: string
  provider: 'openai' | 'google' | 'fal'
  model?: string
  options?: Record<string, unknown>
  uploadedImageUrls?: string[]
  quotedImageIds?: string[]
}) {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/admin/studio/projects/${targetProjectId}/generations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Failed to create generation')
  }
  return res.json()
}

const isPending = computed(() => generateMutation.isPending.value || batchMutation.isPending.value)
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <!-- Conversation area -->
    <StudioConversation
      :generations="generations"
      :is-loading="isLoading"
      :quoted-ids="quotedGenerationIds"
      class="mb-2"
      @quote="handleQuote"
      @unquote="handleUnquote"
    />

    <!-- Batch panel -->
    <StudioBatchPanel
      v-if="batchMode"
      ref="batchPanelRef"
      @close="batchMode = false"
    />

    <!-- Prompt bar -->
    <StudioPromptBar
      :is-pending="isPending"
      :batch-mode="batchMode"
      :quoted-ids="quotedGenerationIds"
      :project-settings="projectSettings"
      @generate="handleGenerate"
      @toggle-batch="batchMode = !batchMode"
      @remove-quote="handleUnquote"
    />
  </div>
</template>
