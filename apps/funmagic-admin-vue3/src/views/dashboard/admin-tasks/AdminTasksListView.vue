<script setup lang="ts">
import { NButton, NIcon, NEmpty } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { EyeOutline } from '@vicons/ionicons5'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()

// Admin tasks uses the same user listing endpoint to get all users' tasks
// Since there's no dedicated /api/admin/admin-tasks endpoint, we use
// /api/admin/users and aggregate tasks from user details
const { data, isLoading, isError, error } = useQuery({
  queryKey: ['admin-tasks'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/users', {
      params: { query: { limit: '100' } },
    })
    if (error) throw new Error('Failed to fetch users')
    return data
  },
})

// We show a placeholder since there's no dedicated admin-tasks list API
const hasApi = computed(() => false)

const tasks = ref<any[]>([])

const columns = computed<DataTableColumns>(() => [
  {
    title: t('tasks.taskId'),
    key: 'id',
    width: 140,
    ellipsis: { tooltip: true },
  },
  {
    title: t('tasks.user'),
    key: 'userId',
    ellipsis: { tooltip: true },
  },
  {
    title: t('tasks.tool'),
    key: 'tool',
    ellipsis: { tooltip: true },
    render: (row: any) => row.tool?.title || '-',
  },
  {
    title: t('tasks.status'),
    key: 'status',
    width: 120,
    render: (row: any) => h(StatusBadge, { status: row.status }),
  },
  {
    title: 'Credits',
    key: 'creditsCost',
    width: 100,
  },
  {
    title: t('common.createdAt'),
    key: 'createdAt',
    width: 180,
    render: (row: any) => new Date(row.createdAt).toLocaleString(),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 100,
    render: (row: any) => {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          onClick: () => router.push({ name: 'admin-tasks-detail', params: { id: row.id } }),
        },
        {
          icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
          default: () => 'View',
        },
      )
    },
  },
])
</script>

<template>
  <div>
    <PageHeader :title="t('nav.adminTasks')" description="View and manage system-wide tasks" />

    <div class="rounded-lg border border-dashed p-8 text-center md:p-12">
      <NEmpty
        description="Admin Tasks API is not yet available. Tasks can be viewed from individual user detail pages."
      >
        <template #extra>
          <NButton type="primary" @click="router.push({ name: 'users' })">
            Go to Users
          </NButton>
        </template>
      </NEmpty>
    </div>
  </div>
</template>
