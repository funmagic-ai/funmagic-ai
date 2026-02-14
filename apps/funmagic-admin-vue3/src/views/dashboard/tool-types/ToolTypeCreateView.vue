<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { validateForm } from '@/composables/useFormValidation'
import PageHeader from '@/components/shared/PageHeader.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'
import { SUPPORTED_LOCALES } from '@funmagic/shared/config/locales'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  isActive: true,
})

const translations = ref<Record<string, Record<string, string>>>(
  Object.fromEntries(SUPPORTED_LOCALES.map(locale => [locale, { title: '', description: '' }]))
)
const translationsRef = ref<{ validate: () => string | null } | null>(null)

const translationFields = [
  { key: 'title', label: t('common.title'), required: true },
  { key: 'description', label: t('common.description'), type: 'textarea' as const },
]

const rules: FormRules = {
  name: [{ required: true, message: t('validation.nameRequired'), trigger: 'blur' }],
}

const createMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.POST('/api/admin/tool-types', {
      body: {
        name: formValue.value.name,
        isActive: formValue.value.isActive,
        translations: translations.value as any,
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to create tool type')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tool-types'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'tool-types'] })
    message.success(t('common.createSuccess'))
    router.push({ name: 'tool-types' })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

async function handleSubmit() {
  if (!await validateForm(formRef)) return
  const translationError = translationsRef.value?.validate()
  if (translationError) {
    message.error(translationError)
    return
  }
  createMutation.mutate()
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
            <NFormItem :label="t('common.active')" path="isActive">
              <NSwitch v-model:value="formValue.isActive" />
            </NFormItem>

            <NFormItem :label="t('common.nameSlug')" path="name">
              <NInput v-model:value="formValue.name" :placeholder="t('placeholder.exampleSlug', { example: 'image-generation' })" />
            </NFormItem>
          </NForm>
        </div>
      </div>

      <TranslationsEditor
        ref="translationsRef"
        v-model="translations"
        :fields="translationFields"
        :title="t('tools.translations')"
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
