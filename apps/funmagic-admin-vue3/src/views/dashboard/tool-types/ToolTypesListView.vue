<script setup lang="ts">
import { NButton, NDataTable, NIcon, NSwitch } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['tool-types'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/tool-types')
    if (error) throw extractApiError(error, response)
    return data
  },
})

const toggleActiveMutation = useMutation({
  mutationFn: async (id: string) => {
    const { data, error, response } = await api.PATCH('/api/admin/tool-types/{id}/toggle-active', {
      params: { path: { id } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tool-types'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'tool-types'] })
    message.success(t('common.statusUpdated'))
  },
  onError: handleError,
})

// Delete tool type
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error, response } = await api.DELETE('/api/admin/tool-types/{id}', {
      params: { path: { id } },
    })
    if (error) throw extractApiError(error, response)
  },
  onSuccess: () => {
    message.success(t('common.deleteSuccess'))
    showDeleteDialog.value = false
    deleteTarget.value = null
    queryClient.invalidateQueries({ queryKey: ['tool-types'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'tool-types'] })
  },
  onError: handleError,
})

function openDeleteDialog(item: { id: string; title: string }) {
  deleteTarget.value = { id: item.id, name: item.title }
  showDeleteDialog.value = true
}

function confirmDelete() {
  if (deleteTarget.value) {
    deleteMutation.mutate(deleteTarget.value.id)
  }
}

const toolTypes = computed(() => data.value?.toolTypes ?? [])

const columns = computed<DataTableColumns>(() => [
  {
    title: t('common.name'),
    key: 'title',
    ellipsis: { tooltip: true },
  },
  {
    title: t('common.slug'),
    key: 'name',
    ellipsis: { tooltip: true },
  },
  {
    title: t('common.description'),
    key: 'description',
    ellipsis: { tooltip: true },
    render: (row: any) => row.description || '-',
  },
  {
    title: t('common.status'),
    key: 'isActive',
    width: 120,
    render: (row: any) => {
      return h(NSwitch, {
        value: row.isActive,
        loading: toggleActiveMutation.isPending.value,
        onUpdateValue: () => toggleActiveMutation.mutate(row.id),
      })
    },
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 120,
    render: (row: any) => {
      return h('div', { class: 'flex items-center gap-1' }, [
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            onClick: () => router.push({ name: 'tool-types-detail', params: { id: row.id } }),
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
            onClick: () => openDeleteDialog({ id: row.id, title: row.title }),
          },
          {
            icon: () => h(NIcon, null, { default: () => h(TrashOutline) }),
          },
        ),
      ])
    },
  },
])
</script>

<template>
  <div>
    <PageHeader :title="t('nav.toolTypes')">
      <template #actions>
        <NButton type="primary" @click="router.push({ name: 'tool-types-create' })">
          <template #icon>
            <NIcon><AddOutline /></NIcon>
          </template>
          {{ t('common.create') }}
        </NButton>
      </template>
    </PageHeader>

    <div class="space-y-4">
      <div v-if="isError" class="py-8 text-center text-destructive">
        {{ (error as Error)?.message || t('common.error') }}
      </div>
      <div v-else class="overflow-hidden rounded-md border">
        <NDataTable
          :columns="columns"
          :data="toolTypes"
          :loading="isLoading"
          :bordered="false"
          :row-key="(row: any) => row.id"
        />
      </div>
    </div>

    <DeleteConfirmDialog
      v-model:show="showDeleteDialog"
      :title="`Delete &quot;${deleteTarget?.name ?? ''}&quot;?`"
      :message="t('common.deleteConfirm')"
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
