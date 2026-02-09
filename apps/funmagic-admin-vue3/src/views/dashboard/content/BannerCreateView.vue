<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, NInputNumber, NIcon, NSwitch, NSelect, NImage, NProgress } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useMutation } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { api } from '@/lib/api'
import PageHeader from '@/components/shared/PageHeader.vue'
import TranslationsEditor from '@/components/translations/TranslationsEditor.vue'
import { useUpload } from '@/composables/useUpload'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()

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

const translations = ref<Record<string, Record<string, string>>>({})

const translationFields = [
  { key: 'title', label: t('common.title') },
  { key: 'description', label: t('common.description'), type: 'textarea' as const },
  { key: 'linkText', label: t('common.linkText') },
  { key: 'badge', label: 'Badge' },
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

const fileInputRef = ref<HTMLInputElement | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    upload.setFile(input.files[0])
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function clearFile() {
  upload.reset()
  if (fileInputRef.value) fileInputRef.value.value = ''
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

    const { data, error } = await api.POST('/api/admin/banners', {
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
    if (error) throw new Error(error.error ?? 'Failed to create banner')
    return data
  },
  onSuccess: () => {
    message.success(t('common.createSuccess'))
    router.push({ name: 'banners' })
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
            <NFormItem :label="t('common.title')" path="title">
              <NInput v-model:value="formValue.title" placeholder="Banner title" />
            </NFormItem>

            <NFormItem :label="t('common.description')">
              <NInput
                v-model:value="formValue.description"
                type="textarea"
                :rows="3"
                placeholder="Optional description"
              />
            </NFormItem>

            <NFormItem :label="t('content.bannerType')">
              <NSelect v-model:value="formValue.type" :options="typeOptions" />
            </NFormItem>

            <NFormItem label="Banner Image">
              <div class="w-full space-y-3">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileSelect"
                />
                <div v-if="upload.preview.value" class="relative">
                  <NImage
                    :src="upload.preview.value"
                    :width="300"
                    object-fit="cover"
                    class="rounded-lg border"
                  />
                  <NButton size="tiny" class="mt-2" @click="clearFile">
                    Remove
                  </NButton>
                </div>
                <div v-else-if="formValue.thumbnail" class="relative">
                  <NImage
                    :src="formValue.thumbnail"
                    :width="300"
                    object-fit="cover"
                    class="rounded-lg border"
                  />
                </div>
                <div class="flex gap-2">
                  <NButton @click="triggerFileInput">
                    Upload Image
                  </NButton>
                </div>
                <NProgress
                  v-if="upload.isUploading.value"
                  type="line"
                  :percentage="upload.progress.value"
                  :show-indicator="true"
                />
                <NInput
                  v-model:value="formValue.thumbnail"
                  placeholder="Or enter image URL directly"
                  size="small"
                />
              </div>
            </NFormItem>

            <NFormItem :label="t('content.linkUrl')">
              <NInput v-model:value="formValue.link" placeholder="https://example.com" />
            </NFormItem>

            <NFormItem :label="t('common.linkText')">
              <NInput v-model:value="formValue.linkText" placeholder="Learn More" />
            </NFormItem>

            <NFormItem :label="t('common.linkTarget')">
              <NSelect v-model:value="formValue.linkTarget" :options="targetOptions" />
            </NFormItem>

            <NFormItem label="Position">
              <NInputNumber v-model:value="formValue.position" :min="0" class="w-full" />
            </NFormItem>

            <NFormItem label="Badge">
              <NInput v-model:value="formValue.badge" placeholder="e.g. New, Hot" />
            </NFormItem>

            <NFormItem label="Badge Color">
              <NInput v-model:value="formValue.badgeColor" placeholder="e.g. #ff0000" />
            </NFormItem>

            <NFormItem label="Active">
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
          :loading="createMutation.isPending.value || upload.isUploading.value"
          @click="handleSubmit"
        >
          {{ t('common.create') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
