<script setup lang="ts">
import { SUPPORTED_LOCALES, LOCALE_LABELS, type SupportedLocale } from '@funmagic/shared/config/locales'
import { CodeOutline, CreateOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

interface TranslationField {
  key: string
  label: string
  type?: 'input' | 'textarea'
  required?: boolean
}

interface StepInfo {
  id: string
  name: string
}

const {
  fields,
  modelValue = {},
  steps = [],
  title: titleProp,
} = defineProps<{
  fields: TranslationField[]
  modelValue: Record<string, Record<string, any>>
  steps?: StepInfo[]
  title?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, Record<string, any>>]
}>()

const { t } = useI18n()

const title = computed(() => titleProp ?? t('i18n.title'))

const activeTab = ref<SupportedLocale>('en')
const jsonMode = ref(false)
const jsonText = ref('')
const jsonError = ref<string | null>(null)
const validationErrors = ref<Record<string, string[]>>({})

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
    jsonError.value = t('i18n.invalidJson')
  }
}

function updateField(locale: string, field: string, value: string) {
  const updated = { ...modelValue }
  if (!updated[locale]) updated[locale] = {}
  updated[locale] = { ...updated[locale], [field]: value }
  emit('update:modelValue', updated)
  // Clear validation error for this locale when user types
  if (validationErrors.value[locale]) {
    validationErrors.value = { ...validationErrors.value }
    delete validationErrors.value[locale]
  }
}

function getFieldValue(locale: string, field: string): string {
  return modelValue?.[locale]?.[field] ?? ''
}

function updateStepField(locale: string, stepId: string, field: string, value: string) {
  const updated = { ...modelValue }
  if (!updated[locale]) updated[locale] = {}
  const localeData = { ...updated[locale] }
  const existingSteps = (localeData.steps && typeof localeData.steps === 'object') ? { ...localeData.steps } : {}
  const existingStep = existingSteps[stepId] ? { ...existingSteps[stepId] } : {}
  existingStep[field] = value
  existingSteps[stepId] = existingStep
  localeData.steps = existingSteps
  updated[locale] = localeData
  emit('update:modelValue', updated)
}

function getStepFieldValue(locale: string, stepId: string, field: string): string {
  const localeData = modelValue?.[locale]
  if (!localeData?.steps || typeof localeData.steps !== 'object') return ''
  return localeData.steps[stepId]?.[field] ?? ''
}

function hasTranslation(locale: SupportedLocale): boolean {
  const localeData = modelValue?.[locale]
  if (!localeData || typeof localeData !== 'object') return false
  return Object.values(localeData).some((v) => v !== undefined && v !== null && v !== '')
}

function hasError(locale: SupportedLocale): boolean {
  return (validationErrors.value[locale]?.length ?? 0) > 0
}

/**
 * Validate that all locales have required fields filled.
 * Returns null if valid, or an error message string if invalid.
 */
function validate(): string | null {
  const requiredFields = fields.filter((f) => f.required)
  if (requiredFields.length === 0) return null

  const errors: Record<string, string[]> = {}
  for (const locale of SUPPORTED_LOCALES) {
    const missing: string[] = []
    for (const field of requiredFields) {
      const value = getFieldValue(locale, field.key)
      if (!value || !value.trim()) {
        missing.push(field.label)
      }
    }
    if (missing.length > 0) {
      errors[locale] = missing
    }
  }

  validationErrors.value = errors
  if (Object.keys(errors).length === 0) return null

  // Switch to the first locale tab with errors and to form mode
  const firstErrorLocale = SUPPORTED_LOCALES.find((l) => errors[l])
  if (firstErrorLocale) {
    activeTab.value = firstErrorLocale
    jsonMode.value = false
  }

  const missingLocales = Object.keys(errors).map((l) => LOCALE_LABELS[l as SupportedLocale]).join(', ')
  return t('i18n.missingTranslations', { locales: missingLocales })
}

defineExpose({ validate })
</script>

<template>
  <n-card :title="title">
    <template #header-extra>
      <n-button-group size="small">
        <n-button
          :type="jsonMode ? 'primary' : 'default'"
          @click="jsonMode = true"
        >
          <template #icon><n-icon><CodeOutline /></n-icon></template>
          {{ t('i18n.json') }}
        </n-button>
        <n-button
          :type="!jsonMode ? 'primary' : 'default'"
          @click="jsonMode = false"
        >
          <template #icon><n-icon><CreateOutline /></n-icon></template>
          {{ t('i18n.form') }}
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
            :class="[
              hasError(locale) ? 'bg-red-500' : hasTranslation(locale) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600',
            ]"
            :title="`${LOCALE_LABELS[locale]}: ${hasError(locale) ? t('i18n.missingRequired') : hasTranslation(locale) ? t('i18n.hasContent') : t('i18n.empty')}`"
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
          <n-alert v-if="validationErrors[locale]" type="error" :bordered="false" class="mb-4">
            {{ t('i18n.missingRequiredFields', { fields: validationErrors[locale].join(', ') }) }}
          </n-alert>
          <div class="space-y-4">
            <n-form-item
              v-for="field in fields"
              :key="field.key"
              :label="`${field.label} (${LOCALE_LABELS[locale]})`"
              :required="field.required"
              :validation-status="field.required && validationErrors[locale]?.includes(field.label) ? 'error' : undefined"
            >
              <n-input
                v-if="field.type !== 'textarea'"
                :value="getFieldValue(locale, field.key)"
                @update:value="(v: string) => updateField(locale, field.key, v)"
                :placeholder="`${field.label} in ${LOCALE_LABELS[locale]}`"
                :status="field.required && validationErrors[locale]?.includes(field.label) ? 'error' : undefined"
              />
              <n-input
                v-else
                type="textarea"
                :value="getFieldValue(locale, field.key)"
                @update:value="(v: string) => updateField(locale, field.key, v)"
                :placeholder="`${field.label} in ${LOCALE_LABELS[locale]}`"
                :rows="3"
                :status="field.required && validationErrors[locale]?.includes(field.label) ? 'error' : undefined"
              />
            </n-form-item>

            <!-- Step Translations -->
            <template v-if="steps.length > 0">
              <n-divider>{{ t('i18n.steps') }}</n-divider>
              <div
                v-for="step in steps"
                :key="step.id"
                class="rounded-lg border bg-muted/50 p-4 space-y-3"
              >
                <div class="text-sm font-medium text-muted-foreground">{{ step.name }} ({{ step.id }})</div>
                <n-form-item :label="t('i18n.stepName', { locale: LOCALE_LABELS[locale] })">
                  <n-input
                    :value="getStepFieldValue(locale, step.id, 'name')"
                    @update:value="(v: string) => updateStepField(locale, step.id, 'name', v)"
                    :placeholder="`Step name in ${LOCALE_LABELS[locale]}`"
                  />
                </n-form-item>
                <n-form-item :label="t('i18n.stepDescription', { locale: LOCALE_LABELS[locale] })">
                  <n-input
                    :value="getStepFieldValue(locale, step.id, 'description')"
                    @update:value="(v: string) => updateStepField(locale, step.id, 'description', v)"
                    :placeholder="`Step description in ${LOCALE_LABELS[locale]}`"
                  />
                </n-form-item>
              </div>
            </template>
          </div>
        </n-tab-pane>
      </n-tabs>
    </template>
  </n-card>
</template>
