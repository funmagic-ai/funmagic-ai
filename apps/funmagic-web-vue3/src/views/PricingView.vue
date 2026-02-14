<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import type { SupportedLocale } from '@/lib/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
const route = useRoute()
const message = useMessage()

const locale = computed(() => (route.params.locale as string) || 'en')

const { data, isLoading, isError } = useQuery({
  queryKey: ['packages', locale],
  queryFn: async () => {
    const { data } = await api.GET('/api/credits/packages', {
      params: { query: { locale: locale.value as SupportedLocale } },
    })
    return data
  },
})

const packages = computed(() => {
  const pkgs = data.value?.packages ?? []
  return [...pkgs].sort((a, b) => a.sortOrder - b.sortOrder)
})

function handleBuy(_packageId: string) {
  message.info(t('pricing.comingSoon'))
}

function formatPrice(price: string, currency: string) {
  const num = parseFloat(price)
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(num)
}
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-foreground sm:text-4xl">{{ t('pricing.title') }}</h1>
        <p class="mt-4 text-lg text-muted-foreground">{{ t('pricing.subtitle') }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <n-card v-for="i in 3" :key="i">
          <n-skeleton text :repeat="5" />
        </n-card>
      </div>

      <!-- Error State -->
      <div v-else-if="isError" class="text-center py-12">
        <p class="text-muted-foreground">{{ t('common.error') }}</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="packages.length === 0" class="text-center py-16">
        <div class="mx-auto max-w-sm space-y-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-muted-foreground/50"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>
          <p class="text-muted-foreground">{{ t('pricing.noPackages') }}</p>
          <p class="text-sm text-muted-foreground/70">{{ t('pricing.subtitle') }}</p>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div
        v-else
        class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 items-start"
      >
        <n-card
          v-for="pkg in packages"
          :key="pkg.id"
          :class="[
            'relative transition-all duration-300',
            pkg.isPopular
              ? 'ring-2 ring-primary shadow-xl scale-105'
              : 'hover:shadow-lg hover:border-primary/30',
          ]"
        >
          <!-- Popular Badge -->
          <div
            v-if="pkg.isPopular"
            class="absolute -top-3 left-1/2 -translate-x-1/2"
            role="status"
          >
            <n-tag type="primary" size="small" round>
              {{ t('pricing.popular') }}
            </n-tag>
          </div>

          <div class="text-center space-y-6 py-4">
            <!-- Package Name -->
            <div>
              <h3 class="text-xl font-bold text-foreground">{{ pkg.name }}</h3>
              <p v-if="pkg.description" class="mt-2 text-sm text-muted-foreground">
                {{ pkg.description }}
              </p>
            </div>

            <!-- Price -->
            <div>
              <span class="text-4xl font-extrabold text-foreground">
                {{ formatPrice(pkg.price, pkg.currency) }}
              </span>
            </div>

            <!-- Credits -->
            <div class="space-y-2">
              <div class="flex items-center justify-center gap-2">
                <n-icon :size="20" class="text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </n-icon>
                <span class="text-lg font-semibold text-foreground">
                  {{ pkg.credits }} {{ t('tools.credits') }}
                </span>
              </div>
              <p v-if="pkg.bonusCredits > 0" class="text-sm text-green-600 font-medium">
                + {{ pkg.bonusCredits }} {{ t('pricing.bonusCredits') }} {{ t('tools.credits') }}
              </p>
            </div>

            <!-- Buy Button -->
            <n-button
              :type="pkg.isPopular ? 'primary' : 'default'"
              size="large"
              block
              @click="handleBuy(pkg.id)"
            >
              {{ t('pricing.buy') }}
            </n-button>
          </div>
        </n-card>
      </div>
    </div>
  </AppLayout>
</template>
