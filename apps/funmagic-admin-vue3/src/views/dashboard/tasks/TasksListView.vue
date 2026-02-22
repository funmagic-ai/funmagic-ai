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
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { EyeOutline, TrashOutline } from '@vicons/ionicons5'
import { useMediaQuery } from '@vueuse/core'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()
const authStore = useAuthStore()
const isMobile = useMediaQuery('(max-width: 767px)')

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

// Expanded child tasks
const expandedChildTasks = ref<Record<string, TaskRow[]>>({})
const loadingChildren = ref<Record<string, boolean>>({})

async function fetchChildren(parentId: string) {
  if (expandedChildTasks.value[parentId]) return
  loadingChildren.value[parentId] = true
  try {
    const { data, error } = await api.GET('/api/admin/tasks', {
      params: {
        query: {
          parentTaskId: parentId,
          limit: '100',
          offset: '0',
        },
      },
    })
    if (error) throw new Error('Failed to fetch child tasks')
    expandedChildTasks.value[parentId] = (data?.tasks ?? []) as TaskRow[]
  } finally {
    loadingChildren.value[parentId] = false
  }
}

const expandedRowKeys = ref<Array<string | number>>([])

function handleExpandChange(keys: Array<string | number>) {
  expandedRowKeys.value = keys
  for (const key of keys) {
    fetchChildren(String(key))
  }
}

// Delete task
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; label: string } | null>(null)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await api.DELETE('/api/admin/tasks/{id}', {
      params: { path: { id } },
    })
    if (error) throw new Error((error as any).error ?? 'Failed to delete task')
  },
  onSuccess: () => {
    message.success(t('common.deleteSuccess'))
    showDeleteDialog.value = false
    deleteTarget.value = null
    // Clear cached children so they reload on next expand
    expandedChildTasks.value = {}
    queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function openDeleteDialog(task: TaskRow) {
  deleteTarget.value = { id: task.id, label: task.tool?.title ?? task.id.substring(0, 8) }
  showDeleteDialog.value = true
}

function confirmDelete() {
  if (deleteTarget.value) {
    deleteMutation.mutate(deleteTarget.value.id)
  }
}

const statusTabs = computed(() => [
  { name: 'all', label: t('common.all') },
  { name: 'pending', label: t('tasks.pending') },
  { name: 'processing', label: t('tasks.processing') },
  { name: 'completed', label: t('tasks.completed') },
  { name: 'failed', label: t('tasks.failed') },
])

const columns = computed<DataTableColumns<TaskRow>>(() => {
  const all: DataTableColumns<TaskRow> = [
    {
      type: 'expand',
      expandable: (row) => row.childCount > 0,
      renderExpand(row) {
        const children = expandedChildTasks.value[row.id]
        const loading = loadingChildren.value[row.id]

        if (loading || !children) {
          return h('div', { class: 'flex justify-center py-4' }, [
            h(NSpin, { size: 'small' }),
          ])
        }

        if (children.length === 0) {
          return h('div', { class: 'py-3 text-center text-sm opacity-50' }, t('common.noResults'))
        }

        return h('div', { class: 'pl-8 py-2' }, [
          h(NDataTable, {
            columns: childColumns.value,
            data: children,
            bordered: false,
            singleLine: false,
            size: 'small',
            rowProps: (childRow: any) => ({
              style: 'cursor: pointer;',
              onClick: () => router.push({ name: 'tasks-detail', params: { id: childRow.id } }),
            }),
          }),
        ])
      },
    },
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
      title: t('users.credits'),
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
      width: authStore.isAdmin ? 100 : 80,
      fixed: 'right',
      render(row) {
        const buttons = [
          h(
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
          ),
        ]
        if (authStore.isAdmin) {
          buttons.push(
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'error',
                onClick: (e: Event) => {
                  e.stopPropagation()
                  openDeleteDialog(row)
                },
              },
              {
                icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
              },
            ),
          )
        }
        return h('div', { class: 'flex items-center gap-1' }, buttons)
      },
    },
  ]
  if (isMobile.value) {
    return all.filter((col: any) => col.key === 'tool' || col.key === 'actions')
  }
  return all
})

// Child table columns — same as parent but without expand column
const childColumns = computed<DataTableColumns<TaskRow>>(() => {
  const all: DataTableColumns<TaskRow> = [
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
      title: t('users.credits'),
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
      width: authStore.isAdmin ? 100 : 80,
      fixed: 'right',
      render(row) {
        const buttons = [
          h(
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
          ),
        ]
        if (authStore.isAdmin) {
          buttons.push(
            h(
              NButton,
              {
                size: 'small',
                quaternary: true,
                type: 'error',
                onClick: (e: Event) => {
                  e.stopPropagation()
                  openDeleteDialog(row)
                },
              },
              {
                icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
              },
            ),
          )
        }
        return h('div', { class: 'flex items-center gap-1' }, buttons)
      },
    },
  ]
  if (isMobile.value) {
    return all.filter((col: any) => col.key === 'tool' || col.key === 'actions')
  }
  return all
})

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
            :expanded-row-keys="expandedRowKeys"
            :row-key="(row: TaskRow) => row.id"
            size="small"
            :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => router.push({ name: 'tasks-detail', params: { id: row.id } }) })"
            @update:expanded-row-keys="handleExpandChange"
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

    <DeleteConfirmDialog
      v-model:show="showDeleteDialog"
      :title="`Delete task &quot;${deleteTarget?.label ?? ''}&quot;?`"
      :message="t('common.deleteConfirm')"
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
