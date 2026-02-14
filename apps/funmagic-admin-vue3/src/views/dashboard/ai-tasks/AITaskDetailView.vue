<script setup lang="ts">
import {
  NButton,
  NIcon,
  NSpin,
  NEmpty,
  NCard,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NImage,
  NAlert,
} from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const chatId = computed(() => route.params.id as string)

interface MessageImage {
  storageKey: string
  type?: string
}

interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string | null
  quotedImageIds: string[] | null
  provider: string | null
  model: string | null
  images: MessageImage[] | null
  status: string
  error: string | null
  createdAt: string
}

interface ChatDetail {
  chat: {
    id: string
    title: string | null
    createdAt: string
    updatedAt: string
  }
  messages: Message[]
}

const { data, isLoading, isError } = useQuery({
  queryKey: computed(() => ['admin', 'ai-tasks', chatId.value]),
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/ai-studio/chats/{chatId}', {
      params: { path: { chatId: chatId.value } },
    })
    if (error) throw new Error('Failed to fetch chat')
    return data as ChatDetail
  },
  enabled: computed(() => !!chatId.value),
})

const chat = computed(() => data.value?.chat ?? null)
const messages = computed(() => data.value?.messages ?? [])

const assistantMessages = computed(() => messages.value.filter(m => m.role === 'assistant'))
const completedCount = computed(() => assistantMessages.value.filter(m => m.status === 'completed').length)
const failedCount = computed(() => assistantMessages.value.filter(m => m.status === 'failed').length)
const processingCount = computed(() => assistantMessages.value.filter(m => m.status === 'processing' || m.status === 'pending').length)

// Fetch presigned URLs for images
const imageUrls = ref<Record<string, string>>({})

async function getImageUrl(storageKey: string) {
  if (imageUrls.value[storageKey]) return imageUrls.value[storageKey]
  try {
    const { data } = await api.GET('/api/admin/ai-studio/assets/url', {
      params: { query: { storageKey } },
    })
    const url = data?.url
    if (url) {
      imageUrls.value[storageKey] = url
    }
    return url
  } catch {
    return null
  }
}

// Load images when data is available
watch(messages, async (msgs) => {
  for (const msg of msgs) {
    if (msg.images) {
      for (const img of msg.images) {
        if (img.storageKey && !imageUrls.value[img.storageKey]) {
          getImageUrl(img.storageKey)
        }
      }
    }
  }
}, { immediate: true })

// Find the user message that precedes an assistant message
function getUserPrompt(assistantMsg: Message): string | null {
  const idx = messages.value.indexOf(assistantMsg)
  if (idx <= 0) return null
  const prev = messages.value[idx - 1]
  return prev?.role === 'user' ? prev.content : null
}
</script>

<template>
  <div>
    <PageHeader :title="t('aiTasks.conversationDetail')">
      <template #actions>
        <NButton @click="router.push({ name: 'ai-tasks' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <div v-else-if="isError || !chat" class="rounded-lg border border-dashed p-8 text-center md:p-12">
      <NEmpty :description="t('aiTasks.loadFailed')" />
    </div>

    <div v-else class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('aiTasks.conversation') }}</div>
          <div class="mt-1 text-lg font-semibold truncate">{{ chat.title || t('aiTasks.untitled') }}</div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('tasks.completed') }}</div>
          <div class="mt-1 text-lg font-semibold text-green-600">{{ completedCount }}</div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('tasks.processing') }}</div>
          <div class="mt-1 text-lg font-semibold text-blue-600">{{ processingCount }}</div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('tasks.failed') }}</div>
          <div class="mt-1 text-lg font-semibold text-red-600">{{ failedCount }}</div>
        </NCard>
      </div>

      <!-- Conversation Info -->
      <NCard :title="t('aiTasks.conversationInfo')" size="small">
        <NDescriptions label-placement="left" :column="2" bordered>
          <NDescriptionsItem :label="t('common.id')">
            {{ chat.id }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('common.createdAt')">
            {{ new Date(chat.createdAt).toLocaleString() }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('aiTasks.lastActivity')">
            {{ new Date(chat.updatedAt).toLocaleString() }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('aiTasks.messageCount')">
            {{ messages.length }} total / {{ assistantMessages.length }} tasks
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- Messages Accordion -->
      <NCard :title="t('aiTasks.messages')" size="small">
        <NCollapse v-if="assistantMessages.length > 0">
          <NCollapseItem
            v-for="(msg, idx) in assistantMessages"
            :key="msg.id"
            :name="msg.id"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium">#{{ idx + 1 }}</span>
                <StatusBadge :status="msg.status" />
                <span v-if="msg.provider" class="text-xs text-gray-500">
                  {{ msg.provider }}{{ msg.model ? ` / ${msg.model}` : '' }}
                </span>
                <span class="text-xs text-gray-400 ml-auto">
                  {{ new Date(msg.createdAt).toLocaleString() }}
                </span>
              </div>
            </template>

            <div class="space-y-4">
              <!-- User prompt -->
              <div v-if="getUserPrompt(msg)">
                <div class="text-xs font-medium text-gray-500 mb-1">{{ t('aiTasks.input') }}</div>
                <div class="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm whitespace-pre-wrap">
                  {{ getUserPrompt(msg) }}
                </div>
              </div>

              <!-- Provider / Model -->
              <NDescriptions v-if="msg.provider" label-placement="left" :column="2" size="small" bordered>
                <NDescriptionsItem :label="t('aiTasks.provider')">
                  {{ msg.provider }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="t('aiTasks.model')">
                  {{ msg.model || '--' }}
                </NDescriptionsItem>
              </NDescriptions>

              <!-- Response -->
              <div v-if="msg.content">
                <div class="text-xs font-medium text-gray-500 mb-1">{{ t('aiTasks.response') }}</div>
                <div class="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm whitespace-pre-wrap">
                  {{ msg.content }}
                </div>
              </div>

              <!-- Images -->
              <div v-if="msg.images && msg.images.length > 0">
                <div class="text-xs font-medium text-gray-500 mb-1">{{ t('aiTasks.images') }} ({{ msg.images.length }})</div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="(img, imgIdx) in msg.images" :key="imgIdx" class="w-32 h-32 rounded border overflow-hidden">
                    <NImage
                      v-if="imageUrls[img.storageKey]"
                      :src="imageUrls[img.storageKey]"
                      object-fit="cover"
                      class="w-full h-full"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100 dark:bg-gray-800">
                      {{ t('common.loading') }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error -->
              <NAlert v-if="msg.error" type="error" :title="t('aiTasks.error')">
                {{ msg.error }}
              </NAlert>
            </div>
          </NCollapseItem>
        </NCollapse>
        <NEmpty v-else :description="t('aiTasks.noAssistantMessages')" />
      </NCard>
    </div>
  </div>
</template>
