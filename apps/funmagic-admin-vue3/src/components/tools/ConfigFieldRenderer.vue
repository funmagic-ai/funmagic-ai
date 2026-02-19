<script setup lang="ts">
import type { Field, StringField, NumberField, BooleanField, ArrayField, ObjectField } from '@funmagic/shared/tool-registry'
import { NProgress, NPopover } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useUpload } from '@/composables/useUpload'
import ConfigImageUpload from './ConfigImageUpload.vue'

const { t, te } = useI18n()

const props = defineProps<{
  name: string
  field: Field
  value: unknown
  onChange: (value: unknown) => void
}>()

const fieldLabel = computed(() => {
  const localeKey = `tools.fields.${props.name}`
  if (te(localeKey)) return t(localeKey)
  return props.name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase())
})

/** Locale-aware placeholder: checks tools.placeholders.{name} first, falls back to field definition */
const fieldPlaceholder = computed(() => {
  const localeKey = `tools.placeholders.${props.name}`
  if (te(localeKey)) return t(localeKey)
  return (props.field as StringField).placeholder ?? ''
})

/** Locale-aware description: checks tools.descriptions.{name} first, falls back to field definition */
const fieldDescription = computed(() => {
  const localeKey = `tools.descriptions.${props.name}`
  if (te(localeKey)) return t(localeKey)
  return props.field.description ?? ''
})

/**
 * Detect if an array field is "image-primary":
 * has at least one itemField that is a string with upload: true.
 * Used to render a preset image grid + upload zone layout,
 * with optional extra fields accessible via a settings popover.
 */
const isImagePrimaryArray = computed(() => {
  if (props.field.type !== 'array') return false
  const af = props.field as ArrayField
  const entries = Object.entries(af.itemFields)
  return entries.some(([, fieldDef]) => fieldDef.type === 'string' && (fieldDef as StringField).upload === true)
})

/** The primary image field key for image-primary arrays */
const imageFieldKey = computed(() => {
  if (!isImagePrimaryArray.value) return ''
  const af = props.field as ArrayField
  const entry = Object.entries(af.itemFields).find(
    ([, fieldDef]) => fieldDef.type === 'string' && (fieldDef as StringField).upload === true
  )
  return entry ? entry[0] : ''
})

/** Extra item fields (all itemFields except the primary image field) */
const extraItemFields = computed(() => {
  if (!isImagePrimaryArray.value) return {} as Record<string, Field>
  const af = props.field as ArrayField
  const result: Record<string, Field> = {}
  for (const [key, fieldDef] of Object.entries(af.itemFields)) {
    if (key !== imageFieldKey.value) {
      result[key] = fieldDef
    }
  }
  return result
})

/** Whether there are extra fields beyond the image */
const hasExtraFields = computed(() => Object.keys(extraItemFields.value).length > 0)

/** Total preset slots for image-primary arrays */
const maxSlots = computed(() => (props.field as ArrayField).maxItems ?? 8)

/** Current items in the array */
const arrayItems = computed(() => (props.value as Record<string, unknown>[]) ?? [])

/** Whether all slots are filled */
const isArrayFull = computed(() => arrayItems.value.length >= maxSlots.value)

// --- Image array: per-slot upload ---
const imageArrayUpload = useUpload({ module: 'tool-config', visibility: 'public' })
const slotFileInputRef = ref<HTMLInputElement | null>(null)
const uploadingSlotIdx = ref(-1)

/** Local blob previews for newly uploaded images (index -> blob URL) */
const localPreviews = ref(new Map<number, string>())

/** Which slot's popover is currently open (-1 = none) */
const activePopoverSlot = ref(-1)

onUnmounted(() => {
  for (const url of localPreviews.value.values()) {
    URL.revokeObjectURL(url)
  }
})

function getSlotImageSrc(idx: number): string {
  const localUrl = localPreviews.value.get(idx)
  if (localUrl) return localUrl
  return String(arrayItems.value[idx]?.[imageFieldKey.value] ?? '')
}

function hasSlotImage(idx: number): boolean {
  return idx < arrayItems.value.length && !!getSlotImageSrc(idx)
}

/** Click an empty slot to trigger its file input */
function triggerSlotUpload() {
  slotFileInputRef.value?.click()
}

