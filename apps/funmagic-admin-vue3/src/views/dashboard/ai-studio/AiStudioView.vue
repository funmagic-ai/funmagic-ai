<script setup lang="ts">
import { NButton, NIcon, NEmpty, NSpin, NList, NListItem, NThing, NTime, NPopconfirm } from 'naive-ui'
import { AddOutline, ChatboxOutline, TrashOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()

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
    if (error) throw new Error(error.error ?? 'Failed to create chat')
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
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['ai-studio-chats'] })
    message.success(t('common.chatDeleted'))
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

const chats = computed(() => data.value?.chats ?? [])
</script>

<template>
  <div>
    <PageHeader :title="t('aiStudio.title')" description="AI image generation playground">
      <template #actions>
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
      </template>
    </PageHeader>

    <n-card>
      <div v-if="isLoading" class="flex justify-center py-12">
        <NSpin size="large" />
      </div>

      <NEmpty
        v-else-if="isError || chats.length === 0"
        :description="isError ? 'Failed to load chats' : 'No chats yet. Create a new chat to get started.'"
        class="py-12"
      >
        <template #extra>
          <NButton
            type="primary"
            :loading="createChatMutation.isPending.value"
            @click="createChatMutation.mutate()"
          >
            {{ t('aiStudio.newChat') }}
          </NButton>
        </template>
      </NEmpty>

      <NList v-else hoverable clickable>
        <NListItem
          v-for="chat in chats"
          :key="chat.id"
          @click="router.push({ name: 'ai-studio-chat', params: { id: chat.id } })"
        >
          <NThing>
            <template #avatar>
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <NIcon :size="20" class="text-primary">
                  <ChatboxOutline />
                </NIcon>
              </div>
            </template>
            <template #header>
              {{ chat.title || 'Untitled Chat' }}
            </template>
            <template #description>
              Created <NTime :time="new Date(chat.createdAt)" type="relative" />
            </template>
            <template #header-extra>
              <NPopconfirm
                @positive-click.stop="deleteChatMutation.mutate(chat.id)"
              >
                <template #trigger>
                  <NButton
                    size="small"
                    quaternary
                    type="error"
                    @click.stop
                  >
                    <template #icon>
                      <NIcon><TrashOutline /></NIcon>
                    </template>
                  </NButton>
                </template>
                Delete this chat?
              </NPopconfirm>
            </template>
          </NThing>
        </NListItem>
      </NList>
    </n-card>
  </div>
</template>
