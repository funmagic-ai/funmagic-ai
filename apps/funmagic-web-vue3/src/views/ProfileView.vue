<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const locale = computed(() => (route.params.locale as string) || 'en')

const transactionPage = ref(1)
const transactionLimit = 10

// Fetch credit balance
const { data: balanceData, isLoading: balanceLoading } = useQuery({
  queryKey: ['credit-balance'],
  queryFn: async () => {
    const { data } = await api.GET('/api/credits/balance')
    return data
  },
})

// Fetch transactions
const {
  data: transactionsData,
  isLoading: transactionsLoading,
} = useQuery({
  queryKey: ['credit-transactions', transactionPage],
  queryFn: async () => {
    const { data } = await api.GET('/api/credits/transactions', {
      params: {
        query: {
          limit: transactionLimit,
          offset: (transactionPage.value - 1) * transactionLimit,
        },
      },
    })
    return data
  },
})

const transactions = computed(() => transactionsData.value?.transactions ?? [])
const transactionPagination = computed(() => transactionsData.value?.pagination)
const totalTransactionPages = computed(() => {
  if (!transactionPagination.value) return 1
  return Math.ceil(transactionPagination.value.total / transactionLimit)
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getTransactionTypeTag(type: string) {
  const typeMap: Record<string, { type: 'success' | 'error' | 'warning' | 'info' | 'default'; labelKey: string }> = {
    purchase: { type: 'success', labelKey: 'profile.types.purchase' },
    bonus: { type: 'success', labelKey: 'profile.types.bonus' },
    welcome: { type: 'success', labelKey: 'profile.types.welcome' },
    usage: { type: 'error', labelKey: 'profile.types.usage' },
    refund: { type: 'warning', labelKey: 'profile.types.refund' },
    reservation: { type: 'info', labelKey: 'profile.types.reservation' },
    release: { type: 'info', labelKey: 'profile.types.release' },
    admin_adjust: { type: 'warning', labelKey: 'profile.types.admin_adjust' },
    expiry: { type: 'error', labelKey: 'profile.types.expiry' },
  }
  return typeMap[type] || { type: 'default' as const, labelKey: '' }
}
</script>

<template>
  <AppLayout>
    <main class="flex-1 py-8 md:py-12">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-foreground">{{ t('profile.title') }}</h1>
      </div>

      <!-- User Info -->
      <n-card class="mb-6">
        <div class="flex items-center gap-6">
          <n-avatar :size="72" round>
            {{ authStore.user?.name?.charAt(0)?.toUpperCase() || '?' }}
          </n-avatar>
          <div>
            <h2 class="text-xl font-semibold text-foreground">
              {{ authStore.user?.name || 'User' }}
            </h2>
            <p class="text-muted-foreground">{{ authStore.user?.email }}</p>
            <n-tag
              :type="authStore.isAdmin ? 'warning' : 'info'"
              size="small"
              class="mt-2"
            >
              {{ authStore.userRole }}
            </n-tag>
          </div>
        </div>
      </n-card>

      <!-- Credit Balance -->
      <n-card :title="t('profile.credits')" class="mb-6">
        <div v-if="balanceLoading" class="space-y-3">
          <n-skeleton text :repeat="2" />
        </div>
        <div v-else-if="balanceData" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-primary">{{ balanceData.balance }}</p>
            <p class="text-xs text-muted-foreground">{{ t('profile.totalBalance') }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">{{ balanceData.availableBalance }}</p>
            <p class="text-xs text-muted-foreground">{{ t('profile.available') }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-orange-500">{{ balanceData.reservedBalance }}</p>
            <p class="text-xs text-muted-foreground">{{ t('profile.reserved') }}</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-muted-foreground">{{ balanceData.lifetimeUsed }}</p>
            <p class="text-xs text-muted-foreground">{{ t('profile.lifetimeUsed') }}</p>
          </div>
        </div>
      </n-card>

      <!-- Transaction History -->
      <n-card :title="t('profile.transactions')">
        <div v-if="transactionsLoading" class="space-y-3">
          <n-skeleton text :repeat="5" />
        </div>

        <div v-else-if="transactions.length === 0" class="py-8 text-center">
          <p class="text-muted-foreground">{{ t('profile.noTransactions') }}</p>
        </div>

        <div v-else>
          <n-table :bordered="false" :single-line="false">
            <thead>
              <tr>
                <th>{{ t('profile.date') }}</th>
                <th>{{ t('profile.type') }}</th>
                <th>{{ t('profile.amount') }}</th>
                <th>{{ t('profile.balanceAfter') }}</th>
                <th>{{ t('profile.description') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in transactions" :key="tx.id">
                <td class="text-sm text-muted-foreground whitespace-nowrap">
                  {{ formatDate(tx.createdAt) }}
                </td>
                <td>
                  <n-tag
                    :type="getTransactionTypeTag(tx.type).type"
                    size="small"
                  >
                    {{ getTransactionTypeTag(tx.type).labelKey ? t(getTransactionTypeTag(tx.type).labelKey) : tx.type }}
                  </n-tag>
                </td>
                <td>
                  <span :class="tx.amount >= 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'">
                    {{ tx.amount >= 0 ? '+' : '' }}{{ tx.amount }}
                  </span>
                </td>
                <td class="text-sm">{{ tx.balanceAfter }}</td>
                <td class="text-sm text-muted-foreground max-w-[200px] truncate">
                  {{ tx.description || '-' }}
                </td>
              </tr>
            </tbody>
          </n-table>

          <div v-if="totalTransactionPages > 1" class="mt-6 flex justify-center">
            <n-pagination
              v-model:page="transactionPage"
              :page-count="totalTransactionPages"
            />
          </div>
        </div>
      </n-card>
      </div>
    </main>
  </AppLayout>
</template>