/** Handle file selection from the hidden input */
async function handleSlotFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // reset so same file can be re-selected
  if (!file || isArrayFull.value) return

  const targetIdx = arrayItems.value.length
  uploadingSlotIdx.value = targetIdx

  const blobUrl = URL.createObjectURL(file)

  imageArrayUpload.setFile(file)
  const result = await imageArrayUpload.uploadOnSubmit()
  uploadingSlotIdx.value = -1

  if (!result) {
    URL.revokeObjectURL(blobUrl)
    return
  }

  localPreviews.value.set(targetIdx, blobUrl)
  const items = [...arrayItems.value]
  items.push({ [imageFieldKey.value]: result.storageKey })
  props.onChange(items)
}

function removeSlotImage(idx: number) {
  // Close popover if open for this slot
  if (activePopoverSlot.value === idx) activePopoverSlot.value = -1

  // Clean up local blob preview
  const localUrl = localPreviews.value.get(idx)
  if (localUrl) {
    URL.revokeObjectURL(localUrl)
    localPreviews.value.delete(idx)
  }

  // Reindex local previews: shift indices above removed slot down by 1
  const updated = new Map<number, string>()
  for (const [key, val] of localPreviews.value) {
    if (key < idx) updated.set(key, val)
    else if (key > idx) updated.set(key - 1, val)
  }
  localPreviews.value = updated

  const items = [...arrayItems.value]
  items.splice(idx, 1)
  props.onChange(items)
}

/** Toggle the settings popover for a slot */
function togglePopover(idx: number) {
  activePopoverSlot.value = activePopoverSlot.value === idx ? -1 : idx
}

/** Close the popover */
function closePopover() {
  activePopoverSlot.value = -1
}

/** Update an extra field value on a specific slot */
function updateSlotExtraField(idx: number, fieldName: string, fieldValue: unknown) {
  const items = [...arrayItems.value]
  items[idx] = { ...items[idx], [fieldName]: fieldValue }
  props.onChange(items)
}

/** Check if a slot has any non-default extra field values */
function hasNonDefaultExtraValues(idx: number): boolean {
  const item = arrayItems.value[idx]
  if (!item) return false
  for (const [key, fieldDef] of Object.entries(extraItemFields.value)) {
    const val = item[key]
    const defaultVal = 'default' in fieldDef ? fieldDef.default : undefined
    // For strings: non-empty and different from default
    if (fieldDef.type === 'string' && val && val !== '' && val !== defaultVal) return true
    // For booleans: different from default (default is true for useStyleImage)
    if (fieldDef.type === 'boolean' && val !== undefined && val !== defaultVal) return true
  }
  return false
}
</script>

