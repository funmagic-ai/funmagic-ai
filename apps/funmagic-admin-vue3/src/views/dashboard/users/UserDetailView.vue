<script setup lang="ts">
import {
  NButton,
  NInput,
  NInputNumber,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NSelect,
  NDataTable,
  NSpin,
  NEmpty,
  NIcon,
  NDivider,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const userId = computed(() => route.params.id as string)

// Fetch user detail
const {
  data: userData,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: computed(() => ['admin', 'users', userId.value]),
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/users/{id}', {
      params: { path: { id: userId.value } },
    })
    if (error) throw new Error(error.error ?? 'Failed to fetch user')
    return data
  },
  enabled: computed(() => !!userId.value),
})

// Role change
const roleOptions = computed(() => [
  { label: t('roles.user'), value: 'user' as const },
  { label: t('roles.admin'), value: 'admin' as const },
  { label: t('roles.superAdmin'), value: 'super_admin' as const },
])

const selectedRole = ref<'user' | 'admin' | 'super_admin'>('user')

watch(
  () => userData.value,
  (data) => {
    if (data?.user) {
      selectedRole.value = data.user.role as 'user' | 'admin' | 'super_admin'
    }
  },
  { immediate: true },
)

const roleMutation = useMutation({
  mutationFn: async (role: 'user' | 'admin' | 'super_admin') => {
    const { data, error } = await api.PATCH('/api/admin/users/{id}/role', {
      params: { path: { id: userId.value } },
      body: { role },
    })
    if (error) throw new Error(error.error ?? 'Failed to update role')
    return data
  },
  onSuccess: () => {
    message.success(t('common.updateSuccess'))
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId.value] })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function handleRoleChange() {
  roleMutation.mutate(selectedRole.value)
}

// Credit adjustment
const creditAmount = ref<number>(0)
const creditDescription = ref('')

const creditMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/admin/users/{id}/credits', {
      params: { path: { id: userId.value } },
      body: {
        amount: creditAmount.value,
        description: creditDescription.value,
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to adjust credits')
    return data
  },
  onSuccess: () => {
    message.success(t('common.updateSuccess'))
    creditAmount.value = 0
    creditDescription.value = ''
    queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId.value] })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function handleCreditAdjust() {
  if (!creditAmount.value) {
    message.warning(t('users.creditAmountRequired'))
    return
  }
  if (!creditDescription.value.trim()) {
    message.warning(t('users.creditReasonRequired'))
    return
  }
  creditMutation.mutate()
}

// Transaction history columns
const transactionColumns = computed<DataTableColumns>(() => [
  {
    title: t('common.type'),
    key: 'type',
    width: 120,
    render(row: any) {
      return h(StatusBadge, { status: row.type })
    },
  },
  {
    title: t('common.amount'),
    key: 'amount',
    width: 100,
    render(row: any) {
      const isPositive = row.amount > 0
      return h(
        'span',
        { class: isPositive ? 'text-green-600 font-medium' : 'text-red-600 font-medium' },
        isPositive ? `+${row.amount}` : `${row.amount}`,
      )
    },
  },
  {
    title: t('common.balanceAfter'),
    key: 'balanceAfter',
    width: 120,
  },
  {
    title: t('common.description'),
    key: 'description',
    ellipsis: { tooltip: true },
    render(row: any) {
      return row.description || '--'
    },
  },
  {
    title: t('common.createdAt'),
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return new Date(row.createdAt).toLocaleString()
    },
  },
])

// Recent tasks columns
const taskColumns = computed<DataTableColumns>(() => [
  {
    title: t('common.id'),
    key: 'id',
    width: 100,
    ellipsis: { tooltip: true },
    render(row: any) {
      return row.id.substring(0, 8) + '...'
    },
  },
  {
    title: t('tasks.tool'),
    key: 'tool',
    render(row: any) {
      return row.tool?.title ?? '--'
    },
  },
  {
    title: t('common.status'),
    key: 'status',
    width: 120,
    render(row: any) {
      return h(StatusBadge, { status: row.status })
    },
  },
  {
    title: t('users.credits'),
    key: 'creditsCost',
    width: 80,
  },
  {
    title: t('common.createdAt'),
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return new Date(row.createdAt).toLocaleString()
    },
  },
])
</script>

