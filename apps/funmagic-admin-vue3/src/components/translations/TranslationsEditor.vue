<script setup lang="ts">
import { SUPPORTED_LOCALES, LOCALE_LABELS, type SupportedLocale } from '@funmagic/shared/config/locales'
import { CodeOutline, CreateOutline } from '@vicons/ionicons5'

interface TranslationField {
  key: string
  label: string
  type?: 'input' | 'textarea'
}

const {
  fields,
  modelValue = {},
} = defineProps<{
  fields: TranslationField[]
  modelValue: Record<string, Record<string, string>>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, Record<string, string>>]
}>()

const activeTab = ref<SupportedLocale>('en')
const jsonMode = ref(true)
const jsonText = ref('')
const jsonError = ref<string | null>(null)

// Sync jsonText when modelValue changes externally (and we're in JSON mode)
watch(
  () => modelValue,
  (val) => {
    // Only update jsonText if user isn't actively editing (avoid overwriting)
    const formatted = JSON.stringify(val, null, 2)
    if (formatted !== jsonText.value) {
      jsonText.value = formatted
      jsonError.value = null
    }
  },
  { immediate: true, deep: true },
)

function handleJsonChange(value: string) {
  jsonText.value = value
  try {
    const parsed = JSON.parse(value)
    jsonError.value = null
    emit('update:modelValue', parsed)
  } catch {
    jsonError.value = 'Invalid JSON format'
  }
}

function updateField(locale: string, field: string, value: string) {
  const updated = { ...modelValue }
  if (!updated[locale]) updated[locale] = {}
  updated[locale] = { ...updated[locale], [field]: value }
  emit('update:modelValue', updated)
}

function getFieldValue(locale: string, field: string): string {
  return modelValue?.[locale]?.[field] ?? ''
}

function hasTranslation(locale: SupportedLocale): boolean {
  const localeData = modelValue?.[locale]
  if (!localeData || typeof localeData !== 'object') return false
  return Object.values(localeData).some((v) => v !== undefined && v !== null && v !== '')
}
</script>

<template>
  <n-card title="Translations">
    <template #header-extra>
      <n-button-group size="small">
        <n-button
          :type="jsonMode ? 'primary' : 'default'"
          @click="jsonMode = true"
        >
          <template #icon><n-icon><CodeOutline /></n-icon></template>
          JSON
        </n-button>
        <n-button
          :type="!jsonMode ? 'primary' : 'default'"
          @click="jsonMode = false"
        >
          <template #icon><n-icon><CreateOutline /></n-icon></template>
          Form
        </n-button>
      </n-button-group>
    </template>

    <!-- JSON Mode -->
    <div v-if="jsonMode" class="space-y-2">
      <n-input
        type="textarea"
        :value="jsonText"
        @update:value="handleJsonChange"
        :rows="12"
        style="font-family: monospace"
        placeholder="{}"
      />
      <n-alert v-if="jsonError" type="error" :bordered="false" class="!py-1">
        {{ jsonError }}
      </n-alert>
    </div>

    <!-- Form Mode -->
    <template v-else>
      <div class="flex items-center gap-2 mb-3">
        <div class="flex gap-1">
          <span
            v-for="locale in SUPPORTED_LOCALES"
            :key="locale"
            class="inline-block w-2 h-2 rounded-full"
            :class="hasTranslation(locale) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"
            :title="`${LOCALE_LABELS[locale]}: ${hasTranslation(locale) ? 'has content' : 'empty'}`"
          />
        </div>
      </div>

      <n-tabs v-model:value="activeTab" type="line">
        <n-tab-pane
          v-for="locale in SUPPORTED_LOCALES"
          :key="locale"
          :name="locale"
          :tab="LOCALE_LABELS[locale]"
        >
          <div class="space-y-4">
            <n-form-item
              v-for="field in fields"
              :key="field.key"
              :label="`${field.label} (${LOCALE_LABELS[locale]})`"
            >
              <n-input
                v-if="field.type !== 'textarea'"
                :value="getFieldValue(locale, field.key)"
                @update:value="(v: string) => updateField(locale, field.key, v)"
                :placeholder="`${field.label} in ${LOCALE_LABELS[locale]}`"
              />
              <n-input
                v-else
                type="textarea"
                :value="getFieldValue(locale, field.key)"
                @update:value="(v: string) => updateField(locale, field.key, v)"
                :placeholder="`${field.label} in ${LOCALE_LABELS[locale]}`"
                :rows="3"
              />
            </n-form-item>
          </div>
        </n-tab-pane>
      </n-tabs>
    </template>
  </n-card>
</template>
