<script setup lang="ts">
import { NButton, NDataTable, NIcon, NSwitch } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { useMediaQuery } from '@vueuse/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useDeleteDialog } from '@/composables/useAdminCrud'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()
const { handleError } = useApiError()
const isMobile = useMediaQuery('(max-width: 767px)')

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['packages'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/packages')
    if (error) throw extractApiError(error, response)
    return data
  },
})

// Packages uses PATCH toggle-active endpoint (different from standard PUT pattern)
const toggleActiveMutation = useMutation({
  mutationFn: async (id: string) => {
    const { data, error, response } = await api.PATCH('/api/admin/packages/{id}/toggle-active', {
      params: { path: { id } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['packages'] })
    message.success(t('common.statusUpdated'))
  },
  onError: handleError,
})

const del = useDeleteDialog({
  deleteFn: async (id) => {
    const { error, response } = await api.DELETE('/api/admin/packages/{id}', {
      params: { path: { id } },
    })
    if (error) throw extractApiError(error, response)
  },
  invalidateKeys: [['packages']],
})

const packages = computed(() => data.value?.packages ?? [])

type PackageRow = (typeof packages.value)[number]

const columns = computed<DataTableColumns<PackageRow>>(() => {
  const all: DataTableColumns<PackageRow> = [
    {
      title: t('common.name'),
      key: 'name',
      ellipsis: { tooltip: true },
    },
    {
      title: t('billing.price'),
      key: 'price',
      width: 120,
      render: (row) => `${row.currency?.toUpperCase() || 'USD'} ${row.price}`,
    },
    {
      title: t('billing.credits'),
      key: 'credits',
      width: 100,
    },
    {
      title: t('common.bonus'),
      key: 'bonusCredits',
      width: 100,
    },
    {
      title: t('common.popular'),
      key: 'isPopular',
      width: 100,
      render: (row) => row.isPopular ? t('common.yes') : t('common.no'),
    },
    {
      title: t('common.order'),
      key: 'sortOrder',
      width: 80,
    },
    {
      title: t('common.status'),
      key: 'isActive',
      width: 120,
      render: (row) => {
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
      render: (row) => {
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
              onClick: () => del.open({ id: row.id, name: row.name }),
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
    return all.filter((col: any) => col.key === 'name' || col.key === 'actions')
  }
  return all
})
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
          :row-key="(row) => row.id"
        />
      </div>
    </div>

    <DeleteConfirmDialog
      v-model:show="del.showDialog.value"
      :title="`Delete &quot;${del.target.value?.name ?? ''}&quot;?`"
      :message="t('common.deleteConfirm')"
      :loading="del.mutation.isPending.value"
      @confirm="del.confirm"
    />
  </div>
</template>
