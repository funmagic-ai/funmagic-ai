<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch, NSpin, NTag, NInputNumber, NDivider } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { validateForm } from '@/composables/useFormValidation'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

const id = computed(() => route.params.id as string)

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  displayName: '',
  description: '',
  apiKey: '',
  apiSecret: '',
  baseUrl: '',
  webhookSecret: '',
  healthCheckUrl: '',
  isActive: true,
  maxConcurrency: null as number | null,
  maxPerMinute: null as number | null,
  maxPerDay: null as number | null,
  retryOn429: true,
  maxRetries: 3,
  baseBackoffMs: 1000,
})

const originalConfig = ref<Record<string, unknown> | null>(null)

function buildRateLimitConfig() {
  const rl: Record<string, unknown> = {}
  if (formValue.value.maxConcurrency != null) rl.maxConcurrency = formValue.value.maxConcurrency
  if (formValue.value.maxPerMinute != null) rl.maxPerMinute = formValue.value.maxPerMinute
  if (formValue.value.maxPerDay != null) rl.maxPerDay = formValue.value.maxPerDay
  if (!formValue.value.retryOn429) rl.retryOn429 = false
  if (formValue.value.maxRetries !== 3) rl.maxRetries = formValue.value.maxRetries
  if (formValue.value.baseBackoffMs !== 1000) rl.baseBackoffMs = formValue.value.baseBackoffMs
  return Object.keys(rl).length > 0 ? rl : undefined
}

function buildConfigBody() {
  const existing = originalConfig.value ?? {}
  const { rateLimit: _, ...otherConfig } = existing
  const rateLimit = buildRateLimitConfig()
  return rateLimit ? { ...otherConfig, rateLimit } : { ...otherConfig }
}

const rules: FormRules = {
  name: [{ required: true, message: t('validation.nameRequired'), trigger: 'blur' }],
  displayName: [{ required: true, message: t('validation.displayNameRequired'), trigger: 'blur' }],
}

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['providers', id],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/providers/{id}', {
      params: { path: { id: id.value } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  select: (data) => {
    const p = data.provider
    const cfg = (p.config as Record<string, unknown>) ?? {}
    const rl = (cfg.rateLimit as Record<string, unknown>) ?? {}
    originalConfig.value = cfg
    formValue.value = {
      name: p.name,
      displayName: p.displayName,
      description: p.description ?? '',
      apiKey: '',
      apiSecret: '',
      baseUrl: p.baseUrl ?? '',
      webhookSecret: '',
      healthCheckUrl: p.healthCheckUrl ?? '',
      isActive: p.isActive,
      maxConcurrency: (rl.maxConcurrency as number) ?? null,
      maxPerMinute: (rl.maxPerMinute as number) ?? null,
      maxPerDay: (rl.maxPerDay as number) ?? null,
      retryOn429: (rl.retryOn429 as boolean) ?? true,
      maxRetries: (rl.maxRetries as number) ?? 3,
      baseBackoffMs: (rl.baseBackoffMs as number) ?? 1000,
    }
    return p
  },
})

