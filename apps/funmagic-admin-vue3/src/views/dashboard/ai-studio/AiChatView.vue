<script setup lang="ts">
import { NButton, NIcon, NInput, NSelect, NSpin, NEmpty, NImage, NTag, NTooltip, NProgress } from 'naive-ui'
import { SendOutline, ImageOutline, CloseCircleOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { useUpload } from '@/composables/useUpload'

const { t } = useI18n()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const chatId = computed(() => route.params.id as string)
const messageInput = ref('')
const selectedProvider = ref<'openai' | 'google' | 'fal'>('openai')
const messagesContainer = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Image upload
const upload = useUpload({ module: 'ai-studio', visibility: 'admin-private' })
const uploadedImages = ref<Array<{ storageKey: string; preview: string }>>([])

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  upload.setFile(file)
  upload.uploadOnSubmit().then((result) => {
    if (result) {
      uploadedImages.value.push({
        storageKey: result.storageKey,
        preview: upload.preview.value!,
      })
    }
    upload.reset()
  })
}

function removeUploadedImage(index: number) {
  const img = uploadedImages.value[index]
  if (img.preview) URL.revokeObjectURL(img.preview)
  uploadedImages.value.splice(index, 1)
}

// Provider options state
const openaiOptions = reactive({
  size: 'auto' as 'auto' | '1024x1024' | '1536x1024' | '1024x1536',
  quality: 'medium' as 'low' | 'medium' | 'high',
  format: 'png' as 'png' | 'jpeg' | 'webp',
  background: 'opaque' as 'transparent' | 'opaque',
  moderation: 'auto' as 'low' | 'auto',
})

const googleOptions = reactive({
  aspectRatio: '1:1' as '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
  imageSize: '1K' as '1K' | '2K' | '4K',
})

const openaiSizeOptions = [
  { label: 'Auto', value: 'auto' },
  { label: '1024×1024', value: '1024x1024' },
  { label: '1536×1024', value: '1536x1024' },
  { label: '1024×1536', value: '1024x1536' },
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

const providerSelectOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Google', value: 'google' },
  { label: 'Fal', value: 'fal' },
]

// Build the options payload for the current provider
const currentOptions = computed(() => {
  if (selectedProvider.value === 'openai') {
    return { openai: { ...openaiOptions } }
  }
  if (selectedProvider.value === 'google') {
    return { google: { ...googleOptions } }
  }
  return undefined
})

// Fetch available providers
const { data: providersData } = useQuery({
  queryKey: ['ai-studio-providers'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/ai-studio/providers')
    if (error) throw new Error('Failed to fetch providers')
    return data
  },
})

const availableProviders = computed(() => {
  if (!providersData.value?.providers) return providerSelectOptions
  const activeProviders = Object.entries(providersData.value.providers)
    .filter(([_, isActive]) => isActive)
    .map(([name]) => ({
      label: name.charAt(0).toUpperCase() + name.slice(1),
      value: name,
    }))
  return activeProviders.length > 0 ? activeProviders : providerSelectOptions
})

// Fetch chat with messages
const { data: chatData, isLoading, isError } = useQuery({
  queryKey: ['ai-studio-chat', chatId],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/ai-studio/chats/{chatId}', {
      params: { path: { chatId: chatId.value } },
    })
    if (error) throw new Error(error.error ?? 'Failed to fetch chat')
    return data
  },
  refetchInterval: (query) => {
    const msgs = query.state.data?.messages ?? []
    return msgs.some(m => m.status === 'pending' || m.status === 'processing') ? 5000 : false
  },
  refetchIntervalInBackground: false,
})

const messages = computed(() => chatData.value?.messages ?? [])

const canSend = computed(() => {
  return messageInput.value.trim() && !upload.isUploading.value
})

