<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch, NSpin, NTag } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { validateForm } from '@/composables/useFormValidation'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
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
})

const rules: FormRules = {
  name: [{ required: true, message: t('validation.nameRequired'), trigger: 'blur' }],
  displayName: [{ required: true, message: t('validation.displayNameRequired'), trigger: 'blur' }],
}

const { data, isLoading, isError, error } = useQuery({
  queryKey: ['providers', id],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/providers/{id}', {
      params: { path: { id: id.value } },
    })
    if (error) throw new Error(error.error ?? 'Failed to fetch provider')
    return data
  },
  select: (data) => {
    const p = data.provider
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
    }
    return p
  },
})

const updateMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.PUT('/api/admin/providers/{id}', {
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
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to update provider')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['providers'] })
    message.success(t('common.updateSuccess'))
    router.push({ name: 'providers' })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

const healthCheckMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/admin/providers/{id}/health-check', {
      params: { path: { id: id.value } },
    })
    if (error) throw new Error(error.error ?? 'Health check failed')
    return data
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['providers', id] })
    message.success(data.isHealthy ? t('common.providerHealthy') : t('common.providerUnhealthy'))
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
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
        <div v-if="data" class="mb-4 flex items-center gap-2">
          <NTag v-if="data.hasApiKey" type="success" size="small">{{ t('common.apiKeySet') }}</NTag>
          <NTag v-else type="warning" size="small">{{ t('common.noApiKey') }}</NTag>
          <NTag v-if="data.hasApiSecret" type="success" size="small">{{ t('common.apiSecretSet') }}</NTag>
          <NButton
            size="small"
            :loading="healthCheckMutation.isPending.value"
            @click="healthCheckMutation.mutate()"
          >
            {{ t('common.runHealthCheck') }}
          </NButton>
        </div>

        <NForm
          ref="formRef"
          :model="formValue"
          :rules="rules"
          label-placement="left"
          label-width="160"
        >
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
