<script setup lang="ts">
import { NButton, NIcon, NInput, NSelect, NTag, NTooltip } from 'naive-ui'
import { SendOutline, ImageOutline, CloseOutline, LayersOutline, LinkOutline } from '@vicons/ionicons5'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { useUpload } from '@/composables/useUpload'

const { t } = useI18n()

const emit = defineEmits<{
  generate: [payload: {
    content: string
    provider: 'openai' | 'google' | 'fal'
    model?: string
    options?: Record<string, unknown>
    pendingFiles?: File[]
    quotedImageIds?: string[]
  }]
  toggleBatch: []
  removeQuote: [id: string]
}>()

const props = defineProps<{
  isPending: boolean
  batchMode: boolean
  quotedIds?: string[]
  projectSettings?: {
    provider: 'openai' | 'google' | 'fal'
    model?: string
    providerOptions?: Record<string, unknown>
  }
}>()

const SETTINGS_KEY = 'studio-prompt-settings'

function loadSessionSettings() {
  try {
    const raw = sessionStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const saved = loadSessionSettings()

const promptInput = ref('')
const selectedProvider = ref<'openai' | 'google' | 'fal'>(saved?.provider ?? 'openai')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Image upload - files stored locally until submit
const upload = useUpload({ module: 'studio', visibility: 'admin-private' })
const pendingImages = ref<Array<{ file: File; preview: string }>>([])

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  // Check for duplicate by name + size
  const isDuplicate = pendingImages.value.some(
    img => img.file.name === file.name && img.file.size === file.size,
  )
  if (isDuplicate) return

  pendingImages.value.push({
    file,
    preview: URL.createObjectURL(file),
  })
}

function removePendingImage(index: number) {
  const img = pendingImages.value[index]
  if (img.preview) URL.revokeObjectURL(img.preview)
  pendingImages.value.splice(index, 1)
}

// Model selectors (OpenAI only)
const selectedModel = ref(saved?.model ?? 'gpt-5-mini')

const modelOptions = [
  { label: 'GPT-5', value: 'gpt-5' },
  { label: 'GPT-5 Mini', value: 'gpt-5-mini' },
]

// Google model selector
const selectedGoogleModel = ref(saved?.googleModel ?? 'gemini-2.5-flash-image')

const googleModelOptions = [
  { label: 'Gemini 2.5 Flash Image', value: 'gemini-2.5-flash-image' },
  { label: 'Gemini 3 Pro Image', value: 'gemini-3-pro-image-preview' },
]

// Provider options (restored from session if available)
const openaiOptions = reactive({
  size: (saved?.openaiOptions?.size ?? 'auto') as 'auto' | '1024x1024' | '1536x1024' | '1024x1536',
  quality: (saved?.openaiOptions?.quality ?? 'medium') as 'low' | 'medium' | 'high',
  format: (saved?.openaiOptions?.format ?? 'png') as 'png' | 'jpeg' | 'webp',
  background: (saved?.openaiOptions?.background ?? 'opaque') as 'transparent' | 'opaque',
  moderation: (saved?.openaiOptions?.moderation ?? 'auto') as 'low' | 'auto',
  imageModel: (saved?.openaiOptions?.imageModel ?? 'gpt-image-1.5') as 'gpt-image-1' | 'gpt-image-1.5',
})

const googleOptions = reactive({
  aspectRatio: (saved?.googleOptions?.aspectRatio ?? '1:1') as string,
  imageSize: (saved?.googleOptions?.imageSize ?? '1K') as string,
})

const falOptions = reactive({
  tool: (saved?.falOptions?.tool ?? 'background-remove') as 'background-remove' | 'upscale',
})

const showOptions = ref(false)

const openaiSizeOptions = [
  { label: 'Auto', value: 'auto' },
  { label: '1024x1024', value: '1024x1024' },
  { label: '1536x1024', value: '1536x1024' },
  { label: '1024x1536', value: '1024x1536' },
]

const openaiQualityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
]

const openaiFormatOptions = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
]

const openaiBackgroundOptions = [
  { label: 'Opaque', value: 'opaque' },
  { label: 'Transparent', value: 'transparent' },
]

const openaiModerationOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Low', value: 'low' },
]

const openaiImageModelOptions = [
  { label: 'GPT Image 1', value: 'gpt-image-1' },
  { label: 'GPT Image 1.5', value: 'gpt-image-1.5' },
]

const googleAspectRatioOptions = [
  { label: '1:1', value: '1:1' },
  { label: '2:3', value: '2:3' },
  { label: '3:2', value: '3:2' },
  { label: '3:4', value: '3:4' },
  { label: '4:3', value: '4:3' },
  { label: '4:5', value: '4:5' },
  { label: '5:4', value: '5:4' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '21:9', value: '21:9' },
]

const googleImageSizeOptions = [
  { label: '1K', value: '1K' },
  { label: '2K', value: '2K' },
  { label: '4K', value: '4K' },
]

const falToolOptions = [
  { label: 'Background Remove', value: 'background-remove' },
  { label: 'Upscale', value: 'upscale' },
]

const providerSelectOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Google', value: 'google' },
  { label: 'Fal', value: 'fal' },
]

// Fetch available providers
const { data: providersData } = useQuery({
  queryKey: ['studio-providers'],
  queryFn: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/studio/providers`, { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to fetch providers')
    return res.json() as Promise<{ providers: { openai: boolean; google: boolean; fal: boolean } }>
  },
})

const availableProviders = computed(() => {
  if (!providersData.value?.providers) return providerSelectOptions
  const active = Object.entries(providersData.value.providers)
    .filter(([_, isActive]) => isActive)
    .map(([name]) => ({
      label: name.charAt(0).toUpperCase() + name.slice(1),
      value: name,
    }))
  return active.length > 0 ? active : providerSelectOptions
})

const currentOptions = computed(() => {
  if (selectedProvider.value === 'openai') {
    const { imageModel, ...rest } = openaiOptions
    return { openai: { ...rest, imageModel } }
  }
  if (selectedProvider.value === 'google') {
    return { google: { ...googleOptions } }
  }
  if (selectedProvider.value === 'fal') {
    return { fal: { ...falOptions } }
  }
  return undefined
})

const canSend = computed(() => {
  if (props.isPending) return false
  // Fal provider only needs images, no prompt required
  if (selectedProvider.value === 'fal') {
    return pendingImages.value.length > 0 || (props.quotedIds && props.quotedIds.length > 0)
  }
  return !!promptInput.value.trim()
})

function handleSend() {
  if (!canSend.value) return

  emit('generate', {
    content: promptInput.value.trim(),
    provider: selectedProvider.value,
    model: selectedProvider.value === 'openai'
      ? selectedModel.value
      : selectedProvider.value === 'google'
        ? selectedGoogleModel.value
        : undefined,
    options: currentOptions.value,
    pendingFiles: pendingImages.value.map(img => img.file),
    ...(props.quotedIds?.length ? { quotedImageIds: [...props.quotedIds] } : {}),
  })

  promptInput.value = ''
  // Clean up previews
  pendingImages.value.forEach((img) => {
    if (img.preview) URL.revokeObjectURL(img.preview)
  })
  pendingImages.value = []
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// Restore settings from project history when available (overrides sessionStorage)
watch(
  () => props.projectSettings,
  (settings) => {
    if (!settings) return

    selectedProvider.value = settings.provider

    // Restore model based on provider
    if (settings.provider === 'openai' && settings.model) {
      selectedModel.value = settings.model
    } else if (settings.provider === 'google' && settings.model) {
      selectedGoogleModel.value = settings.model
    }

    // Restore provider-specific options
    const opts = settings.providerOptions
    if (!opts) return

    const openaiOpts = opts.openai as Record<string, string> | undefined
    if (openaiOpts) {
      if (openaiOpts.size) openaiOptions.size = openaiOpts.size as typeof openaiOptions.size
      if (openaiOpts.quality) openaiOptions.quality = openaiOpts.quality as typeof openaiOptions.quality
      if (openaiOpts.format) openaiOptions.format = openaiOpts.format as typeof openaiOptions.format
      if (openaiOpts.background) openaiOptions.background = openaiOpts.background as typeof openaiOptions.background
      if (openaiOpts.moderation) openaiOptions.moderation = openaiOpts.moderation as typeof openaiOptions.moderation
      if (openaiOpts.imageModel) openaiOptions.imageModel = openaiOpts.imageModel as typeof openaiOptions.imageModel
    }

    const googleOpts = opts.google as Record<string, string> | undefined
    if (googleOpts) {
      if (googleOpts.aspectRatio) googleOptions.aspectRatio = googleOpts.aspectRatio
      if (googleOpts.imageSize) googleOptions.imageSize = googleOpts.imageSize
    }

    const falOpts = opts.fal as Record<string, string> | undefined
    if (falOpts) {
      if (falOpts.tool) falOptions.tool = falOpts.tool as typeof falOptions.tool
    }
  },
  { immediate: true },
)

// Persist settings to sessionStorage so they survive project navigation
watch(
  [selectedProvider, selectedModel, selectedGoogleModel,
   () => ({ ...openaiOptions }), () => ({ ...googleOptions }), () => ({ ...falOptions })],
  () => {
    sessionStorage.setItem(SETTINGS_KEY, JSON.stringify({
      provider: selectedProvider.value,
      model: selectedModel.value,
      googleModel: selectedGoogleModel.value,
      openaiOptions: { ...openaiOptions },
      googleOptions: { ...googleOptions },
      falOptions: { ...falOptions },
    }))
  },
  { deep: true },
)
</script>

<template>
  <div class="shrink-0 rounded-lg border border-border">
    <!-- Quoted images bar -->
    <div
      v-if="quotedIds && quotedIds.length > 0"
      class="flex items-center gap-2 rounded-t-lg bg-primary/5 px-3 py-2"
    >
      <NIcon :size="14" class="shrink-0 text-primary"><LinkOutline /></NIcon>
      <span class="shrink-0 text-xs font-medium text-primary">
        {{ t('studio.quotedImages') }} ({{ quotedIds.length }})
      </span>
      <div class="flex flex-wrap gap-1">
        <NTag
          v-for="qid in quotedIds"
          :key="qid"
          size="tiny"
          closable
          @close="emit('removeQuote', qid)"
        >
          {{ qid.slice(0, 8) }}...
        </NTag>
      </div>
    </div>

    <!-- Collapsible options bar -->
    <div
      v-if="showOptions"
      class="grid grid-cols-2 gap-2 rounded-t-lg bg-muted/50 px-3 py-2 sm:grid-cols-3 md:grid-cols-6"
    >
      <template v-if="selectedProvider === 'openai'">
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.size') }}</label>
          <NSelect v-model:value="openaiOptions.size" :options="openaiSizeOptions" size="tiny" />
        </div>
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.quality') }}</label>
          <NSelect v-model:value="openaiOptions.quality" :options="openaiQualityOptions" size="tiny" />
        </div>
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.format') }}</label>
          <NSelect v-model:value="openaiOptions.format" :options="openaiFormatOptions" size="tiny" />
        </div>
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.background') }}</label>
          <NSelect v-model:value="openaiOptions.background" :options="openaiBackgroundOptions" size="tiny" />
        </div>
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.moderation') }}</label>
          <NSelect v-model:value="openaiOptions.moderation" :options="openaiModerationOptions" size="tiny" />
        </div>
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.imageModel') }}</label>
          <NSelect v-model:value="openaiOptions.imageModel" :options="openaiImageModelOptions" size="tiny" />
        </div>
      </template>

      <template v-if="selectedProvider === 'google'">
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.aspectRatio') }}</label>
          <NSelect v-model:value="googleOptions.aspectRatio" :options="googleAspectRatioOptions" size="tiny" />
        </div>
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.imageSize') }}</label>
          <NSelect v-model:value="googleOptions.imageSize" :options="googleImageSizeOptions" size="tiny" />
        </div>
      </template>

      <template v-if="selectedProvider === 'fal'">
        <div class="min-w-0">
          <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('studio.options.tool') }}</label>
          <NSelect v-model:value="falOptions.tool" :options="falToolOptions" size="tiny" />
        </div>
      </template>
    </div>

    <!-- Upload previews -->
    <div
      v-if="pendingImages.length > 0"
      class="flex flex-wrap items-center gap-2 px-3 pt-2"
    >
      <div
        v-for="(img, idx) in pendingImages"
        :key="idx"
        class="group relative h-16 w-16"
      >
        <div class="h-full w-full overflow-hidden rounded-md border border-border">
          <img :src="img.preview" class="h-full w-full object-cover" alt="" />
        </div>
        <button
          class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
          @click="removePendingImage(idx)"
        >
          <NIcon :size="14"><CloseOutline /></NIcon>
        </button>
      </div>
    </div>

    <!-- Text input -->
    <div class="px-3 pt-2">
      <NInput
        v-model:value="promptInput"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 6 }"
        :placeholder="t('studio.typePrompt')"
        :disabled="isPending"
        class="prompt-input"
        @keydown="handleKeydown"
      />
    </div>

    <!-- Action bar -->
    <div class="flex items-center justify-between px-3 py-2">
      <div class="flex items-center gap-1">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />
        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              quaternary
              :disabled="upload.isUploading.value"
              @click="fileInputRef?.click()"
            >
              <template #icon>
                <NIcon><ImageOutline /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('studio.uploadImage') }}
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <NButton
              size="small"
              :quaternary="!batchMode"
              :type="batchMode ? 'primary' : 'default'"
              @click="emit('toggleBatch')"
            >
              <template #icon>
                <NIcon><LayersOutline /></NIcon>
              </template>
            </NButton>
          </template>
          {{ t('studio.batchMode') }}
        </NTooltip>

        <NButton
          size="small"
          quaternary
          @click="showOptions = !showOptions"
        >
          {{ t('studio.options.label') }}
        </NButton>
      </div>

      <div class="flex items-center gap-2">
        <NSelect
          v-if="selectedProvider === 'openai'"
          v-model:value="selectedModel"
          :options="modelOptions"
          size="small"
          :consistent-menu-width="false"
          class="model-select"
        />
        <NSelect
          v-if="selectedProvider === 'google'"
          v-model:value="selectedGoogleModel"
          :options="googleModelOptions"
          size="small"
          :consistent-menu-width="false"
          class="model-select"
        />
        <NSelect
          v-model:value="selectedProvider"
          :options="availableProviders"
          size="small"
          :consistent-menu-width="false"
          class="provider-select"
        />
        <NButton
          type="primary"
          size="small"
          :loading="isPending"
          :disabled="!canSend"
          @click="handleSend"
        >
          <template #icon>
            <NIcon><SendOutline /></NIcon>
          </template>
        </NButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.provider-select,
.model-select {
  width: fit-content !important;
  min-width: 80px;
}

.provider-select :deep(.n-base-selection),
.model-select :deep(.n-base-selection) {
  width: fit-content !important;
}
</style>
