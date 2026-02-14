<script setup lang="ts">
import {
  NButton,
  NInput,
  NDataTable,
  NSpin,
  NEmpty,
  NIcon,
  NSelect,
  NPagination,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { EyeOutline, SearchOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()

const search = ref('')
const roleFilter = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

const roleOptions = computed(() => [
  { label: t('roles.all'), value: null },
  { label: t('roles.user'), value: 'user' },
  { label: t('roles.admin'), value: 'admin' },
  { label: t('roles.superAdmin'), value: 'super_admin' },
]) as any

// Fetch users
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['admin', 'users'] as const,
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/users', {
      params: { query: { limit: '500' } },
    })
    if (error) throw new Error('Failed to fetch users')
    return data
  },
})

// Filtered users
const filteredUsers = computed(() => {
  let users = data.value?.users ?? []

  // Filter by role
  if (roleFilter.value) {
    users = users.filter((u) => u.role === roleFilter.value)
  }

  // Filter by search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    users = users.filter(
      (u) =>
        (u.name?.toLowerCase().includes(q) ?? false) ||
        u.email.toLowerCase().includes(q),
    )
  }

  return users
})

const totalItems = computed(() => filteredUsers.value.length)
const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

// Table columns
const columns = computed<DataTableColumns>(() => [
  {
    title: t('common.name'),
    key: 'name',
    minWidth: 140,
    ellipsis: { tooltip: true },
    render(row: any) {
      return row.name || '--'
    },
  },
  {
    title: t('users.email'),
    key: 'email',
    minWidth: 200,
    ellipsis: { tooltip: true },
  },
  {
    title: t('users.role'),
    key: 'role',
    width: 120,
    render(row: any) {
      return h(StatusBadge, { status: row.role === 'super_admin' ? 'active' : row.role === 'admin' ? 'processing' : 'default' })
    },
  },
  {
    title: t('users.credits'),
    key: 'credits',
    width: 100,
    render(row: any) {
      return row.credits?.balance ?? 0
    },
    sorter: (a: any, b: any) => (a.credits?.balance ?? 0) - (b.credits?.balance ?? 0),
  },
  {
    title: t('common.createdAt'),
    key: 'createdAt',
    width: 140,
    sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    render(row: any) {
      return new Date(row.createdAt).toLocaleDateString()
    },
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 80,
    fixed: 'right',
    render(row: any) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          onClick: (e: Event) => {
            e.stopPropagation()
            router.push({ name: 'users-detail', params: { id: row.id } })
          },
        },
        {
          icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        },
      )
    },
  },
])

// Reset page on filter change
watch([search, roleFilter], () => {
  currentPage.value = 1
})
</script>

<template>
  <div>
    <PageHeader :title="t('users.title')" />

    <div class="space-y-4">
      <!-- Filters -->
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
        <NSelect
          v-model:value="roleFilter"
          :options="roleOptions"
          :placeholder="t('users.filterByRole')"
          clearable
          class="w-full sm:w-40"
        />
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

      <!-- Empty -->
      <div v-else-if="filteredUsers.length === 0" class="rounded-lg border border-dashed p-8 text-center md:p-12">
        <NEmpty :description="t('common.noResults')" />
      </div>

      <!-- Table -->
      <template v-else>
        <div class="overflow-hidden rounded-md border">
          <NDataTable
            :columns="columns"
            :data="paginatedUsers"
            :bordered="false"
            :single-line="false"
            size="small"
            :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => router.push({ name: 'users-detail', params: { id: row.id } }) })"
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
  </div>
</template>
