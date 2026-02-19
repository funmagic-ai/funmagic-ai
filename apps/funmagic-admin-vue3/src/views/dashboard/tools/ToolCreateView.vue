<script setup lang="ts">
import {
  NButton,
  NForm,
  NFormItem,
  NSwitch,
  NSelect,
  NIcon,
  NSpin,
} from 'naive-ui'
import type { FormRules, FormInst, SelectOption } from 'naive-ui'
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
import { getAllToolDefinitions, getToolDefinition } from '@funmagic/shared/tool-registry'
import type { SavedToolConfig, StepConfig, ToolDefinition } from '@funmagic/shared/tool-registry'
import { SUPPORTED_LOCALES } from '@funmagic/shared/config/locales'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

const upload = useUpload({ module: 'tools', visibility: 'public' })
const formRef = ref<FormInst | null>(null)

function handleFileSelect(file: File | null) {
  if (file) {
    upload.setFile(file)
  } else {
    upload.reset()
    formData.thumbnail = ''
  }
}

// Fetch tool types for the select
const { data: toolTypesData, isLoading: toolTypesLoading } = useQuery({
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

// Fetch existing tools to know which slugs are already used
const { data: existingToolsData } = useQuery({
  queryKey: ['admin', 'tools', 'all'],
  queryFn: async () => {
    const { data, error, response } = await api.GET('/api/admin/tools', {
      params: { query: { includeInactive: 'true' } },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
})

const usedSlugs = computed(() => {
  const tools = (existingToolsData.value as { tools?: Array<{ slug: string }> })?.tools ?? []
  return new Set(tools.map((t) => t.slug))
})

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

// Build slug options from registry definitions
const allDefinitions = getAllToolDefinitions()
const slugOptions = computed<SelectOption[]>(() =>
  allDefinitions.map((def) => ({
    label: `${def.displayName || def.name} (${def.name})`,
    value: def.name,
    disabled: usedSlugs.value.has(def.name),
  })),
)

// Form model
const formData = reactive({
  slug: '' as string,
  thumbnail: '',
  toolTypeId: null as string | null,
  isActive: true,
  isFeatured: false,
})

const translations = ref<Record<string, Record<string, string>>>({})
const toolConfig = ref<SavedToolConfig>({ steps: [] })

const toolConfigFormRef = ref<{ validate: () => string | null } | null>(null)
const translationsRef = ref<{ validate: () => string | null } | null>(null)

const translationFields = [
  { key: 'title', label: t('common.title'), required: true },
  { key: 'description', label: t('common.description'), type: 'textarea' as const },
]

// Current tool definition based on selected slug
const currentDefinition = computed<ToolDefinition | null>(() => {
  if (!formData.slug) return null
  return getToolDefinition(formData.slug)
})

// Build initial config from definition
function buildInitialConfig(slug: string): SavedToolConfig {
  const def = getToolDefinition(slug)
  if (!def) return { steps: [] }
  return {
    steps: def.steps.map((stepDef) => {
      const stepConfig: StepConfig = {
        id: stepDef.id,
        provider: {
          name: stepDef.provider.name,
          model: stepDef.provider.model,
          providerOptions: stepDef.provider.providerOptions ?? {},
        },
      }
      for (const [fieldName, fieldDef] of Object.entries(stepDef.fields)) {
        if ('default' in fieldDef) {
          stepConfig[fieldName] = fieldDef.default
        }
      }
      return stepConfig
    }),
  }
}

// On slug selection: auto-fill and build initial config
function handleSlugChange(slug: string) {
  formData.slug = slug
  const def = getToolDefinition(slug)
  if (def) {
    toolConfig.value = buildInitialConfig(slug)
    // Pre-populate all supported locales with translations from definition
    const stepsData = Object.fromEntries(
      def.steps.map((s) => [s.id, { name: s.name, description: s.description ?? '' }]),
    )
    const newTranslations: Record<string, any> = {
      en: {
        title: def.displayName || def.name,
        description: def.description || '',
        steps: stepsData,
      },
    }
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue
      const i18nData = def.i18n?.[locale]
      if (i18nData) {
        newTranslations[locale] = {
          title: i18nData.title,
          description: i18nData.description ?? '',
          steps: i18nData.steps ?? {},
        }
      } else {
        newTranslations[locale] = {
          title: '',
          description: '',
          steps: Object.fromEntries(
            def.steps.map((s) => [s.id, { name: '', description: '' }]),
          ),
        }
      }
    }
    translations.value = newTranslations
  }
}

const rules: FormRules = {
  slug: [
    { required: true, message: t('validation.slugRequired'), trigger: 'change' },
  ],
  toolTypeId: [{ required: true, message: t('validation.toolTypeRequired'), trigger: 'change' }],
}

// Create mutation
const createMutation = useMutation({
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
      toolTypeId: formData.toolTypeId!,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      translations: translations.value as any,
      config: toolConfig.value as Record<string, unknown>,
    }
    const { data, error, response } = await api.POST('/api/admin/tools', { body })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
    message.success(t('common.createSuccess'))
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
  createMutation.mutate()
}
</script>

<template>
  <div>
    <PageHeader :title="t('tools.create')">
      <template #actions>
        <NButton quaternary @click="router.push({ name: 'tools' })">
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
          <NSpin v-if="toolTypesLoading" class="flex justify-center py-12" />
          <NForm
            v-else
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

            <NFormItem :label="t('tools.toolDefinition')" path="slug">
              <NSelect
                :value="formData.slug || null"
                :options="slugOptions"
                :placeholder="t('tools.selectToolDefinition')"
                filterable
                @update:value="handleSlugChange"
              />
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
          :loading="createMutation.isPending.value || upload.isUploading.value"
          :disabled="createMutation.isPending.value || upload.isUploading.value"
          @click="handleSubmit"
        >
          {{ t('common.create') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