<template>
  <!-- String field -->
  <template v-if="field.type === 'string'">
    <!-- String with options => NSelect -->
    <n-form-item v-if="(field as StringField).options?.length" :label="fieldLabel">
      <n-select
        :value="(value as string) ?? (field as StringField).default ?? ''"
        :options="(field as StringField).options!.map(o => ({ label: o, value: o }))"
        @update:value="onChange"
      />
      <template v-if="fieldDescription" #feedback>
        <span class="text-xs text-muted-foreground">{{ fieldDescription }}</span>
      </template>
    </n-form-item>

    <!-- String with upload => image upload zone -->
    <n-form-item v-else-if="(field as StringField).upload" :label="fieldLabel">
      <ConfigImageUpload
        :value="(value as string) ?? ''"
        :on-change="onChange"
        :placeholder="fieldPlaceholder"
      />
      <template v-if="fieldDescription" #feedback>
        <span class="text-xs text-muted-foreground">{{ fieldDescription }}</span>
      </template>
    </n-form-item>

    <!-- Default string => NInput textarea -->
    <n-form-item v-else :label="fieldLabel">
      <n-input
        type="textarea"
        :value="(value as string) ?? (field as StringField).default ?? ''"
        @update:value="onChange"
        :placeholder="fieldPlaceholder"
        :rows="3"
      />
      <template v-if="fieldDescription" #feedback>
        <span class="text-xs text-muted-foreground">{{ fieldDescription }}</span>
      </template>
    </n-form-item>
  </template>

  <!-- Number field -->
  <n-form-item v-else-if="field.type === 'number'" :label="fieldLabel">
    <n-input-number
      :value="(value as number | undefined) ?? (field as NumberField).default"
      @update:value="onChange"
      :min="(field as NumberField).min"
      :max="(field as NumberField).max"
      class="w-full"
    />
    <template v-if="fieldDescription" #feedback>
      <span class="text-xs text-muted-foreground">{{ fieldDescription }}</span>
    </template>
  </n-form-item>

  <!-- Boolean field -->
  <n-form-item v-else-if="field.type === 'boolean'" :label="fieldLabel">
    <n-switch
      :value="(value as boolean | undefined) ?? (field as BooleanField).default ?? false"
      @update:value="onChange"
    />
    <template v-if="fieldDescription" #feedback>
      <span class="text-xs text-muted-foreground">{{ fieldDescription }}</span>
    </template>
  </n-form-item>

  <!-- Array field: image-primary — preset slots as upload zones with optional settings popover -->
  <template v-else-if="field.type === 'array' && isImagePrimaryArray">
    <n-form-item :label="fieldLabel">
      <div class="w-full space-y-3">
        <div v-if="fieldDescription" class="text-xs text-muted-foreground">{{ fieldDescription }}</div>

        <!-- Hidden file input shared by all empty slots -->
        <input
          ref="slotFileInputRef"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleSlotFileSelect"
        />

        <!-- Fixed preset grid -->
        <div class="grid grid-cols-4 gap-3">
          <div
            v-for="slotIdx in maxSlots"
            :key="slotIdx"
            class="aspect-square rounded-lg overflow-hidden"
            :class="hasSlotImage(slotIdx - 1)
              ? 'border border-border'
              : 'border-2 border-dashed border-muted-foreground/20'"
          >
            <!-- Filled slot -->
            <div v-if="hasSlotImage(slotIdx - 1)" class="relative w-full h-full group">
              <img
                :src="getSlotImageSrc(slotIdx - 1)"
                :alt="`Style ${slotIdx}`"
                class="w-full h-full object-cover"
              />

              <!-- Settings gear icon (top-left, hover-visible) -->
              <NPopover
                v-if="hasExtraFields"
                :show="activePopoverSlot === slotIdx - 1"
                trigger="manual"
                placement="bottom"
                :width="280"
                @clickoutside="closePopover"
              >
                <template #trigger>
                  <button
                    type="button"
                    class="absolute top-1 left-1 h-6 w-6 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/80"
                    @click.stop="togglePopover(slotIdx - 1)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </template>
                <div class="space-y-2">
                  <div class="text-sm font-medium mb-2">{{ t('tools.styleSettings') }}</div>
                  <ConfigFieldRenderer
                    v-for="(extraField, extraFieldName) in extraItemFields"
                    :key="extraFieldName"
                    :name="String(extraFieldName)"
                    :field="extraField"
                    :value="arrayItems[slotIdx - 1]?.[extraFieldName as string]"
                    :on-change="(v: unknown) => updateSlotExtraField(slotIdx - 1, String(extraFieldName), v)"
                  />
                </div>
              </NPopover>

              <!-- Blue dot indicator for customized extra values (always visible) -->
              <span
                v-if="hasExtraFields && hasNonDefaultExtraValues(slotIdx - 1)"
                class="absolute top-1 left-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white group-hover:opacity-0 transition-opacity pointer-events-none"
              />

              <!-- Delete button (top-right, hover-visible) -->
              <button
                type="button"
                class="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                @click="removeSlotImage(slotIdx - 1)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
              <span class="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono backdrop-blur">
                {{ slotIdx }}
              </span>
            </div>

            <!-- Uploading slot -->
            <div v-else-if="uploadingSlotIdx === slotIdx - 1" class="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/30">
              <n-spin size="small" />
              <NProgress
                v-if="imageArrayUpload.progress.value > 0"
                type="line"
                :percentage="imageArrayUpload.progress.value"
                :show-indicator="false"
                class="w-3/4"
              />
            </div>

            <!-- Empty slot (clickable upload zone) -->
            <div
              v-else
              class="w-full h-full flex flex-col items-center justify-center gap-1 bg-muted/30 cursor-pointer transition-colors hover:bg-muted/50 hover:border-primary/50"
              @click="triggerSlotUpload"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted-foreground/40"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              <span class="text-[10px] text-muted-foreground/40">{{ slotIdx }}</span>
            </div>
          </div>
        </div>

        <!-- Count + min items warning -->
        <div class="flex items-center justify-between">
          <div class="text-xs text-muted-foreground">{{ arrayItems.length }}/{{ maxSlots }}</div>
          <div v-if="(field as ArrayField).minItems && arrayItems.length < ((field as ArrayField).minItems ?? 0)" class="text-xs text-red-500">
            {{ t('validation.arrayMinItemsHint', { min: (field as ArrayField).minItems }) }}
          </div>
        </div>
      </div>
    </n-form-item>
  </template>

  <!-- Array field: generic stacked layout -->
  <template v-else-if="field.type === 'array'">
    <n-form-item :label="fieldLabel">
      <div class="w-full space-y-2">
        <div v-if="fieldDescription" class="text-xs text-muted-foreground mb-2">{{ fieldDescription }}</div>
        <div
          v-for="(item, idx) in ((value as Record<string, unknown>[]) ?? [])"
          :key="idx"
          class="rounded border p-3 space-y-2 relative"
        >
          <n-button
            size="tiny"
            type="error"
            quaternary
            class="absolute right-1 top-1"
            :disabled="(field as ArrayField).minItems !== undefined && ((value as unknown[])?.length ?? 0) <= ((field as ArrayField).minItems ?? 0)"
            @click="() => {
              const arr = [...((value as Record<string, unknown>[]) ?? [])];
              arr.splice(idx, 1);
              onChange(arr);
            }"
          >
            {{ t('common.remove') }}
          </n-button>
          <ConfigFieldRenderer
            v-for="(itemField, itemFieldName) in (field as ArrayField).itemFields"
            :key="itemFieldName"
            :name="String(itemFieldName)"
            :field="itemField"
            :value="item[itemFieldName as string]"
            :on-change="(v: unknown) => {
              const arr = [...((value as Record<string, unknown>[]) ?? [])];
              arr[idx] = { ...arr[idx], [itemFieldName]: v };
              onChange(arr);
            }"
          />
        </div>
        <div v-if="(field as ArrayField).minItems && ((value as unknown[])?.length ?? 0) < ((field as ArrayField).minItems ?? 0)" class="text-xs text-red-500">
          {{ t('validation.arrayMinItemsHint', { min: (field as ArrayField).minItems }) }}
        </div>
        <n-button
          size="small"
          dashed
          class="w-full"
          :disabled="(field as ArrayField).maxItems !== undefined && ((value as unknown[])?.length ?? 0) >= ((field as ArrayField).maxItems ?? Infinity)"
          @click="() => {
            const arr = [...((value as Record<string, unknown>[]) ?? [])];
            const newItem: Record<string, unknown> = {};
            for (const [fn, fd] of Object.entries((field as ArrayField).itemFields)) {
              if ('default' in fd) newItem[fn] = fd.default;
              else if (fd.type === 'string') newItem[fn] = '';
              else if (fd.type === 'number') newItem[fn] = 0;
              else if (fd.type === 'boolean') newItem[fn] = false;
              else if (fd.type === 'array') newItem[fn] = [];
              else newItem[fn] = {};
            }
            arr.push(newItem);
            onChange(arr);
          }"
        >
          + {{ t('common.add') }}
          <template v-if="(field as ArrayField).maxItems">
            ({{ ((value as unknown[])?.length ?? 0) }}/{{ (field as ArrayField).maxItems }})
          </template>
        </n-button>
      </div>
    </n-form-item>
  </template>

  <!-- Object field -->
  <template v-else-if="field.type === 'object'">
    <div class="rounded border p-3 space-y-2">
      <div class="text-sm font-medium">{{ fieldLabel }}</div>
      <ConfigFieldRenderer
        v-for="(propField, propName) in (field as ObjectField).properties"
        :key="propName"
        :name="String(propName)"
        :field="propField"
        :value="((value as Record<string, unknown>) ?? {})[propName as string]"
        :on-change="(v: unknown) => {
          onChange({ ...((value as Record<string, unknown>) ?? {}), [propName]: v });
        }"
      />
    </div>
  </template>

  <!-- Unknown -->
  <div v-else class="text-sm text-muted-foreground">
    Unknown field type for {{ name }}
  </div>
</template>
