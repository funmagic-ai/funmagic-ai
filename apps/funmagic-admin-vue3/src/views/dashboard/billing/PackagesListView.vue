<script setup lang="ts">
import { NButton, NDataTable, NIcon, NSwitch } from 'naive-ui'
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
  queryKey: ['packages'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/packages')
    if (error) throw new Error('Failed to fetch packages')
    return data
  },
})

const toggleActiveMutation = useMutation({
  mutationFn: async (id: string) => {
    const { data, error } = await api.PATCH('/api/admin/packages/{id}/toggle-active', {
      params: { path: { id } },
    })
    if (error) throw new Error(error.error ?? 'Failed to toggle status')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['packages'] })
    message.success(t('common.statusUpdated'))
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

// Delete package
const showDeleteDialog = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await api.DELETE('/api/admin/packages/{id}', {
      params: { path: { id } },
    })
    if (error) throw new Error(error.error ?? 'Failed to delete package')
  },
  onSuccess: () => {
    message.success(t('common.deleteSuccess'))
    showDeleteDialog.value = false
    deleteTarget.value = null
    queryClient.invalidateQueries({ queryKey: ['packages'] })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function openDeleteDialog(item: { id: string; name: string }) {
  deleteTarget.value = item
  showDeleteDialog.value = true
}

function confirmDelete() {
  if (deleteTarget.value) {
    deleteMutation.mutate(deleteTarget.value.id)
  }
}

const packages = computed(() => data.value?.packages ?? [])

const columns = computed<DataTableColumns>(() => [
  {
    title: t('common.name'),
    key: 'name',
    ellipsis: { tooltip: true },
  },
  {
    title: t('billing.price'),
    key: 'price',
    width: 120,
    render: (row: any) => `${row.currency?.toUpperCase() || 'USD'} ${row.price}`,
  },
  {
    title: t('billing.credits'),
    key: 'credits',
    width: 100,
  },
  {
    title: 'Bonus',
    key: 'bonusCredits',
    width: 100,
  },
  {
    title: 'Popular',
    key: 'isPopular',
    width: 100,
    render: (row: any) => row.isPopular ? 'Yes' : 'No',
  },
  {
    title: 'Order',
    key: 'sortOrder',
    width: 80,
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
            onClick: () => router.push({ name: 'packages-detail', params: { id: row.id } }),
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
            onClick: () => openDeleteDialog({ id: row.id, name: row.name }),
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
    <PageHeader :title="t('billing.title')">
      <template #actions>
        <NButton type="primary" @click="router.push({ name: 'packages-create' })">
          <template #icon>
            <NIcon><AddOutline /></NIcon>
          </template>
          {{ t('billing.createPackage') }}
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
          :data="packages"
          :loading="isLoading"
          :bordered="false"
          :row-key="(row: any) => row.id"
        />
      </div>
    </div>

    <DeleteConfirmDialog
      v-model:show="showDeleteDialog"
      :title="`Delete &quot;${deleteTarget?.name ?? ''}&quot;?`"
      message="Are you sure you want to delete this package? This action cannot be undone."
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