<template>
  <div>
    <PageHeader :title="userData?.user?.name ?? userData?.user?.email ?? t('users.title')">
      <template #actions>
        <NButton quaternary @click="router.push({ name: 'users' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <!-- Error -->
    <div v-else-if="isError" class="py-12 text-center">
      <NEmpty :description="t('users.userNotFound')">
        <template #extra>
          <NButton @click="() => refetch()">{{ t('common.retry') }}</NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Content -->
    <template v-else-if="userData?.user">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- User Info -->
        <NCard :title="t('users.userInformation')" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem :label="t('common.id')">
              {{ userData.user.id }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('common.name')">
              {{ userData.user.name ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('users.email')">
              {{ userData.user.email }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('users.role')">
              {{ userData.user.role }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('users.emailVerified')">
              {{ userData.user.emailVerified ? t('common.yes') : t('common.no') }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('common.createdAt')">
              {{ new Date(userData.user.createdAt).toLocaleString() }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- Credits & Role Management -->
        <div class="flex flex-col gap-6">
          <!-- Role Change -->
          <NCard :title="t('users.changeRole')" size="small">
            <div class="flex items-end gap-3">
              <div class="flex-1">
                <NSelect
                  v-model:value="selectedRole"
                  :options="roleOptions"
                />
              </div>
              <NButton
                type="primary"
                :loading="roleMutation.isPending.value"
                :disabled="selectedRole === userData.user.role"
                @click="handleRoleChange"
              >
                {{ t('common.save') }}
              </NButton>
            </div>
          </NCard>

          <!-- Credit Balance -->
          <NCard :title="t('users.adjustCredits')" size="small">
            <div class="mb-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div class="text-2xl font-bold text-foreground">
                  {{ userData.user.credits?.balance ?? 0 }}
                </div>
                <div class="text-xs text-muted-foreground">{{ t('users.balance') }}</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-green-600">
                  {{ userData.user.credits?.lifetimePurchased ?? 0 }}
                </div>
                <div class="text-xs text-muted-foreground">{{ t('users.purchased') }}</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-red-600">
                  {{ userData.user.credits?.lifetimeUsed ?? 0 }}
                </div>
                <div class="text-xs text-muted-foreground">{{ t('users.used') }}</div>
              </div>
            </div>

            <NDivider class="!my-3" />

            <div class="flex flex-col gap-3">
              <NInputNumber
                v-model:value="creditAmount"
                :placeholder="t('users.creditAmountPlaceholder')"
                class="w-full"
              />
              <NInput
                v-model:value="creditDescription"
                :placeholder="t('users.creditReasonPlaceholder')"
              />
              <NButton
                type="primary"
                block
                :loading="creditMutation.isPending.value"
                :disabled="!creditAmount || !creditDescription.trim()"
                @click="handleCreditAdjust"
              >
                {{ t('users.adjustCredits') }}
              </NButton>
            </div>
          </NCard>
        </div>
      </div>

      <!-- Transaction History -->
      <NCard :title="t('users.transactionHistory')" size="small" class="mt-6">
        <NEmpty
          v-if="!userData.recentTransactions?.length"
          :description="t('common.noResults')"
          class="py-8"
        />
        <NDataTable
          v-else
          :columns="transactionColumns"
          :data="userData.recentTransactions"
          :bordered="false"
          :single-line="false"
          size="small"
        />
      </NCard>

      <!-- Recent Tasks -->
      <NCard :title="t('users.recentTasks')" size="small" class="mt-6">
        <NEmpty
          v-if="!userData.recentTasks?.length"
          :description="t('common.noResults')"
          class="py-8"
        />
        <NDataTable
          v-else
          :columns="taskColumns"
          :data="userData.recentTasks"
          :bordered="false"
          :single-line="false"
          size="small"
          :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => router.push({ name: 'tasks-detail', params: { id: row.id } }) })"
        />
      </NCard>
    </template>
  </div>
</template>
