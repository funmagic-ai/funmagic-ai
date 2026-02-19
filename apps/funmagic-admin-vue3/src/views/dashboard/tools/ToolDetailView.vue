<script setup lang="ts">
import {
  NButton,
  NInput,
  NForm,
  NFormItem,
  NSwitch,
  NSelect,
  NIcon,
  NSpin,
  NEmpty,
} from 'naive-ui'
import type { FormRules, FormInst } from 'naive-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'
import ImageUploadZone from '@/components/shared/ImageUploadZone.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'
import ToolConfigForm from '@/components/tools/ToolConfigForm.vue'
import { useUpload } from '@/composables/useUpload'
import { validateForm, scrollToElement } from '@/composables/useFormValidation'
import { getToolDefinition } from '@funmagic/shared/tool-registry'
import type { SavedToolConfig } from '@funmagic/shared/tool-registry'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

const upload = useUpload({ module: 'tools', visibility: 'public' })
const toolId = computed(() => route.params.id as string)
const formRef = ref<FormInst | null>(null)

function handleFileSelect(file: File | null) {
  if (file) {
    upload.setFile(file)
  } else {
    upload.reset()
    formData.thumbnail = ''
  }
}

// Fetch tool detail
const {
  data: toolData,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: computed(() => ['admin', 'tools', toolId.value]),
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/tools/{id}', {
      params: { path: { id: toolId.value } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  enabled: computed(() => !!toolId.value),
})

// Fetch tool types for the select
const { data: toolTypesData } = useQuery({
  queryKey: ['admin', 'tool-types'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/tool-types')
    if (error) throw extractApiError(error, response)
    return data
  },
})

const toolTypeOptions = computed(() =>
  (toolTypesData.value?.toolTypes ?? []).map((tt) => ({
    label: tt.title,
    value: tt.id,
  })),
)

// Fetch providers for ToolConfigForm
const { data: providersData } = useQuery({
  queryKey: ['admin', 'providers'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/providers')
    if (error) throw extractApiError(error, response)
    return data
  },
})

const providers = computed(() => {
  const list = (providersData.value as { providers?: Array<{ id: string; name: string; displayName: string; isActive: boolean }> })?.providers ?? []
  return list.map((p) => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    isActive: p.isActive,
  }))
})

// Form model
const formData = reactive({
  slug: '',
  thumbnail: '',
  toolTypeId: null as string | null,
  isActive: true,
  isFeatured: false,
})

const translations = ref<Record<string, Record<string, string>>>({})
const toolConfig = ref<SavedToolConfig>({ steps: [] })

// Compute tool definition from slug
const currentDefinition = computed(() => {
  if (!formData.slug) return null
  return getToolDefinition(formData.slug)
})

const toolConfigFormRef = ref<{ validate: () => string | null } | null>(null)
const translationsRef = ref<{ validate: () => string | null } | null>(null)

const translationFields = [
  { key: 'title', label: t('common.title'), required: true },
  { key: 'description', label: t('common.description'), type: 'textarea' as const },
]

// Populate form when data arrives
watch(
  () => toolData.value,
  (tool) => {
    if (tool?.tool) {
      formData.slug = tool.tool.slug
      formData.thumbnail = (tool.tool as any).thumbnail ?? ''
      formData.toolTypeId = tool.tool.toolTypeId
      formData.isActive = tool.tool.isActive
      formData.isFeatured = tool.tool.isFeatured
      if (tool.tool.translations) {
        translations.value = tool.tool.translations as unknown as Record<string, Record<string, string>>
      }
      const cfg = tool.tool.config as SavedToolConfig | undefined
      toolConfig.value = { steps: [], ...cfg }
    }
  },
  { immediate: true },
)

const rules: FormRules = {
  slug: [
    { required: true, message: t('validation.slugRequired'), trigger: 'blur' },
    {
      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      message: t('validation.slugFormat'),
      trigger: 'blur',
    },
  ],
  toolTypeId: [{ required: true, message: t('validation.toolTypeRequired'), trigger: 'change' }],
}

