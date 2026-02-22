<script setup lang="ts">
import { NButton, NInput, NDataTable, NSpin, NIcon, NPagination, NSwitch } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { TrashOutline, CreateOutline, AddOutline, SearchOutline } from '@vicons/ionicons5'
import { useMediaQuery } from '@vueuse/core'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useDeleteDialog, useToggleActive, useSearchPagination } from '@/composables/useAdminCrud'
import PageHeader from '@/components/shared/PageHeader.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const isMobile = useMediaQuery('(max-width: 767px)')

// Fetch tools
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['admin', 'tools'] as const,
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/tools', {
      params: { query: { includeInactive: 'true' } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
})

const allTools = computed(() => data.value?.tools ?? [])

const { search, currentPage, pageSize, paginated: paginatedTools, totalItems } =
  useSearchPagination(allTools, (tool) => [
    tool.title,
    tool.slug,
    tool.toolType?.title ?? '',
  ])

const { mutation: toggleActiveMutation } = useToggleActive({
  toggleFn: async (id, isActive) => {
    const { data, error, response } = await api.PUT('/api/admin/tools/{id}', {
      params: { path: { id } },
      body: { isActive },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  invalidateKeys: [['admin', 'tools']],
})

const del = useDeleteDialog({
  deleteFn: async (id) => {
    const { error, response } = await api.DELETE('/api/admin/tools/{id}', {
      params: { path: { id } },
    })
    if (error) throw extractApiError(error, response)
  },
  invalidateKeys: [['admin', 'tools']],
})

// Table columns
const columns = computed<DataTableColumns>(() => {
  const all: DataTableColumns = [
    {
      title: t('common.name'),
      key: 'title',
      ellipsis: { tooltip: true },
      minWidth: 160,
    },
    {
      title: t('tools.slug'),
      key: 'slug',
      width: 160,
      ellipsis: { tooltip: true },
    },
    {
      title: t('tools.toolType'),
      key: 'toolType',
      width: 140,
      render(row: any) {
        return row.toolType?.title ?? '--'
      },
    },
    {
      title: t('common.usage'),
      key: 'usageCount',
      width: 80,
      sorter: (a: any, b: any) => a.usageCount - b.usageCount,
    },
    {
      title: t('common.status'),
      key: 'isActive',
      width: 100,
      render(row: any) {
        return h(NSwitch, {
          value: row.isActive,
          loading: toggleActiveMutation.isPending.value,
          onClick: (e: Event) => e.stopPropagation(),
          onUpdateValue: (val: boolean) => toggleActiveMutation.mutate({ id: row.id, isActive: val }),
        })
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render(row: any) {
        return h('div', { class: 'flex items-center gap-1' }, [
          h(
            NButton,
            {
              size: 'small',
              quaternary: true,
              onClick: (e: Event) => {
                e.stopPropagation()
                router.push({ name: 'tools-detail', params: { id: row.id } })
              },
            },
            {
              icon: () => h(NIcon, null, { default: () => h(CreateOutline) }),
            },
          ),
          h(
            NButton,
            {
              size: 'small',
              quaternary: true,
              type: 'error',
              onClick: (e: Event) => {
                e.stopPropagation()
                del.open({ id: row.id, name: row.title })
              },
            },
            {
              icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
            },
          ),
        ])
      },
    },
  ]
  if (isMobile.value) {
    return all.filter((col: any) => col.key === 'title' || col.key === 'actions')
  }
  return all
})
</script>

<template>
  <div>
    <PageHeader :title="t('tools.title')">
      <template #actions>
        <NButton type="primary" @click="router.push({ name: 'tools-create' })">
          <template #icon>
            <NIcon><AddOutline /></NIcon>
          </template>
          {{ t('tools.create') }}
        </NButton>
      </template>
    </PageHeader>

    <div class="space-y-4">
      <!-- Search Bar -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <NInput
          v-model:value="search"
          :placeholder="t('common.search')"
          clearable
          class="w-full sm:max-w-xs"
        >
          <template #prefix>
            <NIcon><SearchOutline /></NIcon>
          </template>
        </NInput>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <NSpin size="large" />
      </div>

      <!-- Error -->
      <div v-else-if="isError" class="py-12 text-center">
        <p class="mb-4 text-sm text-destructive">{{ t('common.error') }}</p>
        <NButton @click="() => refetch()">{{ t('common.retry') }}</NButton>
      </div>

      <!-- Table -->
      <template v-else>
        <div class="overflow-hidden rounded-md border">
          <NDataTable
            :columns="columns"
            :data="paginatedTools"
            :bordered="false"
            :single-line="false"
            size="small"
            :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => router.push({ name: 'tools-detail', params: { id: row.id } }) })"
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

    <!-- Delete Confirmation -->
    <DeleteConfirmDialog
      v-model:show="del.showDialog.value"
      :title="`Delete &quot;${del.target.value?.name ?? ''}&quot;?`"
      :message="t('tools.deleteConfirm')"
      :loading="del.mutation.isPending.value"
      @confirm="del.confirm"
    />
  </div>
</template>
