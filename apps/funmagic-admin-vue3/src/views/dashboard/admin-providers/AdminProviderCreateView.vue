<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useMutation } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  displayName: '',
  description: '',
  apiKey: '',
  apiSecret: '',
  baseUrl: '',
  isActive: true,
})

const rules: FormRules = {
  name: [{ required: true, message: t('validation.nameRequired'), trigger: 'blur' }],
  displayName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
}

const createMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/admin/admin-providers', {
      body: {
        name: formValue.value.name,
        displayName: formValue.value.displayName,
        isActive: formValue.value.isActive,
        ...(formValue.value.description ? { description: formValue.value.description } : {}),
        ...(formValue.value.apiKey ? { apiKey: formValue.value.apiKey } : {}),
        ...(formValue.value.apiSecret ? { apiSecret: formValue.value.apiSecret } : {}),
        ...(formValue.value.baseUrl ? { baseUrl: formValue.value.baseUrl } : {}),
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to create admin provider')
    return data
  },
  onSuccess: () => {
    message.success(t('common.createSuccess'))
    router.push({ name: 'admin-providers' })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    createMutation.mutate()
  } catch {
    // validation failed
  }
}
</script>

<template>
  <div>
    <PageHeader :title="'Create ' + t('nav.adminProviders')">
      <template #actions>
        <NButton @click="router.push({ name: 'admin-providers' })">
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
        <NFormItem label="Name (slug)" path="name">
          <NInput v-model:value="formValue.name" placeholder="e.g. openai-admin" />
        </NFormItem>

        <NFormItem label="Display Name" path="displayName">
          <NInput v-model:value="formValue.displayName" placeholder="e.g. OpenAI Admin" />
        </NFormItem>

        <NFormItem :label="t('common.description')">
          <NInput
            v-model:value="formValue.description"
            type="textarea"
            :rows="3"
            placeholder="Optional description"
          />
        </NFormItem>

        <NFormItem :label="t('providers.apiKey')">
          <NInput
            v-model:value="formValue.apiKey"
            type="password"
            show-password-on="click"
            placeholder="API key (optional)"
          />
        </NFormItem>

        <NFormItem label="API Secret">
          <NInput
            v-model:value="formValue.apiSecret"
            type="password"
            show-password-on="click"
            placeholder="API secret (optional)"
          />
        </NFormItem>

        <NFormItem :label="t('providers.baseUrl')">
          <NInput v-model:value="formValue.baseUrl" placeholder="https://api.example.com" />
        </NFormItem>

        <NFormItem label="Active">
          <NSwitch v-model:value="formValue.isActive" />
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
