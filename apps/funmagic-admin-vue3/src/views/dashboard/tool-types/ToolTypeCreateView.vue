<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useMutation } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  displayName: '',
  description: '',
  isActive: true,
})

const translations = ref<Record<string, Record<string, string>>>({})

const translationFields = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
]

const rules: FormRules = {
  name: [{ required: true, message: t('validation.nameRequired'), trigger: 'blur' }],
  displayName: [{ required: true, message: 'Display name is required', trigger: 'blur' }],
}

const createMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/admin/tool-types', {
      body: {
        name: formValue.value.name,
        displayName: formValue.value.displayName,
        description: formValue.value.description || undefined,
        isActive: formValue.value.isActive,
        translations: translations.value as any,
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to create tool type')
    return data
  },
  onSuccess: () => {
    message.success(t('common.createSuccess'))
    router.push({ name: 'tool-types' })
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
    <PageHeader :title="t('common.create') + ' ' + t('nav.toolTypes')">
      <template #actions>
        <NButton @click="router.push({ name: 'tool-types' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <div class="space-y-6">
      <div class="rounded-xl border bg-card py-6 shadow-sm">
        <div class="px-6">
          <NForm
            ref="formRef"
            :model="formValue"
            :rules="rules"
            label-placement="left"
            label-width="140"
          >
            <NFormItem label="Name (slug)" path="name">
              <NInput v-model:value="formValue.name" placeholder="e.g. image-generation" />
            </NFormItem>

            <NFormItem label="Display Name" path="displayName">
              <NInput v-model:value="formValue.displayName" placeholder="e.g. Image Generation" />
            </NFormItem>

            <NFormItem :label="t('common.description')" path="description">
              <NInput
                v-model:value="formValue.description"
                type="textarea"
                :rows="3"
                placeholder="Optional description"
              />
            </NFormItem>

            <NFormItem label="Active" path="isActive">
              <NSwitch v-model:value="formValue.isActive" />
            </NFormItem>
          </NForm>
        </div>
      </div>

      <TranslationsEditor
        v-model="translations"
        :fields="translationFields"
      />

      <div class="flex justify-end gap-2">
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
    </div>
  </div>
</template>
