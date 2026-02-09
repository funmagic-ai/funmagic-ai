<script setup lang="ts">
import { NButton, NIcon, NInput, NSelect, NSpin, NEmpty, NImage, NTag } from 'naive-ui'
import { ArrowBackOutline, SendOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const chatId = computed(() => route.params.id as string)
const messageInput = ref('')
const selectedProvider = ref<'openai' | 'google' | 'fal'>('openai')
const messagesContainer = ref<HTMLDivElement | null>(null)

const providerOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Google', value: 'google' },
  { label: 'Fal', value: 'fal' },
]

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
  if (!providersData.value?.providers) return providerOptions
  const activeProviders = Object.entries(providersData.value.providers)
    .filter(([_, isActive]) => isActive)
    .map(([name]) => ({
      label: name.charAt(0).toUpperCase() + name.slice(1),
      value: name,
    }))
  return activeProviders.length > 0 ? activeProviders : providerOptions
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
  refetchInterval: 5000, // Poll for status updates
})

const messages = computed(() => chatData.value?.messages ?? [])
const chatTitle = computed(() => chatData.value?.chat?.title || 'Untitled Chat')

// Send message mutation
const sendMessageMutation = useMutation({
  mutationFn: async () => {
    const content = messageInput.value.trim()
    if (!content) throw new Error('Message cannot be empty')

    const { data, error } = await api.POST('/api/admin/ai-studio/chats/{chatId}/messages', {
      params: { path: { chatId: chatId.value } },
      body: {
        content,
        provider: selectedProvider.value,
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to send message')
    return data
  },
  onSuccess: () => {
    messageInput.value = ''
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
  if (!messageInput.value.trim()) return
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

// Auto-scroll on initial load
watch(messages, () => {
  scrollToBottom()
}, { once: true })
</script>

<template>
  <div class="flex h-[calc(100vh-8rem)] flex-col">
    <PageHeader :title="chatTitle">
      <template #actions>
        <NButton @click="router.push({ name: 'ai-studio' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <!-- Messages area -->
    <n-card class="flex-1 overflow-hidden">
      <div v-if="isLoading" class="flex h-full items-center justify-center">
        <NSpin size="large" />
      </div>

      <div v-else-if="isError" class="flex h-full items-center justify-center">
        <NEmpty description="Failed to load chat" />
      </div>

      <div
        v-else
        ref="messagesContainer"
        class="flex h-[calc(100vh-20rem)] flex-col gap-4 overflow-y-auto pb-4"
      >
        <NEmpty
          v-if="messages.length === 0"
          description="No messages yet. Send a prompt to generate an image."
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
            <!-- Message content -->
            <p v-if="msg.content" class="whitespace-pre-wrap text-sm">{{ msg.content }}</p>

            <!-- Status tag for assistant messages -->
            <div v-if="msg.role === 'assistant' && msg.status !== 'completed'" class="mt-2">
              <NTag
                :type="msg.status === 'failed' ? 'error' : 'info'"
                size="small"
              >
                {{ msg.status }}
              </NTag>
              <NSpin v-if="msg.status === 'processing' || msg.status === 'pending'" size="small" class="ml-2" />
            </div>

            <!-- Error message -->
            <p v-if="msg.error" class="mt-1 text-xs text-red-500">{{ msg.error }}</p>

            <!-- Images -->
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

            <!-- Provider info -->
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

    <!-- Input area -->
    <div class="mt-4 flex items-end gap-3">
      <NSelect
        v-model:value="selectedProvider"
        :options="availableProviders"
        size="large"
        class="w-36 shrink-0"
        :placeholder="t('aiStudio.selectProvider')"
      />

      <NInput
        v-model:value="messageInput"
        type="textarea"
        size="large"
        :autosize="{ minRows: 1, maxRows: 4 }"
        :placeholder="t('aiStudio.typeMessage')"
        :disabled="sendMessageMutation.isPending.value"
        @keydown="handleKeydown"
      />

      <NButton
        type="primary"
        size="large"
        :loading="sendMessageMutation.isPending.value"
        :disabled="!messageInput.trim()"
        @click="handleSend"
      >
        <template #icon>
          <NIcon><SendOutline /></NIcon>
        </template>
      </NButton>
    </div>
  </div>
</template>
