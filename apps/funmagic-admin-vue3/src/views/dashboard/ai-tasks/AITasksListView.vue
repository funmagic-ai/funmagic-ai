<script setup lang="ts">
import {
  NButton,
  NDataTable,
  NSpin,
  NEmpty,
  NIcon,
  NTabs,
  NTabPane,
  NTag,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { EyeOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()

const statusFilter = ref<string>('all')

interface ChatRow {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  messageCount: number
  statusCounts: Record<string, number>
}

const { data, isLoading } = useQuery({
  queryKey: ['admin', 'ai-tasks'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/ai-studio/chats')
    if (error) throw new Error('Failed to fetch AI chats')
    const chats = data?.chats ?? []

    // For each chat, fetch messages to get counts
    const enrichedChats: ChatRow[] = await Promise.all(
      chats.map(async (chat) => {
        try {
          const { data: chatDetail } = await api.GET('/api/admin/ai-studio/chats/{chatId}', {
            params: { path: { chatId: chat.id } },
          })
          const messages = chatDetail?.messages ?? []
          const assistantMessages = messages.filter((m: any) => m.role === 'assistant')

          const statusCounts: Record<string, number> = {}
          for (const msg of assistantMessages) {
            statusCounts[msg.status] = (statusCounts[msg.status] ?? 0) + 1
          }

          return {
            id: chat.id,
            title: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            messageCount: assistantMessages.length,
            statusCounts,
          }
        } catch {
          return {
            id: chat.id,
            title: chat.title,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
            messageCount: 0,
            statusCounts: {},
          }
        }
      }),
    )

    return enrichedChats
  },
})

const allChats = computed(() => data.value ?? [])

const filteredChats = computed(() => {
  if (statusFilter.value === 'all') return allChats.value
  return allChats.value.filter(chat =>
    (chat.statusCounts[statusFilter.value] ?? 0) > 0,
  )
})

const statusTabs = [
  { name: 'all', label: 'All' },
  { name: 'pending', label: t('tasks.pending') },
  { name: 'processing', label: t('tasks.processing') },
  { name: 'completed', label: t('tasks.completed') },
  { name: 'failed', label: t('tasks.failed') },
]

function getStatusType(status: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'info'
    case 'pending': return 'warning'
    case 'failed': return 'error'
    default: return 'default'
  }
}

const columns: DataTableColumns<ChatRow> = [
  {
    title: t('aiTasks.conversations'),
    key: 'title',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render(row) {
      return row.title || 'Untitled Conversation'
    },
  },
  {
    title: t('aiTasks.messageCount'),
    key: 'messageCount',
    width: 120,
    render(row) {
      return `${row.messageCount} tasks`
    },
  },
  {
    title: t('common.status'),
    key: 'statusCounts',
    width: 220,
    render(row) {
      const entries = Object.entries(row.statusCounts)
      if (entries.length === 0) return '--'
      return h('div', { class: 'flex gap-1 flex-wrap' }, entries.map(([status, count]) =>
        h(NTag, { size: 'small', type: getStatusType(status), bordered: false }, { default: () => `${status}: ${count}` }),
      ))
    },
  },
  {
    title: t('aiTasks.lastActivity'),
    key: 'updatedAt',
    width: 160,
    render(row) {
      return new Date(row.updatedAt).toLocaleString()
    },
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 80,
    fixed: 'right',
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          onClick: (e: Event) => {
            e.stopPropagation()
            router.push({ name: 'ai-tasks-detail', params: { id: row.id } })
          },
        },
        {
          icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        },
      )
    },
  },
]
</script>

<template>
  <div>
    <PageHeader :title="t('aiTasks.title')" :description="t('aiTasks.conversations')" />

    <div class="space-y-4">
      <NTabs v-model:value="statusFilter" type="line">
        <NTabPane
          v-for="tab in statusTabs"
          :key="tab.name"
          :name="tab.name"
          :tab="tab.label"
        />
      </NTabs>

      <div v-if="isLoading" class="flex justify-center py-12">
        <NSpin size="large" />
      </div>

      <div
        v-else-if="filteredChats.length === 0"
        class="rounded-lg border border-dashed p-8 text-center md:p-12"
      >
        <NEmpty :description="t('aiTasks.noConversations')" />
      </div>

      <template v-else>
        <div class="overflow-hidden rounded-md border">
          <NDataTable
            :columns="columns"
            :data="filteredChats"
            :bordered="false"
            :single-line="false"
            size="small"
            :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => router.push({ name: 'ai-tasks-detail', params: { id: row.id } }) })"
          />
        </div>
      </template>
    </div>
  </div>
</template>
