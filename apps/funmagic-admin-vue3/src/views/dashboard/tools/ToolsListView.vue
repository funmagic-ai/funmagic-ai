<script setup lang="ts">
import { NButton, NInput, NDataTable, NSpin, NEmpty, NIcon, NPagination, NSwitch } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { TrashOutline, CreateOutline, AddOutline, SearchOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()

const search = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// Fetch tools
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['admin', 'tools'] as const,
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tools', {
      params: { query: { includeInactive: 'true' } },
    })
    if (error) throw new Error('Failed to fetch tools')
    return data
  },
})

// Filtered and paginated tools
const filteredTools = computed(() => {
  const tools = data.value?.tools ?? []
  if (!search.value.trim()) return tools
  const q = search.value.toLowerCase()
  return tools.filter(
    (tool) =>
      tool.title.toLowerCase().includes(q) ||
      tool.slug.toLowerCase().includes(q) ||
      (tool.toolType?.title?.toLowerCase().includes(q) ?? false),
  )
})

const totalItems = computed(() => filteredTools.value.length)
const paginatedTools = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredTools.value.slice(start, start + pageSize.value)
})

// Toggle active status
const toggleActiveMutation = useMutation({
  mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
    const { data, error } = await api.PUT('/api/admin/tools/{id}', {
      params: { path: { id } },
      body: { isActive },
    })
    if (error) throw new Error(error.error ?? 'Failed to toggle status')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
    message.success(t('common.statusUpdated'))
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

// Delete tool
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; title: string } | null>(null)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await api.DELETE('/api/admin/tools/{id}', {
      params: { path: { id } },
    })
    if (error) throw new Error(error.error ?? 'Failed to delete tool')
  },
  onSuccess: () => {
    message.success(t('common.deleteSuccess'))
    showDeleteDialog.value = false
    deleteTarget.value = null
    queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function openDeleteDialog(tool: { id: string; title: string }) {
  deleteTarget.value = tool
  showDeleteDialog.value = true
}

function confirmDelete() {
  if (deleteTarget.value) {
    deleteMutation.mutate(deleteTarget.value.id)
  }
}

// Table columns
const columns = computed<DataTableColumns>(() => [
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
              openDeleteDialog({ id: row.id, title: row.title })
            },
          },
          {
            icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
          },
        ),
      ])
    },
  },
])

// Reset page on search
watch(search, () => {
  currentPage.value = 1
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
      v-model:show="showDeleteDialog"
      :title="`Delete &quot;${deleteTarget?.title ?? ''}&quot;?`"
      :message="t('tools.deleteConfirm')"
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
