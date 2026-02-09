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
import PageHeader from '@/components/shared/PageHeader.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'
import ToolConfigForm from '@/components/tools/ToolConfigForm.vue'
import { getToolDefinition } from '@funmagic/shared/tool-registry'
import type { SavedToolConfig } from '@funmagic/shared/tool-registry'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const toolId = computed(() => route.params.id as string)
const formRef = ref<FormInst | null>(null)

// Fetch tool detail
const {
  data: toolData,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: computed(() => ['admin', 'tools', toolId.value]),
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tools/{id}', {
      params: { path: { id: toolId.value } },
    })
    if (error) throw new Error(error.error ?? 'Failed to fetch tool')
    return data
  },
  enabled: computed(() => !!toolId.value),
})

// Fetch tool types for the select
const { data: toolTypesData } = useQuery({
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

// Form model
const formData = reactive({
  title: '',
  slug: '',
  description: '',
  shortDescription: '',
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

const translationFields = [
  { key: 'title', label: t('common.title') },
  { key: 'description', label: t('common.description'), type: 'textarea' as const },
  { key: 'shortDescription', label: 'Short Description' },
]

// Populate form when data arrives
watch(
  () => toolData.value,
  (tool) => {
    if (tool?.tool) {
      formData.title = tool.tool.title
      formData.slug = tool.tool.slug
      formData.description = tool.tool.description ?? ''
      formData.shortDescription = tool.tool.shortDescription ?? ''
      formData.toolTypeId = tool.tool.toolTypeId
      formData.isActive = tool.tool.isActive
      formData.isFeatured = tool.tool.isFeatured
      if (tool.tool.translations) {
        translations.value = tool.tool.translations as Record<string, Record<string, string>>
      }
      const cfg = tool.tool.config as SavedToolConfig | undefined
      toolConfig.value = { steps: [], ...cfg }
    }
  },
  { immediate: true },
)

const rules: FormRules = {
  title: [{ required: true, message: t('validation.titleRequired'), trigger: 'blur' }],
  slug: [
    { required: true, message: 'Slug is required', trigger: 'blur' },
    {
      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      message: 'Slug must be lowercase with hyphens only',
      trigger: 'blur',
    },
  ],
  toolTypeId: [{ required: true, message: 'Tool type is required', trigger: 'change' }],
}

// Update mutation
const updateMutation = useMutation({
  mutationFn: async () => {
    const body = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      shortDescription: formData.shortDescription || undefined,
      toolTypeId: formData.toolTypeId ?? undefined,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      translations: translations.value,
      config: toolConfig.value,
    }
    const { data, error } = await api.PUT('/api/admin/tools/{id}', {
      params: { path: { id: toolId.value } },
      body,
    })
    if (error) throw new Error(error.error ?? 'Failed to update tool')
    return data
  },
  onSuccess: () => {
    message.success(t('common.updateSuccess'))
    queryClient.invalidateQueries({ queryKey: ['admin', 'tools'] })
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
      <NEmpty description="Tool not found or failed to load">
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
            <NFormItem :label="t('common.name')" path="title">
              <NInput v-model:value="formData.title" placeholder="Enter tool title" />
            </NFormItem>

            <NFormItem :label="t('tools.slug')" path="slug">
              <NInput v-model:value="formData.slug" placeholder="tool-slug" disabled />
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

              <NFormItem :label="t('common.featured')" path="isFeatured">
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
          :loading="updateMutation.isPending.value"
          :disabled="updateMutation.isPending.value"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
