<script setup lang="ts">
import {
  NButton,
  NDataTable,
  NSpin,
  NEmpty,
  NIcon,
  NTabs,
  NTabPane,
  NPagination,
  NTag,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { EyeOutline, GitBranchOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()

const statusFilter = ref<string>('all')
const currentPage = ref(1)
const pageSize = ref(20)

interface TaskRow {
  id: string
  userId: string
  userName: string | null
  userEmail: string
  tool: { id: string; title: string; slug: string } | null
  status: string
  creditsCost: number
  createdAt: string
  parentTaskId: string | null
  childCount: number
}

const { data, isLoading } = useQuery({
  queryKey: computed(() => ['admin', 'tasks', statusFilter.value, currentPage.value, pageSize.value]),
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tasks', {
      params: {
        query: {
          status: statusFilter.value,
          limit: String(pageSize.value),
          offset: String((currentPage.value - 1) * pageSize.value),
        },
      },
    })
    if (error) throw new Error('Failed to fetch tasks')
    return data
  },
})

const allTasks = computed(() => (data.value?.tasks ?? []) as TaskRow[])
const totalItems = computed(() => data.value?.total ?? 0)

const statusTabs = [
  { name: 'all', label: 'All' },
  { name: 'pending', label: t('tasks.pending') },
  { name: 'processing', label: t('tasks.processing') },
  { name: 'completed', label: t('tasks.completed') },
  { name: 'failed', label: t('tasks.failed') },
]

const columns: DataTableColumns<TaskRow> = [
  {
    title: t('tasks.taskId'),
    key: 'id',
    width: 120,
    ellipsis: { tooltip: true },
    render(row) {
      return row.id.substring(0, 8) + '...'
    },
  },
  {
    title: t('tasks.user'),
    key: 'userName',
    width: 140,
    ellipsis: { tooltip: true },
    render(row) {
      return row.userName ?? row.userEmail
    },
  },
  {
    title: t('tasks.tool'),
    key: 'tool',
    minWidth: 140,
    ellipsis: { tooltip: true },
    render(row) {
      return row.tool?.title ?? '--'
    },
  },
  {
    title: t('tasks.status'),
    key: 'status',
    width: 120,
    render(row) {
      return h(StatusBadge, { status: row.status })
    },
  },
  {
    title: 'Hierarchy',
    key: 'hierarchy',
    width: 130,
    render(row) {
      const items = []
      if (row.parentTaskId) {
        items.push(
          h(NTag, {
            size: 'small',
            type: 'info',
            bordered: false,
            class: 'cursor-pointer',
            onClick: (e: Event) => {
              e.stopPropagation()
              router.push({ name: 'tasks-detail', params: { id: row.parentTaskId! } })
            },
          }, { default: () => 'Parent: ' + row.parentTaskId.substring(0, 6) }),
        )
      }
      if (row.childCount > 0) {
        items.push(
          h(NTag, {
            size: 'small',
            bordered: false,
          }, {
            default: () => `${row.childCount} child${row.childCount > 1 ? 'ren' : ''}`,
            icon: () => h(NIcon, { size: 14 }, { default: () => h(GitBranchOutline) }),
          }),
        )
      }
      return items.length > 0
        ? h('div', { class: 'flex flex-col gap-0.5' }, items)
        : '--'
    },
  },
  {
    title: 'Credits',
    key: 'creditsCost',
    width: 80,
  },
  {
    title: t('common.createdAt'),
    key: 'createdAt',
    width: 160,
    render(row) {
      return new Date(row.createdAt).toLocaleString()
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
            router.push({ name: 'tasks-detail', params: { id: row.id } })
          },
        },
        {
          icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        },
      )
    },
  },
]

watch(statusFilter, () => {
  currentPage.value = 1
})
</script>

<template>
  <div>
    <PageHeader :title="t('tasks.title')" />

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
        v-else-if="allTasks.length === 0"
        class="rounded-lg border border-dashed p-8 text-center md:p-12"
      >
        <NEmpty :description="t('common.noResults')" />
      </div>

      <template v-else>
        <div class="overflow-hidden rounded-md border">
          <NDataTable
            :columns="columns"
            :data="allTasks"
            :bordered="false"
            :single-line="false"
            size="small"
            :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => router.push({ name: 'tasks-detail', params: { id: row.id } }) })"
          />
        </div>
        <div v-if="totalItems > pageSize" class="flex justify-end">
          <NPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :item-count="totalItems"
            show-quick-jumper
          />
        </div>
      </template>
    </div>
  </div>
</template>
