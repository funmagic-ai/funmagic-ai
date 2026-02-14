<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NInputNumber, NIcon, NSwitch, NSelect, NSpin } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import { validateForm } from '@/composables/useFormValidation'
import PageHeader from '@/components/shared/PageHeader.vue'
import ImageUploadZone from '@/components/shared/ImageUploadZone.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'
import { useUpload } from '@/composables/useUpload'
import { SUPPORTED_LOCALES } from '@funmagic/shared/config/locales'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const id = computed(() => route.params.id as string)

const upload = useUpload({ module: 'banners', visibility: 'public' })

const formRef = ref<FormInst | null>(null)
const formValue = ref({
  title: '',
  description: '',
  type: 'main' as 'main' | 'side',
  thumbnail: '',
  link: '',
  linkText: t('banners.defaultLinkText'),
  linkTarget: '_self' as '_self' | '_blank',
  position: 0,
  badge: '',
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

const rules: FormRules = {
  title: [{ required: true, message: t('validation.titleRequired'), trigger: 'blur' }],
}

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

const { isLoading, isError, error } = useQuery({
  queryKey: ['banners', id],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/banners/{id}', {
      params: { path: { id: id.value } },
    })
    if (error) throw new Error(error.error ?? 'Failed to fetch banner')
    return data
  },
  select: (data) => {
    const b = data.banner
    formValue.value = {
      title: b.title,
      description: b.description ?? '',
      type: (b.type as 'main' | 'side') || 'main',
      thumbnail: b.thumbnail,
      link: b.link ?? '',
      linkText: b.linkText || t('banners.defaultLinkText'),
      linkTarget: (b.linkTarget as '_self' | '_blank') || '_self',
      position: b.position ?? 0,
      badge: b.badge ?? '',
      badgeColor: b.badgeColor ?? '',
      isActive: b.isActive,
    }
    if (b.translations) {
      translations.value = b.translations as Record<string, Record<string, string>>
    }
    return b
  },
})

const updateMutation = useMutation({
  mutationFn: async () => {
    let thumbnailValue = formValue.value.thumbnail

    // Upload image if a file was selected
    if (upload.pendingFile.value) {
      const result = await upload.uploadOnSubmit()
      if (!result) throw new Error(upload.error.value ?? 'Upload failed')
      thumbnailValue = result.storageKey
    }

    const { data, error } = await api.PUT('/api/admin/banners/{id}', {
      params: { path: { id: id.value } },
      body: {
        title: formValue.value.title,
        description: formValue.value.description || undefined,
        type: formValue.value.type,
        thumbnail: thumbnailValue,
        link: formValue.value.link || undefined,
        linkText: formValue.value.linkText,
        linkTarget: formValue.value.linkTarget,
        position: formValue.value.position,
        badge: formValue.value.badge || undefined,
        badgeColor: formValue.value.badgeColor || undefined,
        isActive: formValue.value.isActive,
        translations: translations.value as any,
      },
    })
    if (error) throw new Error(error.error ?? 'Failed to update banner')
    return data
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['banners'] })
    message.success(t('common.updateSuccess'))
    router.push({ name: 'banners' })
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
    <PageHeader :title="t('content.editBanner')">
      <template #actions>
        <NButton @click="router.push({ name: 'banners' })">
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
            <NFormItem :label="t('common.active')">
              <NSwitch v-model:value="formValue.isActive" />
            </NFormItem>

            <NFormItem :label="t('common.title')" path="title">
              <NInput v-model:value="formValue.title" :placeholder="t('placeholder.bannerTitle')" />
            </NFormItem>

            <NFormItem :label="t('common.description')">
              <NInput
                v-model:value="formValue.description"
                type="textarea"
                :rows="3"
                :placeholder="t('placeholder.optionalDescription')"
              />
            </NFormItem>

            <NFormItem :label="t('content.bannerType')">
              <NSelect v-model:value="formValue.type" :options="typeOptions" />
            </NFormItem>

            <NFormItem :label="t('content.linkUrl')">
              <NInput v-model:value="formValue.link" placeholder="https://example.com" />
            </NFormItem>

            <NFormItem :label="t('common.linkText')">
              <NInput v-model:value="formValue.linkText" :placeholder="t('placeholder.linkText')" />
            </NFormItem>

            <NFormItem :label="t('common.linkTarget')">
              <NSelect v-model:value="formValue.linkTarget" :options="targetOptions" />
            </NFormItem>

            <NFormItem :label="t('common.position')">
              <NInputNumber v-model:value="formValue.position" :min="0" class="w-full" />
            </NFormItem>

            <NFormItem :label="t('common.badge')">
              <NInput v-model:value="formValue.badge" :placeholder="t('placeholder.exampleBadge')" />
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
          :loading="updateMutation.isPending.value || upload.isUploading.value"
          @click="handleSubmit"
        >
          {{ t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