const updateMutation = useMutation({
  mutationFn: async () => {
    const { data, error, response } = await api.PUT('/api/admin/providers/{id}', {
      params: { path: { id: id.value } },
      body: {
        name: formValue.value.name,
        displayName: formValue.value.displayName,
        isActive: formValue.value.isActive,
        ...(formValue.value.description ? { description: formValue.value.description } : {}),
        ...(formValue.value.apiKey ? { apiKey: formValue.value.apiKey } : {}),
        ...(formValue.value.apiSecret ? { apiSecret: formValue.value.apiSecret } : {}),
        ...(formValue.value.baseUrl ? { baseUrl: formValue.value.baseUrl } : {}),
        ...(formValue.value.webhookSecret ? { webhookSecret: formValue.value.webhookSecret } : {}),
        ...(formValue.value.healthCheckUrl ? { healthCheckUrl: formValue.value.healthCheckUrl } : {}),
        config: buildConfigBody(),
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['providers'] })
    message.success(t('common.updateSuccess'))
    router.push({ name: 'providers' })
  },
  onError: handleError,
})

const healthCheckMutation = useMutation({
  mutationFn: async () => {
    const { data, error, response } = await api.POST('/api/admin/providers/{id}/health-check', {
      params: { path: { id: id.value } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['providers', id] })
    message.success(data.isHealthy ? t('common.providerHealthy') : t('common.providerUnhealthy'))
  },
  onError: handleError,
})

async function handleSubmit() {
  if (!await validateForm(formRef)) return
  updateMutation.mutate()
}
</script>

<template>
  <div>
    <PageHeader :title="t('providers.editProvider')">
      <template #actions>
        <NButton @click="router.push({ name: 'providers' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <div class="rounded-xl border bg-card py-6 shadow-sm">
      <div class="px-6">
      <div v-if="isLoading" class="flex justify-center py-12">
        <NSpin size="large" />
      </div>

      <div v-else-if="isError" class="py-8 text-center text-destructive">
        {{ (error as Error)?.message || t('common.error') }}
      </div>

      <template v-else>
        <NForm
          ref="formRef"
          :model="formValue"
          :rules="rules"
          label-placement="left"
          label-width="160"
        >
          <NFormItem v-if="data" :label="t('common.status')">
            <div class="flex items-center gap-2">
              <NTag v-if="data.hasApiKey" type="success" size="small">{{ t('common.apiKeySet') }}</NTag>
              <NTag v-else type="warning" size="small">{{ t('common.noApiKey') }}</NTag>
              <NTag v-if="data.hasApiSecret" type="success" size="small">{{ t('common.apiSecretSet') }}</NTag>
              <NTag
                size="small"
                :type="data.healthCheckUrl ? 'info' : 'default'"
                :style="{ cursor: data.healthCheckUrl ? 'pointer' : 'not-allowed', opacity: data.healthCheckUrl ? 1 : 0.5 }"
                @click="data.healthCheckUrl && healthCheckMutation.mutate()"
              >
                {{ healthCheckMutation.isPending.value ? t('common.checking') : t('common.runHealthCheck') }}
              </NTag>
            </div>
          </NFormItem>

          <NFormItem :label="t('common.active')">
            <NSwitch v-model:value="formValue.isActive" />
          </NFormItem>

          <NFormItem :label="t('common.nameSlug')" path="name">
            <NInput v-model:value="formValue.name" :placeholder="t('placeholder.exampleSlug', { example: 'openai-main' })" />
          </NFormItem>

          <NFormItem :label="t('common.displayName')" path="displayName">
            <NInput v-model:value="formValue.displayName" :placeholder="t('placeholder.exampleDisplayName', { example: 'OpenAI (Main)' })" />
          </NFormItem>

          <NFormItem :label="t('common.description')">
            <NInput
              v-model:value="formValue.description"
              type="textarea"
              :rows="3"
              :placeholder="t('placeholder.optionalDescription')"
            />
          </NFormItem>

          <NFormItem :label="t('providers.apiKey')">
            <NInput
              v-model:value="formValue.apiKey"
              type="password"
              show-password-on="click"
              :placeholder="data?.apiKeyPreview ? `${t('providers.current')}: ${data.apiKeyPreview}  —  ${t('placeholder.leaveEmptyToKeep')}` : t('placeholder.leaveEmptyToKeep')"
            />
          </NFormItem>

          <NFormItem :label="t('providers.apiSecret')">
            <NInput
              v-model:value="formValue.apiSecret"
              type="password"
              show-password-on="click"
              :placeholder="t('placeholder.leaveEmptyToKeep')"
            />
          </NFormItem>

          <NFormItem :label="t('providers.baseUrl')">
            <NInput v-model:value="formValue.baseUrl" :placeholder="t('placeholder.exampleUrl')" />
          </NFormItem>

          <NFormItem :label="t('providers.webhookSecret')">
            <NInput
              v-model:value="formValue.webhookSecret"
              type="password"
              show-password-on="click"
              :placeholder="t('placeholder.leaveEmptyToKeep')"
            />
          </NFormItem>

          <NFormItem :label="t('providers.healthCheckUrl')">
            <NInput v-model:value="formValue.healthCheckUrl" :placeholder="t('placeholder.exampleHealthCheckUrl')" />
          </NFormItem>

          <NDivider>{{ t('providers.providerRateLimit.title') }}</NDivider>
          <p class="mb-4 text-sm text-muted-foreground">{{ t('providers.providerRateLimit.description') }}</p>

          <NFormItem :label="t('providers.providerRateLimit.maxConcurrency')">
            <NInputNumber v-model:value="formValue.maxConcurrency" :min="1" clearable :placeholder="t('providers.providerRateLimit.unlimited')" style="width: 100%" />
          </NFormItem>

          <NFormItem :label="t('providers.providerRateLimit.maxPerMinute')">
            <NInputNumber v-model:value="formValue.maxPerMinute" :min="1" clearable :placeholder="t('providers.providerRateLimit.unlimited')" style="width: 100%" />
          </NFormItem>

          <NFormItem :label="t('providers.providerRateLimit.maxPerDay')">
            <NInputNumber v-model:value="formValue.maxPerDay" :min="1" clearable :placeholder="t('providers.providerRateLimit.unlimited')" style="width: 100%" />
          </NFormItem>

          <NFormItem :label="t('providers.providerRateLimit.retryOn429')">
            <NSwitch v-model:value="formValue.retryOn429" />
          </NFormItem>

          <NFormItem :label="t('providers.providerRateLimit.maxRetries')">
            <NInputNumber v-model:value="formValue.maxRetries" :min="1" :max="10" style="width: 100%" />
          </NFormItem>

          <NFormItem :label="t('providers.providerRateLimit.baseBackoffMs')">
            <NInputNumber v-model:value="formValue.baseBackoffMs" :min="100" :step="100" style="width: 100%" />
          </NFormItem>

          <div class="flex justify-end gap-2 pt-4">
            <NButton @click="router.back()">
              {{ t('common.cancel') }}
            </NButton>
            <NButton
              type="primary"
              :loading="updateMutation.isPending.value"
              @click="handleSubmit"
            >
              {{ t('common.save') }}
            </NButton>
          </div>
        </NForm>
      </template>
      </div>
    </div>

  </div>
</template>
