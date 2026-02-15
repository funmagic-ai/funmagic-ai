<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NInputNumber, NIcon, NSwitch, NSelect } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useMutation } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { validateForm } from '@/composables/useFormValidation'
import { useApiError } from '@/composables/useApiError'
import PageHeader from '@/components/shared/PageHeader.vue'
import ImageUploadZone from '@/components/shared/ImageUploadZone.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'
import { useUpload } from '@/composables/useUpload'
import { SUPPORTED_LOCALES } from '@funmagic/shared/config/locales'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const { handleError } = useApiError()

const upload = useUpload({ module: 'banners', visibility: 'public' })

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  type: 'main' as 'main' | 'side',
  thumbnail: '',
  link: '',
  linkTarget: '_self' as '_self' | '_blank',
  position: 0,
  badgeColor: '',
  isActive: true,
})

const translations = ref<Record<string, Record<string, string>>>(
  Object.fromEntries(SUPPORTED_LOCALES.map(locale => [locale, { title: '', description: '', linkText: '', badge: '' }]))
)
const translationsRef = ref<{ validate: () => string | null } | null>(null)

const translationFields = [
  { key: 'title', label: t('common.title'), required: true },
  { key: 'description', label: t('common.description'), type: 'textarea' as const },
  { key: 'linkText', label: t('common.linkText') },
  { key: 'badge', label: t('common.badge') },
]

const rules = {}

const typeOptions = [
  { label: t('banners.typeMain'), value: 'main' },
  { label: t('banners.typeSide'), value: 'side' },
]

const targetOptions = [
  { label: t('banners.targetSelf'), value: '_self' },
  { label: t('banners.targetBlank'), value: '_blank' },
]

function handleFileSelect(file: File | null) {
  if (file) {
    upload.setFile(file)
  } else {
    upload.reset()
    formValue.value.thumbnail = ''
  }
}

const createMutation = useMutation({
  mutationFn: async () => {
    let thumbnailValue = formValue.value.thumbnail

    // Upload image if a file was selected
    if (upload.pendingFile.value) {
      const result = await upload.uploadOnSubmit()
      if (!result) throw new Error(upload.error.value ?? 'Upload failed')
      thumbnailValue = result.storageKey
    }

    // Populate legacy fields from English translations
    const en = translations.value.en || {}

    const { data, error, response } = await api.POST('/api/admin/banners', {
      body: {
        title: en.title || 'Untitled',
        description: en.description || undefined,
        type: formValue.value.type,
        thumbnail: thumbnailValue,
        link: formValue.value.link || undefined,
        linkText: en.linkText || t('banners.defaultLinkText'),
        linkTarget: formValue.value.linkTarget,
        position: formValue.value.position,
        badge: en.badge || undefined,
        badgeColor: formValue.value.badgeColor || undefined,
        isActive: formValue.value.isActive,
        translations: translations.value as any,
      },
    })
    if (error) throw extractApiError(error, response)
    return data
  },
  onSuccess: () => {
    message.success(t('common.createSuccess'))
    router.push({ name: 'banners' })
  },
  onError: handleError,
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
    <PageHeader :title="t('content.createBanner')">
      <template #actions>
        <NButton @click="router.push({ name: 'banners' })">
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
            <NFormItem :label="t('common.active')">
              <NSwitch v-model:value="formValue.isActive" />
            </NFormItem>

            <NFormItem :label="t('content.bannerType')">
              <NSelect v-model:value="formValue.type" :options="typeOptions" />
            </NFormItem>

            <NFormItem :label="t('content.linkUrl')">
              <NInput v-model:value="formValue.link" placeholder="/tools/figme or https://example.com" />
            </NFormItem>

            <NFormItem :label="t('common.linkTarget')">
              <NSelect v-model:value="formValue.linkTarget" :options="targetOptions" />
            </NFormItem>

            <NFormItem :label="t('common.position')">
              <NInputNumber v-model:value="formValue.position" :min="0" class="w-full" />
            </NFormItem>

            <NFormItem :label="t('common.badgeColor')">
              <NInput v-model:value="formValue.badgeColor" :placeholder="t('placeholder.exampleColor')" />
            </NFormItem>
          </NForm>
        </div>
      </div>

      <div class="rounded-xl border bg-card p-6 shadow-sm">
        <h3 class="mb-4 text-base font-medium">{{ t('common.bannerImage') }}</h3>
        <ImageUploadZone
          v-model="formValue.thumbnail"
          :file-preview="upload.preview.value"
          :uploading="upload.isUploading.value"
          :progress="upload.progress.value"
          aspect-ratio="21/9"
          @file-select="handleFileSelect"
        />
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
          :loading="createMutation.isPending.value || upload.isUploading.value"
          @click="handleSubmit"
        >
          {{ t('common.create') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
