<script setup lang="ts">
import { NButton, NDataTable, NIcon, NSwitch } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { useMediaQuery } from '@vueuse/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()
const isMobile = useMediaQuery('(max-width: 767px)')

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['providers'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/providers')
    if (error) throw extractApiError(error, response)
    return data
  },
})

// Toggle active status
const toggleActiveMutation = useMutation({
  mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
    const { data, error, response } = await api.PUT('/api/admin/providers/{id}', {
      params: { path: { id } },
      body: { isActive },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['providers'] })
    message.success(t('common.updateSuccess'))
  },
  onError: handleError,
})

// Delete provider
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error, response } = await api.DELETE('/api/admin/providers/{id}', {
      params: { path: { id } },
    })
    if (error) throw extractApiError(error, response)
  },
  onSuccess: () => {
    message.success(t('common.deleteSuccess'))
    showDeleteDialog.value = false
    deleteTarget.value = null
    queryClient.invalidateQueries({ queryKey: ['providers'] })
  },
  onError: handleError,
})

function openDeleteDialog(item: { id: string; displayName: string }) {
  deleteTarget.value = { id: item.id, name: item.displayName }
  showDeleteDialog.value = true
}

function confirmDelete() {
  if (deleteTarget.value) {
    deleteMutation.mutate(deleteTarget.value.id)
  }
}

const providers = computed(() => data.value?.providers ?? [])

const columns = computed<DataTableColumns>(() => {
  const all: DataTableColumns = [
    {
      title: t('common.name'),
      key: 'displayName',
      ellipsis: { tooltip: true },
    },
    {
      title: t('common.slug'),
      key: 'name',
      ellipsis: { tooltip: true },
    },
    {
      title: t('providers.baseUrl'),
      key: 'baseUrl',
      ellipsis: { tooltip: true },
      render: (row: any) => row.baseUrl || '-',
    },
    {
      title: t('providers.apiKey'),
      key: 'apiKeyPreview',
      width: 140,
      render: (row: any) => {
        if (!row.apiKeyPreview) return h('span', { class: 'text-muted-foreground text-xs' }, t('providers.notSet'))
        return h('code', { class: 'text-xs font-mono bg-muted px-1.5 py-0.5 rounded' }, row.apiKeyPreview)
      },
    },
    {
      title: t('common.health'),
      key: 'isHealthy',
      width: 100,
      render: (row: any) => {
        if (row.isHealthy === null) return h('span', { class: 'text-muted-foreground' }, '-')
        return h(StatusBadge, { status: row.isHealthy ? 'healthy' : 'error' })
      },
    },
    {
      title: t('common.status'),
      key: 'isActive',
      width: 100,
      render: (row: any) => {
        return h(NSwitch, {
          value: row.isActive,
          loading: toggleActiveMutation.isPending.value,
          onUpdateValue: (val: boolean) => toggleActiveMutation.mutate({ id: row.id, isActive: val }),
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
              onClick: () => router.push({ name: 'providers-detail', params: { id: row.id } }),
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
              onClick: () => openDeleteDialog({ id: row.id, displayName: row.displayName }),
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
    return all.filter((col: any) => col.key === 'displayName' || col.key === 'actions')
  }
  return all
})
</script>

<template>
  <div>
    <PageHeader :title="t('providers.title')">
      <template #actions>
        <NButton type="primary" @click="router.push({ name: 'providers-create' })">
          <template #icon>
            <NIcon><AddOutline /></NIcon>
          </template>
          {{ t('providers.create') }}
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
          :data="providers"
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
