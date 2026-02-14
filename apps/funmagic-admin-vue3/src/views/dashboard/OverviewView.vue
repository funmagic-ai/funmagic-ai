<script setup lang="ts">
import { NDataTable, NSpin, NEmpty } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()

// Fetch tools list to get total count
const { data: toolsData, isLoading: toolsLoading } = useQuery({
  queryKey: ['admin', 'tools'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tools', {
      params: { query: { includeInactive: 'true' } },
    })
    if (error) throw new Error('Failed to fetch tools')
    return data
  },
})

// Fetch users list
const { data: usersData, isLoading: usersLoading } = useQuery({
  queryKey: ['admin', 'users'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/users', {
      params: { query: { limit: '100' } },
    })
    if (error) throw new Error('Failed to fetch users')
    return data
  },
})

const totalTools = computed(() => toolsData.value?.tools?.length ?? 0)
const totalUsers = computed(() => usersData.value?.users?.length ?? 0)
const activeTools = computed(
  () => toolsData.value?.tools?.filter((tool) => tool.isActive).length ?? 0,
)

// Build recent tasks from users' data -- we don't have a dedicated admin tasks endpoint,
// so we show a placeholder stats view
const isLoading = computed(() => toolsLoading.value || usersLoading.value)

// Stat cards definition
const stats = computed(() => [
  {
    label: t('dashboard.totalUsers'),
    value: totalUsers.value,
    loading: usersLoading.value,
  },
  {
    label: t('dashboard.totalTools'),
    value: totalTools.value,
    loading: toolsLoading.value,
  },
  {
    label: t('dashboard.activeTools'),
    value: activeTools.value,
    loading: toolsLoading.value,
  },
  {
    label: t('dashboard.totalRevenue'),
    value: '--',
    loading: false,
  },
])

// Recent tools table columns
const toolColumns = computed<DataTableColumns>(() => [
  {
    title: t('common.name'),
    key: 'title',
    ellipsis: { tooltip: true },
  },
  {
    title: t('common.slug'),
    key: 'slug',
    width: 180,
    ellipsis: { tooltip: true },
  },
  {
    title: t('common.type'),
    key: 'toolType',
    width: 140,
    render(row: any) {
      return row.toolType?.title ?? '--'
    },
  },
  {
    title: t('common.status'),
    key: 'isActive',
    width: 100,
    render(row: any) {
      return h(StatusBadge, { status: row.isActive ? 'active' : 'inactive' })
    },
  },
  {
    title: t('common.usage'),
    key: 'usageCount',
    width: 80,
  },
  {
    title: t('common.createdAt'),
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return new Date(row.createdAt).toLocaleDateString()
    },
  },
])

const recentTools = computed(() => {
  const tools = toolsData.value?.tools ?? []
  return [...tools].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
})

function handleToolRowClick(row: any) {
  router.push({ name: 'tools-detail', params: { id: row.id } })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="t('dashboard.title')" />

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="rounded-xl border bg-card p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted-foreground">{{ stat.label }}</p>
        </div>
        <div class="mt-2">
          <NSpin v-if="stat.loading" size="small" />
          <p v-else class="text-2xl font-bold tabular-nums text-foreground">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Recent Tools -->
    <div class="rounded-xl border bg-card py-6 shadow-sm">
      <div class="px-6 pb-4">
        <h3 class="text-lg font-semibold text-foreground">{{ t('dashboard.recentTools') }}</h3>
      </div>
      <div class="px-6">
        <NSpin v-if="isLoading" class="flex justify-center py-8" />
        <div v-else-if="recentTools.length === 0" class="rounded-lg border border-dashed p-8 text-center md:p-12">
          <NEmpty :description="t('common.noResults')" />
        </div>
        <NDataTable
          v-else
          :columns="toolColumns"
          :data="recentTools"
          :bordered="false"
          :single-line="false"
          size="small"
          :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => handleToolRowClick(row) })"
        />
      </div>
    </div>
  </div>
</template>
