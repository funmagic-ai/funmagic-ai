<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import type { SupportedLocale } from '@/lib/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import ToolCard from '@/components/tools/ToolCard.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const locale = computed(() => (route.params.locale as string) || 'en')

// URL-driven state
const search = computed({
  get: () => (route.query.q as string) || '',
  set: (val: string) => {
    router.replace({
      query: { ...route.query, q: val || undefined, page: undefined },
    })
  },
})

const selectedCategory = computed({
  get: () => (route.query.category as string) || '',
  set: (val: string) => {
    router.replace({
      query: { ...route.query, category: val || undefined, page: undefined },
    })
  },
})

const currentPage = computed({
  get: () => Number(route.query.page) || 1,
  set: (val: number) => {
    router.replace({
      query: { ...route.query, page: val > 1 ? String(val) : undefined },
    })
  },
})

const pageSize = 12

// Debounced search value
const debouncedSearch = ref(search.value)
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
  }, 300)
})

// Fetch tools
const {
  data: toolsData,
  isLoading: toolsLoading,
  isError: toolsError,
} = useQuery({
  queryKey: ['tools', locale, debouncedSearch, selectedCategory, currentPage],
  queryFn: async () => {
    const { data } = await api.GET('/api/tools', {
      params: {
        query: {
          q: debouncedSearch.value || undefined,
          category: selectedCategory.value || undefined,
          page: currentPage.value,
          limit: pageSize,
          locale: locale.value as SupportedLocale,
        },
      },
    })
    return data
  },
})

const tools = computed(() => toolsData.value?.tools ?? [])
const pagination = computed(() => toolsData.value?.pagination)
const categories = computed(() => toolsData.value?.categories ?? [])

function handleSearch(val: string) {
  search.value = val
}

function handleCategoryChange(category: string) {
  selectedCategory.value = category
}

function handlePageChange(page: number) {
  currentPage.value = page
}

function getToolPricing(tool: Record<string, unknown>): 'free' | 'freemium' | 'paid' {
  const config = tool.config as { steps?: Array<{ cost?: number }> } | undefined
  if (!config?.steps || config.steps.length === 0) return 'free'
  const hasPaidStep = config.steps.some((step) => (step.cost ?? 0) > 0)
  return hasPaidStep ? 'paid' : 'free'
}

function getToolPricingLabel(tool: Record<string, unknown>): string {
  if (tool.pricingLabel) return tool.pricingLabel as string
  const pricing = getToolPricing(tool)
  return pricing === 'free' ? t('pricing.free') : t('pricing.paid')
}
</script>

<template>
  <AppLayout>
    <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div class="w-full max-w-7xl">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-foreground">{{ t('tools.allTools') }}</h1>
      </div>

      <!-- Search Bar -->
      <div class="mb-6">
        <n-input
          :value="search"
          :placeholder="t('tools.searchPlaceholder')"
          size="large"
          clearable
          @update:value="handleSearch"
        >
          <template #prefix>
            <n-icon :size="20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </n-icon>
          </template>
        </n-input>
      </div>

      <!-- Category Filter Tabs -->
      <div v-if="categories.length > 0" class="mb-8">
        <n-space>
          <n-button
            :type="!selectedCategory ? 'primary' : 'default'"
            :secondary="!!selectedCategory"
            size="small"
            @click="handleCategoryChange('')"
          >
            {{ t('tools.allTools') }}
          </n-button>
          <n-button
            v-for="cat in categories"
            :key="cat.id"
            :type="selectedCategory === cat.name ? 'primary' : 'default'"
            :secondary="selectedCategory !== cat.name"
            size="small"
            @click="handleCategoryChange(cat.name)"
          >
            {{ cat.displayName }}
          </n-button>
        </n-space>
      </div>

      <!-- Loading State -->
      <div v-if="toolsLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div v-for="i in 8" :key="i" class="rounded-xl border bg-card/50 overflow-hidden">
          <div class="aspect-video bg-muted animate-pulse" />
          <div class="p-5 space-y-3">
            <div class="h-5 bg-muted animate-pulse rounded w-3/4" />
            <div class="h-4 bg-muted animate-pulse rounded w-1/3" />
            <div class="h-4 bg-muted animate-pulse rounded w-full" />
            <div class="h-4 bg-muted animate-pulse rounded w-2/3" />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="toolsError" class="flex flex-col items-center justify-center py-20">
        <p class="text-muted-foreground mb-4">{{ t('common.error') }}</p>
        <n-button type="primary" @click="() => {}">{{ t('common.retry') }}</n-button>
      </div>

      <!-- Empty State -->
      <div v-else-if="tools.length === 0" class="flex flex-col items-center justify-center py-20">
        <p class="text-lg text-muted-foreground">{{ t('common.noResults') }}</p>
      </div>

      <!-- Tools Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ToolCard
          v-for="tool in tools"
          :key="tool.id"
          :slug="tool.slug"
          :name="tool.title"
          :description="tool.description ?? ''"
          :category="tool.category ?? ''"
          :category-label="tool.category ?? ''"
          :image="tool.thumbnail ?? ''"
          :pricing="getToolPricing(tool as Record<string, unknown>)"
          :pricing-label="getToolPricingLabel(tool as Record<string, unknown>)"
          :visit-label="t('tools.tryNow')"
          :locale="locale"
        />
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="mt-10 flex justify-center">
        <n-pagination
          :page="currentPage"
          :page-count="pagination.totalPages"
          :page-size="pageSize"
          show-quick-jumper
          @update:page="handlePageChange"
        />
      </div>
      </div>
    </main>
  </AppLayout>
</template>
