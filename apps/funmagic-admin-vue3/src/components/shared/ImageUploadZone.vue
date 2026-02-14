<script setup lang="ts">
import { NImage, NProgress } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const props = withDefaults(defineProps<{
  /** Local file preview URL (from useUpload) */
  filePreview?: string | null
  /** Remote/existing image URL (v-model) */
  modelValue?: string
  /** Upload in progress */
  uploading?: boolean
  /** Upload progress percentage */
  progress?: number
  disabled?: boolean
  maxSize?: number
  accept?: string
  label?: string
  /** Expected aspect ratio, e.g. "16/9". Shown as a hint and used for preview. */
  aspectRatio?: string
}>(), {
  maxSize: 10 * 1024 * 1024,
  accept: 'image/*',
  label: 'Thumbnail',
})

const ratioLabel = computed(() => {
  if (!props.aspectRatio) return null
  return props.aspectRatio.replace('/', ':')
})

const emit = defineEmits<{
  'file-select': [file: File | null]
  'update:modelValue': [value: string]
}>()

const { t } = useI18n()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const error = ref<string | null>(null)

const hasPreview = computed(() => !!props.filePreview || !!props.modelValue)
const previewSrc = computed(() => props.filePreview || props.modelValue || '')

function validateFile(file: File): boolean {
  error.value = null
  if (!file.type.startsWith('image/')) {
    error.value = t('upload.invalidFileType')
    return false
  }
  if (file.size > props.maxSize) {
    error.value = t('upload.fileTooLarge', { size: Math.round(props.maxSize / 1024 / 1024) })
    return false
  }
  return true
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (validateFile(file)) {
      emit('file-select', file)
    }
  }
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  if (props.disabled) return
  const file = event.dataTransfer?.files?.[0]
  if (file && validateFile(file)) {
    emit('file-select', file)
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  if (!props.disabled) isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function triggerInput() {
  if (!props.disabled) fileInputRef.value?.click()
}

function clearFile() {
  emit('file-select', null)
  emit('update:modelValue', '')
  if (fileInputRef.value) fileInputRef.value.value = ''
  error.value = null
}
</script>

<template>
  <div class="w-full space-y-3">
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      class="hidden"
      :disabled="disabled"
      @change="handleFileSelect"
    />

    <!-- Preview -->
    <div v-if="hasPreview">
      <div
        class="relative mx-auto w-1/2 rounded-xl overflow-hidden border bg-muted"
        :style="aspectRatio ? { aspectRatio } : undefined"
      >
      <img
        :src="previewSrc"
        class="w-full h-full object-cover rounded-xl"
      />
      <button
        type="button"
        class="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center hover:bg-red-500 transition-colors"
        @click="clearFile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      <span v-if="ratioLabel" class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono backdrop-blur">
        {{ ratioLabel }}
      </span>
      </div>
    </div>

    <!-- Drop Zone -->
    <div
      v-else
      class="mx-auto flex w-1/2 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer"
      :class="[
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      :style="aspectRatio ? { aspectRatio } : undefined"
      @click="triggerInput"
      @drop.prevent="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      </div>
      <div class="text-center">
        <p class="text-sm font-medium">
          {{ t('upload.dropOrBrowse') }} <span class="text-primary">{{ t('upload.browse') }}</span>
        </p>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ t('upload.sizeLimit', { size: Math.round(maxSize / 1024 / 1024) }) }}
          <template v-if="ratioLabel"> &middot; {{ ratioLabel }}</template>
        </p>
      </div>
    </div>

    <!-- Progress -->
    <NProgress
      v-if="uploading"
      type="line"
      :percentage="progress ?? 0"
      :show-indicator="true"
    />

    <!-- Error -->
    <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
  </div>
</template>
