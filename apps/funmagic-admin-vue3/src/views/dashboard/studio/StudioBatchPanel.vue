<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { CloseOutline, CloudUploadOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  close: []
}>()

const MAX_IMAGES = 8

const batchImages = ref<Array<{ file: File; preview: string }>>([])
const isDragging = ref(false)

function addFiles(files: FileList | File[]) {
  const remaining = MAX_IMAGES - batchImages.value.length
  const toAdd = Array.from(files).slice(0, remaining)

  for (const file of toAdd) {
    if (!file.type.startsWith('image/')) continue
    // Skip duplicates by name + size
    const isDuplicate = batchImages.value.some(
      img => img.file.name === file.name && img.file.size === file.size,
    )
    if (isDuplicate) continue
    batchImages.value.push({
      file,
      preview: URL.createObjectURL(file),
    })
  }
}

function removeImage(index: number) {
  const img = batchImages.value[index]
  if (img.preview) URL.revokeObjectURL(img.preview)
  batchImages.value.splice(index, 1)
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    addFiles(e.dataTransfer.files)
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

const fileInputRef = ref<HTMLInputElement | null>(null)

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    addFiles(input.files)
  }
  input.value = ''
}

onUnmounted(() => {
  batchImages.value.forEach(img => URL.revokeObjectURL(img.preview))
})

defineExpose({
  batchImages,
  clear: () => {
    batchImages.value.forEach(img => URL.revokeObjectURL(img.preview))
    batchImages.value = []
  },
})
</script>

<template>
  <div class="mb-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
    <div class="mb-2 flex items-center justify-between">
      <span class="text-xs font-medium text-muted-foreground">
        {{ t('studio.batchMode') }} ({{ batchImages.length }}/{{ MAX_IMAGES }})
      </span>
      <NButton size="tiny" quaternary @click="emit('close')">
        <template #icon>
          <NIcon :size="14"><CloseOutline /></NIcon>
        </template>
      </NButton>
    </div>

    <!-- Drop zone + thumbnails -->
    <div
      class="flex flex-wrap items-center gap-2"
      @drop.prevent="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <!-- Existing thumbnails -->
      <div
        v-for="(img, idx) in batchImages"
        :key="idx"
        class="group relative h-16 w-16"
      >
        <div class="h-full w-full overflow-hidden rounded-md border border-border">
          <img :src="img.preview" class="h-full w-full object-cover" alt="" />
        </div>
        <button
          class="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100"
          @click="removeImage(idx)"
        >
          <NIcon :size="14"><CloseOutline /></NIcon>
        </button>
      </div>

      <!-- Add more button -->
      <div
        v-if="batchImages.length < MAX_IMAGES"
        class="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed transition-colors"
        :class="isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'"
        @click="fileInputRef?.click()"
      >
        <NIcon :size="20" class="text-muted-foreground">
          <CloudUploadOutline />
        </NIcon>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="handleFileSelect"
      />
    </div>
  </div>
</template>