// Update mutation
const updateMutation = useMutation({
  mutationFn: async () => {
    let thumbnailValue = formData.thumbnail

    if (upload.pendingFile.value) {
      const result = await upload.uploadOnSubmit()
      if (!result) throw new Error(upload.error.value ?? 'Upload failed')
      thumbnailValue = result.storageKey
    }

    const enTranslation = translations.value.en ?? {}
    const body = {
      title: enTranslation.title || formData.slug,
      slug: formData.slug,
      description: enTranslation.description || undefined,
      thumbnail: thumbnailValue || undefined,
      toolTypeId: formData.toolTypeId ?? undefined,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      translations: translations.value as any,
      config: toolConfig.value,
    }
    const { data, error, response } = await api.PUT('/api/admin/tools/{id}', {
      params: { path: { id: toolId.value } },
      body,
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
    message.success(t('common.updateSuccess'))
    router.push({ name: 'tools' })
  },
  onError: handleError,
})

async function handleSubmit() {
  if (!await validateForm(formRef)) return
  const configError = toolConfigFormRef.value?.validate()
  if (configError) {
    message.error(configError)
    return
  }
  const translationError = translationsRef.value?.validate()
  if (translationError) {
    message.error(translationError)
    scrollToElement(translationsRef as Ref<any>)
    return
  }
  updateMutation.mutate()
}
</script>

<template>
  <div>
    <PageHeader :title="t('tools.editTool')">
      <template #actions>
        <NButton quaternary @click="router.push({ name: 'tools' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <!-- Error -->
    <div v-else-if="isError" class="py-12 text-center">
      <NEmpty :description="t('tools.notFoundOrFailed')">
        <template #extra>
          <NButton @click="() => refetch()">{{ t('common.retry') }}</NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Form -->
    <div v-else class="space-y-6">
      <div class="rounded-xl border bg-card py-6 shadow-sm">
        <div class="px-6">
          <NForm
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-placement="top"
            require-mark-placement="right-hanging"
          >
            <div class="grid grid-cols-2 gap-4">
              <NFormItem :label="t('common.active')" path="isActive">
                <NSwitch v-model:value="formData.isActive" />
              </NFormItem>

              <NFormItem :label="t('common.featured')" path="isFeatured">
                <NSwitch v-model:value="formData.isFeatured" />
              </NFormItem>
            </div>

            <NFormItem :label="t('tools.toolType')" path="toolTypeId">
              <NSelect
                v-model:value="formData.toolTypeId"
                :options="toolTypeOptions"
                :placeholder="t('tools.selectToolType')"
                filterable
              />
            </NFormItem>

            <NFormItem :label="t('tools.toolDefinition')">
              <NInput :value="formData.slug" disabled />
            </NFormItem>

            <NFormItem :label="t('tools.thumbnail')">
              <ImageUploadZone
                v-model="formData.thumbnail"
                :file-preview="upload.preview.value"
                :uploading="upload.isUploading.value"
                :progress="upload.progress.value"
                aspect-ratio="16/9"
                @file-select="handleFileSelect"
              />
            </NFormItem>
          </NForm>
        </div>
      </div>

      <ToolConfigForm
        ref="toolConfigFormRef"
        v-model="toolConfig"
        :definition="currentDefinition"
        :providers="providers"
        :translations="translations"
        :title="t('tools.configuration')"
      />

      <TranslationsEditor
        ref="translationsRef"
        v-model="translations"
        :fields="translationFields"
        :steps="currentDefinition?.steps.map(s => ({ id: s.id, name: s.name })) ?? []"
        :title="t('tools.translations')"
      />

      <div class="flex justify-end gap-2">
        <NButton @click="router.push({ name: 'tools' })">
          {{ t('common.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="updateMutation.isPending.value || upload.isUploading.value"
          :disabled="updateMutation.isPending.value || upload.isUploading.value"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
