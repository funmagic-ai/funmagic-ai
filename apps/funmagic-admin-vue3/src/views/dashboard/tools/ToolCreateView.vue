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
} from 'naive-ui'
import type { FormRules, FormInst, SelectOption } from 'naive-ui'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'
import ToolConfigForm from '@/components/tools/ToolConfigForm.vue'
import { getAllToolDefinitions, getToolDefinition } from '@funmagic/shared/tool-registry'
import type { SavedToolConfig, StepConfig, ToolDefinition } from '@funmagic/shared/tool-registry'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

const formRef = ref<FormInst | null>(null)

// Fetch tool types for the select
const { data: toolTypesData, isLoading: toolTypesLoading } = useQuery({
  queryKey: ['admin', 'tool-types'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tool-types')
    if (error) throw new Error('Failed to fetch tool types')
    return data
  },
})

const toolTypeOptions = computed(() =>
  (toolTypesData.value?.toolTypes ?? []).map((tt) => ({
    label: tt.displayName,
    value: tt.id,
  })),
)

// Fetch existing tools to know which slugs are already used
const { data: existingToolsData } = useQuery({
  queryKey: ['admin', 'tools', 'all'],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tools', {
      params: { query: { includeInactive: true } },
    })
    if (error) throw new Error('Failed to fetch existing tools')
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
    const { data, error } = await api.GET('/api/admin/providers')
    if (error) throw new Error('Failed to fetch providers')
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
  title: '',
  slug: '' as string,
  description: '',
  shortDescription: '',
  toolTypeId: null as string | null,
  isActive: true,
  isFeatured: false,
})

const translations = ref<Record<string, Record<string, string>>>({})
const toolConfig = ref<SavedToolConfig>({ steps: [] })

const translationFields = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description', type: 'textarea' as const },
  { key: 'shortDescription', label: 'Short Description' },
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
        name: stepDef.name,
        description: stepDef.description,
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

// On slug selection: auto-fill title and build initial config
function handleSlugChange(slug: string) {
  formData.slug = slug
  const def = getToolDefinition(slug)
  if (def) {
    formData.title = def.displayName || def.name
    formData.description = def.description || ''
    toolConfig.value = buildInitialConfig(slug)
    // Pre-populate English translation
    translations.value = {
      ...translations.value,
      en: {
        title: def.displayName || def.name,
        description: def.description || '',
        shortDescription: formData.shortDescription || '',
      },
    }
  }
}

const rules: FormRules = {
  title: [{ required: true, message: t('validation.titleRequired'), trigger: 'blur' }],
  slug: [
    { required: true, message: 'Tool slug is required', trigger: 'change' },
  ],
  toolTypeId: [{ required: true, message: 'Tool type is required', trigger: 'change' }],
}

// Create mutation
const createMutation = useMutation({
  mutationFn: async () => {
    const body = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      shortDescription: formData.shortDescription || undefined,
      toolTypeId: formData.toolTypeId!,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      translations: translations.value,
      config: toolConfig.value as Record<string, unknown>,
    }
    const { data, error } = await api.POST('/api/admin/tools', { body })
    if (error) throw new Error(error.error ?? 'Failed to create tool')
    return data
  },
  onSuccess: () => {
    message.success(t('common.createSuccess'))
    router.push({ name: 'tools' })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
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
            <NFormItem label="Tool Definition (Slug)" path="slug">
              <NSelect
                :value="formData.slug || null"
                :options="slugOptions"
                placeholder="Select a tool definition"
                filterable
                @update:value="handleSlugChange"
              />
            </NFormItem>

            <NFormItem :label="t('common.name')" path="title">
              <NInput v-model:value="formData.title" placeholder="Enter tool title" />
            </NFormItem>

            <NFormItem :label="t('common.description')" path="description">
              <NInput
                v-model:value="formData.description"
                type="textarea"
                :rows="3"
                placeholder="Enter description"
              />
            </NFormItem>

            <NFormItem label="Short Description" path="shortDescription">
              <NInput
                v-model:value="formData.shortDescription"
                placeholder="Brief description"
              />
            </NFormItem>

            <NFormItem :label="t('tools.toolType')" path="toolTypeId">
              <NSelect
                v-model:value="formData.toolTypeId"
                :options="toolTypeOptions"
                placeholder="Select tool type"
                filterable
              />
            </NFormItem>

            <div class="grid grid-cols-2 gap-4">
              <NFormItem :label="t('common.active')" path="isActive">
                <NSwitch v-model:value="formData.isActive" />
              </NFormItem>

              <NFormItem label="Featured" path="isFeatured">
                <NSwitch v-model:value="formData.isFeatured" />
              </NFormItem>
            </div>
          </NForm>
        </div>
      </div>

      <ToolConfigForm
        v-model="toolConfig"
        :definition="currentDefinition"
        :providers="providers"
      />

      <TranslationsEditor
        v-model="translations"
        :fields="translationFields"
      />

      <div class="flex justify-end gap-2">
        <NButton @click="router.push({ name: 'tools' })">
          {{ t('common.cancel') }}
        </NButton>
        <NButton
          type="primary"
          :loading="createMutation.isPending.value"
          :disabled="createMutation.isPending.value"
          @click="handleSubmit"
        >
          {{ t('common.create') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
