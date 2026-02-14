<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch, NSpin } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { validateForm } from '@/composables/useFormValidation'
import PageHeader from '@/components/shared/PageHeader.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const id = computed(() => route.params.id as string)

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  name: '',
  isActive: true,
})

const translations = ref<Record<string, Record<string, string>>>({})
const translationsRef = ref<{ validate: () => string | null } | null>(null)

const translationFields = [
  { key: 'title', label: t('common.title'), required: true },
  { key: 'description', label: t('common.description'), type: 'textarea' as const },
]

const rules: FormRules = {
  name: [{ required: true, message: t('validation.nameRequired'), trigger: 'blur' }],
}

const { isLoading, isError, error } = useQuery({
  queryKey: ['tool-types', id],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tool-types/{id}', {
      params: { path: { id: id.value } },
    })
    if (error) throw new Error(error.error ?? 'Failed to fetch tool type')
    return data
  },
  select: (data) => {
    const tt = data.toolType
    formValue.value = {
      name: tt.name,
      isActive: tt.isActive,
    }
    const trans = tt.translations as Record<string, Record<string, string>> | null
    // Always ensure en.title is populated from title
    translations.value = {
      ...trans,
      en: {
        title: tt.title,
        description: tt.description ?? '',
        ...trans?.en,
      },
    }
    return tt
  },
})

const updateMutation = useMutation({
  mutationFn: async () => {
    const { data, error } = await api.PUT('/api/admin/tool-types/{id}', {
      params: { path: { id: id.value } },
      body: {
        name: formValue.value.name,
        isActive: formValue.value.isActive,
        translations: translations.value as any,
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to update tool type')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tool-types'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'tool-types'] })
    message.success(t('common.updateSuccess'))
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
  updateMutation.mutate()
}
</script>

<template>
  <div>
    <PageHeader :title="t('common.edit') + ' ' + t('nav.toolTypes')">
      <template #actions>
        <NButton @click="router.push({ name: 'tool-types' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <div v-else-if="isError" class="py-8 text-center text-destructive">
      {{ (error as Error)?.message || t('common.error') }}
    </div>

    <div v-else class="space-y-6">
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
          :loading="updateMutation.isPending.value"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
