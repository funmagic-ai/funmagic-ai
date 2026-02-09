<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import type { SupportedLocale } from '@/lib/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'
import HeroCarousel from '@/components/home/HeroCarousel.vue'
import SideBanner from '@/components/home/SideBanner.vue'
import ToolCard from '@/components/tools/ToolCard.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const locale = computed(() => (route.params.locale as string) || 'en')

// Fetch main banners
const { data: mainBannersData, isLoading: loadingMainBanners } = useQuery({
  queryKey: ['banners', 'main', locale],
  queryFn: async () => {
    const { data } = await api.GET('/api/banners', {
      params: { query: { type: 'main', locale: locale.value as SupportedLocale } },
    })
    return data
  },
})

// Fetch side banners
const { data: sideBannersData, isLoading: loadingSideBanners } = useQuery({
  queryKey: ['banners', 'side', locale],
  queryFn: async () => {
    const { data } = await api.GET('/api/banners', {
      params: { query: { type: 'side', locale: locale.value as SupportedLocale } },
    })
    return data
  },
})

// Fetch tools
const { data: toolsData, isLoading: loadingTools } = useQuery({
  queryKey: ['featured-tools', locale],
  queryFn: async () => {
    const { data } = await api.GET('/api/tools', {
      params: { query: { limit: 8, locale: locale.value as SupportedLocale } },
    })
    return data
  },
})

const mainBanners = computed(() => {
  const banners = mainBannersData.value?.banners ?? []
  return banners.map((b: any) => ({
    id: b.id,
    title: b.title,
    description: b.description ?? '',
    image: b.thumbnail,
    badge: b.badge ?? '',
  }))
})

const sideBanners = computed(() => sideBannersData.value?.banners ?? [])
const tools = computed(() => toolsData.value?.tools ?? [])

function getToolPricing(tool: any): 'free' | 'freemium' | 'paid' {
  const config = tool.config as { steps?: Array<{ cost?: number; [key: string]: unknown }> } | undefined
  if (!config?.steps || config.steps.length === 0) return 'free'
  const hasPaidStep = config.steps.some((step) => (step.cost ?? 0) > 0)
  return hasPaidStep ? 'paid' : 'free'
}

function getToolPricingLabel(tool: any): string {
  if (tool.pricingLabel) return tool.pricingLabel
  const pricing = getToolPricing(tool)
  return pricing === 'free' ? t('pricing.free') : t('pricing.paid')
}

function navigateToTools() {
  router.push({ name: 'tools', params: { locale: locale.value } })
}
</script>

<template>
  <AppLayout>
    <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 md:pt-8 md:pb-16">
      <div class="w-full max-w-7xl flex flex-col gap-16">

        <!-- Hero Section: Carousel + Side Banners -->
        <section>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Main Carousel -->
            <div class="lg:col-span-8">
              <div v-if="loadingMainBanners" class="aspect-[21/9] rounded-2xl bg-muted animate-pulse" />
              <HeroCarousel v-else :slides="mainBanners" :featured-label="t('home.featuredTools')" />
            </div>

            <!-- Side Banners -->
            <div class="lg:col-span-4 flex flex-col gap-6">
              <template v-if="loadingSideBanners">
                <div class="aspect-[21/9] lg:flex-1 rounded-2xl bg-muted animate-pulse" />
                <div class="aspect-[21/9] lg:flex-1 rounded-2xl bg-muted animate-pulse" />
              </template>
              <template v-else-if="sideBanners.length > 0">
                <SideBanner
                  v-for="(banner, idx) in sideBanners.slice(0, 2)"
                  :key="banner.id"
                  :title="banner.title"
                  :description="banner.description ?? ''"
                  :label="banner.badge ?? banner.linkText ?? 'Explore'"
                  :label-color="idx === 0 ? 'primary' : 'teal'"
                  :image="banner.thumbnail"
                  :href="banner.link || `/${locale}/tools`"
                />
              </template>
              <template v-else>
                <div class="aspect-[21/9] lg:flex-1 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-end p-6">
                  <div>
                    <p class="text-sm font-semibold text-primary uppercase tracking-wider">{{ t('home.getStarted') }}</p>
                    <h3 class="text-xl font-bold leading-tight mt-1">{{ t('home.heroTitle') }}</h3>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </section>

        <!-- Tools Grid Section -->
        <section>
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-2xl font-bold text-foreground sm:text-3xl">
              {{ t('home.featuredTools') }}
            </h2>
            <n-button text type="primary" @click="navigateToTools">
              {{ t('common.viewAll') }} &rarr;
            </n-button>
          </div>

          <!-- Loading Skeletons -->
          <div v-if="loadingTools" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

          <!-- Empty State -->
          <div v-else-if="tools.length === 0" class="text-center py-12">
            <p class="text-muted-foreground">{{ t('tools.noTools') }}</p>
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
              :category-label="tool.categoryLabel ?? tool.category ?? ''"
              :image="tool.thumbnail ?? ''"
              :rating="tool.rating ?? 0"
              :pricing="getToolPricing(tool)"
              :pricing-label="getToolPricingLabel(tool)"
              :visit-label="t('tools.tryNow')"
              :locale="locale"
            />
          </div>
        </section>

      </div>
    </main>
  </AppLayout>
</template>
