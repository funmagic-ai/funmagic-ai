<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  preview?: string | null
  disabled?: boolean
  maxSize?: number
  accept?: string
}>(), {
  maxSize: 20 * 1024 * 1024,
  accept: 'image/*',
})

const emit = defineEmits<{
  'file-select': [file: File | null]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const error = ref<string | null>(null)

function validateFile(file: File): boolean {
  error.value = null
  if (!file.type.startsWith('image/')) {
    error.value = t('tools.upload.invalidType')
    return false
  }
  if (file.size > props.maxSize) {
    error.value = t('tools.upload.sizeExceeded', { size: Math.round(props.maxSize / 1024 / 1024) })
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
  if (fileInputRef.value) fileInputRef.value.value = ''
  error.value = null
}
</script>

<template>
  <div class="w-full">
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      class="hidden"
      :disabled="disabled"
      @change="handleFileSelect"
    />

    <!-- Preview -->
    <div v-if="preview" class="relative rounded-xl overflow-hidden border bg-muted">
      <img
        :src="preview"
        :alt="t('tools.preview')"
        class="w-full max-h-80 object-contain"
      />
      <button
        type="button"
        class="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center hover:bg-red-500 transition-colors"
        @click="clearFile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <!-- Drop Zone -->
    <div
      v-else
      class="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer"
      :class="[
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
      @click="triggerInput"
      @drop.prevent="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted-foreground"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      </div>
      <div class="text-center">
        <p class="text-sm font-medium">
          {{ t('tools.upload.dropHint') }} <span class="text-primary">{{ t('tools.upload.browse') }}</span>
        </p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ t('tools.upload.formats', { size: Math.round(maxSize / 1024 / 1024) }) }}
        </p>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-sm text-red-500 mt-2">{{ error }}</p>
  </div>
</template>