// Send message mutation
const sendMessageMutation = useMutation({
  mutationFn: async () => {
    const content = messageInput.value.trim()
    if (!content) throw new Error('Message cannot be empty')

    const uploadedImageUrls = uploadedImages.value.map((img) =>
      `${import.meta.env.VITE_API_URL}/api/admin/ai-studio/assets/url?storageKey=${encodeURIComponent(img.storageKey)}`
    )

    const { data, error } = await api.POST('/api/admin/ai-studio/chats/{chatId}/messages', {
      params: { path: { chatId: chatId.value } },
      body: {
        content,
        provider: selectedProvider.value,
        options: currentOptions.value,
        ...(uploadedImageUrls.length > 0 ? { uploadedImageUrls } : {}),
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to send message')
    return data
  },
  onSuccess: () => {
    messageInput.value = ''
    // Clean up previews
    uploadedImages.value.forEach((img) => {
      if (img.preview) URL.revokeObjectURL(img.preview)
    })
    uploadedImages.value = []
    queryClient.invalidateQueries({ queryKey: ['ai-studio-chat', chatId] })
    scrollToBottom()
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function handleSend() {
  if (!canSend.value) return
  sendMessageMutation.mutate()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function getImageUrl(storageKey: string): string {
  return `${import.meta.env.VITE_API_URL}/api/admin/ai-studio/assets/url?storageKey=${encodeURIComponent(storageKey)}`
}

// Auto-scroll when new messages arrive
watch(() => messages.value.length, (newLen, oldLen) => {
  if (newLen > (oldLen ?? 0)) {
    scrollToBottom()
  }
})
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0">
    <!-- Messages area -->
    <n-card class="chat-card min-h-0 flex-1 overflow-hidden border-0 rounded-none mb-3">
      <div v-if="isLoading" class="flex h-full items-center justify-center">
        <NSpin size="large" />
      </div>

      <div v-else-if="isError" class="flex h-full items-center justify-center">
        <NEmpty :description="t('aiStudio.chatLoadFailed')" />
      </div>

      <div
        v-else
        ref="messagesContainer"
        class="chat-messages flex flex-1 flex-col gap-4 overflow-y-auto pb-4"
      >
        <NEmpty
          v-if="messages.length === 0"
          :description="t('aiStudio.noMessages')"
          class="py-12"
        />

        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex gap-3"
          :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-lg p-3"
            :class="
              msg.role === 'user'
                ? 'bg-primary/10 text-foreground'
                : 'bg-muted text-foreground'
            "
          >
            <p v-if="msg.content" class="whitespace-pre-wrap text-sm">{{ msg.content }}</p>

            <div v-if="msg.role === 'assistant' && msg.status !== 'completed'" class="mt-2">
              <NTag
                :type="msg.status === 'failed' ? 'error' : 'info'"
                size="small"
              >
                {{ msg.status }}
              </NTag>
              <NSpin v-if="msg.status === 'processing' || msg.status === 'pending'" size="small" class="ml-2" />
            </div>

            <p v-if="msg.error" class="mt-1 text-xs text-red-500">{{ msg.error }}</p>

            <div v-if="msg.images && msg.images.length > 0" class="mt-2 flex flex-wrap gap-2">
              <div v-for="(img, idx) in msg.images" :key="idx" class="overflow-hidden rounded">
                <NImage
                  :src="getImageUrl(img.storageKey)"
                  width="200"
                  lazy
                  :alt="`Generated image ${idx + 1}`"
                />
              </div>
            </div>

            <div
              v-if="msg.role === 'assistant' && msg.provider"
              class="mt-1 text-xs text-muted-foreground"
            >
              {{ msg.provider }}{{ msg.model ? ` / ${msg.model}` : '' }}
            </div>
          </div>
        </div>
      </div>
    </n-card>

    <!-- Composer area -->
    <div class="shrink-0 rounded-lg border border-border">
      <!-- Options bar -->
      <div
        v-if="selectedProvider === 'openai' || selectedProvider === 'google'"
        class="flex items-center gap-2 rounded-t-lg bg-muted/50 px-3 py-2"
      >
        <template v-if="selectedProvider === 'openai'">
          <div class="min-w-0 flex-1">
            <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('aiStudio.options.size') }}</label>
            <NSelect v-model:value="openaiOptions.size" :options="openaiSizeOptions" size="tiny" />
          </div>
          <div class="min-w-0 flex-1">
            <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('aiStudio.options.quality') }}</label>
            <NSelect v-model:value="openaiOptions.quality" :options="openaiQualityOptions" size="tiny" />
          </div>
          <div class="min-w-0 flex-1">
            <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('aiStudio.options.format') }}</label>
            <NSelect v-model:value="openaiOptions.format" :options="openaiFormatOptions" size="tiny" />
          </div>
          <div class="min-w-0 flex-1">
            <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('aiStudio.options.background') }}</label>
            <NSelect v-model:value="openaiOptions.background" :options="openaiBackgroundOptions" size="tiny" />
          </div>
          <div class="min-w-0 flex-1">
            <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('aiStudio.options.moderation') }}</label>
            <NSelect v-model:value="openaiOptions.moderation" :options="openaiModerationOptions" size="tiny" />
          </div>
        </template>

        <template v-if="selectedProvider === 'google'">
          <div class="min-w-0 flex-1">
            <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('aiStudio.options.aspectRatio') }}</label>
            <NSelect v-model:value="googleOptions.aspectRatio" :options="googleAspectRatioOptions" size="tiny" />
          </div>
          <div class="min-w-0 flex-1">
            <label class="mb-0.5 block text-xs text-muted-foreground">{{ t('aiStudio.options.imageSize') }}</label>
            <NSelect v-model:value="googleOptions.imageSize" :options="googleImageSizeOptions" size="tiny" />
          </div>
        </template>
      </div>

      <!-- Upload previews -->
      <div
        v-if="uploadedImages.length > 0 || upload.isUploading.value"
        class="flex flex-wrap items-center gap-2 px-3 pt-2"
      >
        <div
          v-for="(img, idx) in uploadedImages"
          :key="idx"
          class="group relative h-16 w-16 overflow-hidden rounded-md border border-border"
        >
          <img :src="img.preview" class="h-full w-full object-cover" alt="" />
          <button
            class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
            @click="removeUploadedImage(idx)"
          >
            <NIcon :size="12"><CloseCircleOutline /></NIcon>
          </button>
        </div>
        <div v-if="upload.isUploading.value" class="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border">
          <NProgress type="circle" :percentage="upload.progress.value" :show-indicator="false" :stroke-width="3" style="width: 28px" />
        </div>
      </div>

      <!-- Text input -->
      <div class="px-3 pt-2">
        <NInput
          v-model:value="messageInput"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :placeholder="t('aiStudio.typeMessage')"
          :disabled="sendMessageMutation.isPending.value"
          class="composer-input"
          @keydown="handleKeydown"
        />
      </div>

      <!-- Action bar: upload, provider, send -->
      <div class="flex items-center justify-between px-3 py-2">
        <div class="flex items-center gap-2">
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
            {{ t('aiStudio.uploadImage') }}
          </NTooltip>
        </div>

        <div class="flex items-center gap-2">
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
            :loading="sendMessageMutation.isPending.value"
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
  </div>
</template>

<style scoped>
.chat-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.composer-input :deep(.n-input__border),
.composer-input :deep(.n-input__state-border) {
  border: none !important;
  box-shadow: none !important;
}

.provider-select {
  width: fit-content !important;
  min-width: 80px;
}

.provider-select :deep(.n-base-selection) {
  width: fit-content !important;
}
</style>
