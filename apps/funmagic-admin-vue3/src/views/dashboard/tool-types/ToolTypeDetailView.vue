<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NIcon, NSwitch, NSpin } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
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
      displayName: tt.displayName,
      description: tt.description ?? '',
      isActive: tt.isActive,
    }
    if (tt.translations) {
      translations.value = tt.translations as Record<string, Record<string, string>>
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
        displayName: formValue.value.displayName,
        description: formValue.value.description || undefined,
        isActive: formValue.value.isActive,
        translations: translations.value as any,
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to update tool type')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tool-types'] })
    message.success(t('common.updateSuccess'))
    router.push({ name: 'tool-types' })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    updateMutation.mutate()
  } catch {
    // validation failed
  }
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
          :loading="updateMutation.isPending.value"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
