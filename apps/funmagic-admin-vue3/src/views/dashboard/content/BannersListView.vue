<script setup lang="ts">
import { NButton, NDataTable, NIcon, NSwitch, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['banners'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/banners')
    if (error) throw new Error('Failed to fetch banners')
    return data
  },
})

const toggleActiveMutation = useMutation({
  mutationFn: async (id: string) => {
    const { data, error } = await api.PATCH('/api/admin/banners/{id}/toggle-active', {
      params: { path: { id } },
    })
    if (error) throw new Error(error.error ?? 'Failed to toggle status')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['banners'] })
    message.success(t('common.statusUpdated'))
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

// Delete banner
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await api.DELETE('/api/admin/banners/{id}', {
      params: { path: { id } },
    })
    if (error) throw new Error(error.error ?? 'Failed to delete banner')
  },
  onSuccess: () => {
    message.success(t('common.deleteSuccess'))
    showDeleteDialog.value = false
    deleteTarget.value = null
    queryClient.invalidateQueries({ queryKey: ['banners'] })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
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

const banners = computed(() => data.value?.banners ?? [])

const columns = computed<DataTableColumns>(() => [
  {
    title: 'Title',
    key: 'title',
    ellipsis: { tooltip: true },
  },
  {
    title: t('content.bannerType'),
    key: 'type',
    width: 100,
    render: (row: any) => {
      return h(NTag, { size: 'small', type: row.type === 'main' ? 'primary' : 'default' }, {
        default: () => row.type,
      })
    },
  },
  {
    title: t('content.linkUrl'),
    key: 'link',
    ellipsis: { tooltip: true },
    render: (row: any) => row.link || '-',
  },
  {
    title: 'Position',
    key: 'position',
    width: 100,
    render: (row: any) => row.position ?? '-',
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
            onClick: () => router.push({ name: 'banners-detail', params: { id: row.id } }),
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
    <PageHeader :title="t('content.title')">
      <template #actions>
        <NButton type="primary" @click="router.push({ name: 'banners-create' })">
          <template #icon>
            <NIcon><AddOutline /></NIcon>
          </template>
          {{ t('content.createBanner') }}
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
          :data="banners"
          :loading="isLoading"
          :bordered="false"
          :row-key="(row: any) => row.id"
        />
      </div>
    </div>

    <DeleteConfirmDialog
      v-model:show="showDeleteDialog"
      :title="`Delete &quot;${deleteTarget?.name ?? ''}&quot;?`"
      message="Are you sure you want to delete this banner? This action cannot be undone."
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
