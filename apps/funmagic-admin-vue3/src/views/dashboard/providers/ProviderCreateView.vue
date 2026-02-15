<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { validateForm } from '@/composables/useFormValidation'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

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

const createMutation = useMutation({
  mutationFn: async () => {
    const { data, error, response } = await api.POST('/api/admin/providers', {
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
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['providers'] })
    message.success(t('common.createSuccess'))
    router.push({ name: 'providers' })
  },
  onError: handleError,
})

async function handleSubmit() {
  if (!await validateForm(formRef)) return
  createMutation.mutate()
}
</script>

<template>
  <div>
    <PageHeader :title="t('providers.create')">
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
            :placeholder="t('placeholder.apiKeyOptional')"
          />
        </NFormItem>

        <NFormItem :label="t('providers.apiSecret')">
          <NInput
            v-model:value="formValue.apiSecret"
            type="password"
            show-password-on="click"
            :placeholder="t('placeholder.apiSecretOptional')"
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
            :placeholder="t('placeholder.webhookSecretOptional')"
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
            :loading="createMutation.isPending.value"
            @click="handleSubmit"
          >
            {{ t('common.create') }}
          </NButton>
        </div>
      </NForm>
      </div>
    </div>
  </div>
</template>
