<script setup lang="ts">
import ImageUploadZone from '@/components/shared/ImageUploadZone.vue'
import { useUpload } from '@/composables/useUpload'

const props = defineProps<{
  value: string
  onChange: (value: unknown) => void
  placeholder?: string
}>()

const upload = useUpload({ module: 'tool-config', visibility: 'public' })
const urlValue = ref(props.value ?? '')

watch(() => props.value, (v) => {
  urlValue.value = v ?? ''
})

async function handleFileSelect(file: File | null) {
  if (!file) {
    upload.reset()
    urlValue.value = ''
    props.onChange('')
    return
  }

  upload.setFile(file)

  // Upload immediately for config fields
  const result = await upload.uploadOnSubmit()
  if (result) {
    urlValue.value = result.storageKey
    props.onChange(result.storageKey)
    upload.reset()
  }
}

function handleUrlUpdate(value: string) {
  urlValue.value = value
  props.onChange(value)
}
</script>

<template>
  <ImageUploadZone
    :model-value="urlValue"
    :file-preview="upload.preview.value"
    :uploading="upload.isUploading.value"
    :progress="upload.progress.value"
    @file-select="handleFileSelect"
    @update:model-value="handleUrlUpdate"
  />
</template>
