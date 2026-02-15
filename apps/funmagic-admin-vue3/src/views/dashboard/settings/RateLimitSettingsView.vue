<script setup lang="ts">
import { NButton, NIcon, NInputNumber, NInput, NSpin } from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'

interface RateLimitTier {
  name: string
  minPurchased: number
  multiplier: number
}

interface LimitEntry {
  max: number
  windowSeconds: number
}

interface RateLimitConfig {
  tiers: RateLimitTier[]
  limits: Record<string, LimitEntry>
}

const { t } = useI18n()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['settings', 'rate-limit'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/settings/rate-limit' as any, {})
    if (error) throw extractApiError(error, response)
    return data as { config: RateLimitConfig }
  },
})

// Local form state — deep clone from server data
const formConfig = ref<RateLimitConfig | null>(null)

watch(
  () => data.value,
  (val) => {
    if (val?.config) {
      formConfig.value = JSON.parse(JSON.stringify(val.config))
    }
  },
  { immediate: true },
)

const saveMutation = useMutation({
  mutationFn: async (config: RateLimitConfig) => {
    const { data, error, response } = await api.PUT('/api/admin/settings/rate-limit' as any, {
      body: config as any,
    })
    if (error) throw extractApiError(error, response)
    return data as { config: RateLimitConfig }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['settings', 'rate-limit'] })
    message.success(t('common.saveSuccess'))
  },
  onError: handleError,
})

function addTier() {
  if (!formConfig.value) return
  formConfig.value.tiers.push({ name: '', minPurchased: 0, multiplier: 1 })
}

function removeTier(index: number) {
  if (!formConfig.value) return
  formConfig.value.tiers.splice(index, 1)
}

function save() {
  if (!formConfig.value) return
  saveMutation.mutate(formConfig.value)
}

const limitCategories = [
  'globalApi',
  'userApi',
  'taskCreation',
  'upload',
  'authSession',
  'authAction',
] as const

const LIMITS_GRID = 'grid grid-cols-[minmax(80px,2fr)_minmax(100px,3fr)_minmax(100px,3fr)] gap-2'
</script>

<template>
  <div>
    <PageHeader :title="t('settings.rateLimit.title')" />

    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <div v-else-if="isError" class="py-8 text-center text-destructive">
      {{ (error as Error)?.message || t('common.error') }}
    </div>

    <div v-else-if="formConfig" class="space-y-6">
      <!-- Tiers Section -->
      <div class="rounded-xl border bg-card py-6 shadow-sm">
        <div class="px-6">
          <h3 class="mb-4 text-base font-medium">{{ t('settings.rateLimit.tiers') }}</h3>

          <!-- Column headers -->
          <div class="mb-2 grid grid-cols-[minmax(80px,2fr)_minmax(100px,3fr)_minmax(80px,2fr)_32px] gap-2 text-xs font-medium text-muted-foreground">
            <div>{{ t('settings.rateLimit.tierName') }}</div>
            <div>{{ t('settings.rateLimit.minPurchased') }}</div>
            <div>{{ t('settings.rateLimit.multiplier') }}</div>
            <div />
          </div>

          <!-- Tier rows -->
          <div class="space-y-2">
            <div
              v-for="(tier, i) in formConfig.tiers"
              :key="i"
              class="grid grid-cols-[minmax(80px,2fr)_minmax(100px,3fr)_minmax(80px,2fr)_32px] items-center gap-2"
            >
              <NInput
                v-model:value="tier.name"
                size="small"
              />
              <NInputNumber
                v-model:value="tier.minPurchased"
                :min="0"
                size="small"
                class="w-full"
              />
              <NInputNumber
                v-model:value="tier.multiplier"
                :min="0.1"
                :step="0.5"
                size="small"
                class="w-full"
              />
              <NButton
                size="small"
                quaternary
                type="error"
                :disabled="formConfig.tiers.length <= 1"
                @click="removeTier(i)"
              >
                <template #icon>
                  <NIcon><TrashOutline /></NIcon>
                </template>
              </NButton>
            </div>
          </div>

          <!-- Add tier -->
          <div class="mt-4 border-t pt-4">
            <NButton size="small" dashed @click="addTier">
              <template #icon>
                <NIcon><AddOutline /></NIcon>
              </template>
              {{ t('settings.rateLimit.addTier') }}
            </NButton>
          </div>
        </div>
      </div>

      <!-- Limits Section -->
      <div class="rounded-xl border bg-card py-6 shadow-sm">
        <div class="px-6">
          <h3 class="mb-4 text-base font-medium">{{ t('settings.rateLimit.baseLimits') }}</h3>

          <!-- Column headers -->
          <div :class="[LIMITS_GRID, 'mb-2 text-xs font-medium text-muted-foreground']">
            <div>{{ t('settings.rateLimit.endpoint') }}</div>
            <div>{{ t('settings.rateLimit.maxRequests') }}</div>
            <div>{{ t('settings.rateLimit.window') }}</div>
          </div>

          <!-- Limit rows -->
          <div class="space-y-2">
            <div
              v-for="cat in limitCategories"
              :key="cat"
              :class="[LIMITS_GRID, 'items-center']"
            >
              <div class="text-sm font-medium truncate">{{ t(`settings.rateLimit.${cat}`) }}</div>
              <NInputNumber
                v-model:value="formConfig.limits[cat].max"
                :min="1"
                size="small"
                class="w-full"
              />
              <NInputNumber
                v-model:value="formConfig.limits[cat].windowSeconds"
                :min="1"
                size="small"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <NButton
          type="primary"
          :loading="saveMutation.isPending.value"
          :disabled="!formConfig"
          @click="save"
        >
          {{ t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
