<script setup lang="ts">
import { NButton, NIcon, NEmpty, NSpin, NPopconfirm, NTime, NScrollbar } from 'naive-ui'
import { AddOutline, ChatboxOutline, TrashOutline, ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const activeChatId = computed(() => route.params.id as string | undefined)
const isChatSelected = computed(() => !!activeChatId.value)

const { data, isLoading, isError } = useQuery({
  queryKey: ['ai-studio-chats'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/ai-studio/chats')
    if (error) throw new Error('Failed to fetch chats')
    return data
  },
})

const createChatMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/admin/ai-studio/chats', {
      body: {},
    })
    if (error) throw new Error((error as { error?: string }).error ?? 'Failed to create chat')
    return data
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['ai-studio-chats'] })
    router.push({ name: 'ai-studio-chat', params: { id: data.chat.id } })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

const deleteChatMutation = useMutation({
  mutationFn: async (chatId: string) => {
    const { error } = await api.DELETE('/api/admin/ai-studio/chats/{chatId}', {
      params: { path: { chatId } },
    })
    if (error) throw new Error(error.error ?? 'Failed to delete chat')
  },
  onSuccess: (_data, chatId) => {
    queryClient.invalidateQueries({ queryKey: ['ai-studio-chats'] })
    message.success(t('common.chatDeleted'))
    // If we deleted the active chat, navigate to empty state
    if (activeChatId.value === chatId) {
      router.push({ name: 'ai-studio' })
    }
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

const chats = computed(() => data.value?.chats ?? [])
</script>

<template>
  <div class="flex h-[calc(100dvh-6rem)] flex-col md:h-[calc(100dvh-7.5rem)]">
    <!-- Header -->
    <div class="mb-4 flex shrink-0 items-center justify-between">
      <!-- Mobile back button when chat is selected -->
      <div class="flex items-center gap-2">
        <NButton
          v-if="isChatSelected"
          class="md:hidden"
          quaternary
          @click="router.push({ name: 'ai-studio' })"
        >
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
        </NButton>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('aiStudio.title') }}</h1>
      </div>
      <NButton
        type="primary"
        :loading="createChatMutation.isPending.value"
        @click="createChatMutation.mutate()"
      >
        <template #icon>
          <NIcon><AddOutline /></NIcon>
        </template>
        {{ t('aiStudio.newChat') }}
      </NButton>
    </div>

    <!-- Two-column body -->
    <div class="flex min-h-0 flex-1 items-stretch gap-3 overflow-hidden">
      <!-- Left sidebar: chat list -->
      <div
        class="w-full shrink-0 overflow-hidden rounded-lg border border-border bg-card md:flex md:w-72 md:flex-col"
        :class="isChatSelected ? 'hidden' : 'flex flex-col'"
      >
        <div class="border-b border-border px-4 py-3">
          <h2 class="text-sm font-semibold text-muted-foreground">{{ t('aiStudio.recentChats') }}</h2>
        </div>

        <div v-if="isLoading" class="flex flex-1 items-center justify-center py-12">
          <NSpin size="medium" />
        </div>

        <div v-else-if="isError" class="flex flex-1 items-center justify-center px-4">
          <NEmpty :description="t('aiStudio.loadFailed')" size="small">
            <template #extra>
              <NButton size="small" @click="() => queryClient.invalidateQueries({ queryKey: ['ai-studio-chats'] })">
                {{ t('common.retry') }}
              </NButton>
            </template>
          </NEmpty>
        </div>

        <div v-else-if="chats.length === 0" class="flex flex-1 items-center justify-center px-4">
          <NEmpty :description="t('aiStudio.noChats')" size="small" />
        </div>

        <NScrollbar v-else class="flex-1">
          <div class="flex flex-col">
            <div
              v-for="chat in chats"
              :key="chat.id"
              class="group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50"
              :class="activeChatId === chat.id ? 'bg-muted' : ''"
              @click="router.push({ name: 'ai-studio-chat', params: { id: chat.id } })"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <NIcon :size="16" class="text-primary">
                  <ChatboxOutline />
                </NIcon>
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">
                  {{ chat.title || t('aiStudio.untitledChat') }}
                </div>
                <div class="text-xs text-muted-foreground">
                  <NTime :time="new Date(chat.createdAt)" type="relative" />
                </div>
              </div>
              <NPopconfirm
                @positive-click.stop="deleteChatMutation.mutate(chat.id)"
              >
                <template #trigger>
                  <NButton
                    size="tiny"
                    quaternary
                    type="error"
                    class="opacity-0 group-hover:opacity-100"
                    @click.stop
                  >
                    <template #icon>
                      <NIcon :size="14"><TrashOutline /></NIcon>
                    </template>
                  </NButton>
                </template>
                {{ t('aiStudio.deleteChat') }}
              </NPopconfirm>
            </div>
          </div>
        </NScrollbar>
      </div>

      <!-- Right panel: chat content -->
      <div
        class="min-h-0 min-w-0 flex-1 overflow-hidden"
        :class="isChatSelected ? 'flex flex-col' : 'hidden md:flex md:flex-col'"
      >
        <router-view class="flex-1" />
      </div>
    </div>
  </div>
</template>
