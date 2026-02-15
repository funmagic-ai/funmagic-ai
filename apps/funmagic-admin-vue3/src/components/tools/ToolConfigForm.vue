<script setup lang="ts">
import type { ToolDefinition, SavedToolConfig, StepConfig, StepProvider, Field, NumberField } from '@funmagic/shared/tool-registry'
import { useI18n } from 'vue-i18n'
import ConfigFieldRenderer from './ConfigFieldRenderer.vue'

interface Provider {
  id: string
  name: string
  displayName: string
  isActive: boolean
}

const props = withDefaults(defineProps<{
  modelValue: SavedToolConfig
  definition: ToolDefinition | null
  providers?: Provider[]
  title?: string
}>(), {
  title: 'Tool Configuration',
})

const emit = defineEmits<{
  'update:modelValue': [value: SavedToolConfig]
}>()

const { t } = useI18n()

const steps = computed(() => props.modelValue.steps ?? [])

/**
 * Merge definition defaults into config steps.
 * Ensures provider.name, provider.model, name, description, and field defaults
 * are always present in the saved config — not just displayed from the definition.
 */
function buildDefaultStep(stepDef: typeof props.definition extends null ? never : NonNullable<typeof props.definition>['steps'][number]): StepConfig {
  const stepConfig: StepConfig = {
    id: stepDef.id,
    provider: {
      name: stepDef.provider.name,
      model: stepDef.provider.model,
      providerOptions: stepDef.provider.providerOptions ?? {},
    },
  }
  for (const [fieldName, fieldDef] of Object.entries(stepDef.fields)) {
    if ('default' in fieldDef) {
      stepConfig[fieldName] = fieldDef.default
    }
  }
  return stepConfig
}

// Merge definition defaults into config when definition or modelValue changes
let isMerging = false

function mergeDefinitionDefaults() {
  if (isMerging) return
  const def = props.definition
  if (!def) return

  const currentSteps = [...(props.modelValue.steps ?? [])]
  let changed = false

  for (const stepDef of def.steps) {
    const existingIndex = currentSteps.findIndex(s => s.id === stepDef.id)

    if (existingIndex === -1) {
      // Step doesn't exist in config — add it with full defaults
      currentSteps.push(buildDefaultStep(stepDef))
      changed = true
    } else {
      // Step exists — ensure provider info is populated
      const existing = currentSteps[existingIndex]
      if (!existing.provider?.name) {
        const defaults = buildDefaultStep(stepDef)
        currentSteps[existingIndex] = {
          ...defaults,
          ...existing,
          provider: {
            ...defaults.provider!,
            ...(existing.provider ?? {}),
          },
        }
        changed = true
      }
    }
  }

  if (changed) {
    isMerging = true
    emit('update:modelValue', {
      ...props.modelValue,
      steps: currentSteps,
    })
    nextTick(() => { isMerging = false })
  }
}

watch(() => props.definition, mergeDefinitionDefaults, { immediate: true })
watch(() => props.modelValue, mergeDefinitionDefaults)

function getStepConfig(stepId: string): StepConfig {
  return steps.value.find(s => s.id === stepId) || { id: stepId }
}

function getDefinitionStep(stepId: string) {
  return props.definition?.steps.find(s => s.id === stepId)
}

function getOrCreateStep(stepId: string): StepConfig {
  const existing = steps.value.find(s => s.id === stepId)
  if (existing) return existing
  const defStep = getDefinitionStep(stepId)
  if (defStep) return buildDefaultStep(defStep)
  return { id: stepId }
}

function updateStepField(stepId: string, fieldName: string, value: unknown) {
  const exists = steps.value.some(s => s.id === stepId)
  const updatedSteps = exists
    ? steps.value.map(step =>
        step.id === stepId ? { ...step, [fieldName]: value } : step,
      )
    : [...steps.value, { ...getOrCreateStep(stepId), [fieldName]: value }]

  emit('update:modelValue', {
    ...props.modelValue,
    steps: updatedSteps,
  })
}

function updateProviderModel(stepId: string, model: string) {
  const exists = steps.value.some(s => s.id === stepId)
  const base = getOrCreateStep(stepId)
  const updatedSteps = exists
    ? steps.value.map(step => {
        if (step.id !== stepId) return step
        const existing = step.provider ?? base.provider ?? { name: '', model: '' }
        return { ...step, provider: { ...existing, model } }
      })
    : [...steps.value, { ...base, provider: { ...(base.provider ?? { name: '', model: '' }), model } }]

  emit('update:modelValue', {
    ...props.modelValue,
    steps: updatedSteps,
  })
}

function updateProviderOption(stepId: string, optionName: string, value: unknown) {
  const exists = steps.value.some(s => s.id === stepId)
  const base = getOrCreateStep(stepId)
  const updatedSteps = exists
    ? steps.value.map(step => {
        if (step.id !== stepId) return step
        const existing = step.provider ?? base.provider ?? { name: '', model: '' }
        return {
          ...step,
          provider: {
            ...existing,
            providerOptions: { ...(existing.providerOptions ?? {}), [optionName]: value },
          },
        }
      })
    : [...steps.value, {
        ...base,
        provider: {
          ...(base.provider ?? { name: '', model: '' }),
          providerOptions: { ...((base.provider as StepProvider)?.providerOptions ?? {}), [optionName]: value },
        },
      }]

  emit('update:modelValue', {
    ...props.modelValue,
    steps: updatedSteps,
  })
}

function updateCustomProviderOptions(stepId: string, customProviderOptions: Record<string, unknown>) {
  const exists = steps.value.some(s => s.id === stepId)
  const base = getOrCreateStep(stepId)
  const updatedSteps = exists
    ? steps.value.map(step => {
        if (step.id !== stepId) return step
        const existing = step.provider ?? base.provider ?? { name: '', model: '' }
        return { ...step, provider: { ...existing, customProviderOptions } }
      })
    : [...steps.value, {
        ...base,
        provider: { ...(base.provider ?? { name: '', model: '' }), customProviderOptions },
      }]

  emit('update:modelValue', {
    ...props.modelValue,
    steps: updatedSteps,
  })
}

function findProvider(providerName: string): Provider | undefined {
  return props.providers?.find(p => p.name.toLowerCase() === providerName.toLowerCase())
}

function getDefaultValue(field: Field): unknown {
  if ('default' in field) return field.default
  return undefined
}

// Custom options key-value management
const newKey = ref('')
const newValue = ref('')

function addCustomOption(stepId: string) {
  if (!newKey.value.trim()) return
  const stepConfig = getStepConfig(stepId)
  const existing = (stepConfig.provider as StepProvider)?.customProviderOptions ?? {}
  updateCustomProviderOptions(stepId, { ...existing, [newKey.value]: newValue.value })
  newKey.value = ''
  newValue.value = ''
}

function removeCustomOption(stepId: string, key: string) {
  const stepConfig = getStepConfig(stepId)
  const existing = { ...((stepConfig.provider as StepProvider)?.customProviderOptions ?? {}) }
  delete existing[key]
  updateCustomProviderOptions(stepId, existing)
}
</script>

<template>
  <n-card :title="title">
    <div v-if="!definition" class="text-center py-8 text-muted-foreground">
      {{ t('tools.selectConfigHint') }}
    </div>

    <div v-else class="space-y-6">
      <div
        v-for="(stepDef, index) in definition.steps"
        :key="stepDef.id"
        class="rounded-lg border bg-muted/50 p-4 space-y-4"
      >
        <!-- Step Header -->
        <div>
          <h3 class="text-base font-semibold">{{ t('tools.step') }} {{ index + 1 }}: {{ stepDef.name }}</h3>
          <p v-if="stepDef.description" class="text-sm text-muted-foreground mt-0.5">{{ stepDef.description }}</p>
        </div>

        <!-- Provider + Model + Cost row -->
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <!-- Provider badge -->
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">{{ t('tools.provider') }}:</span>
            <n-tag
              :type="findProvider(stepDef.provider.name)?.isActive ? 'success' : findProvider(stepDef.provider.name) ? 'warning' : 'error'"
              size="small"
            >
              {{ findProvider(stepDef.provider.name)?.displayName || stepDef.provider.name }}
            </n-tag>
            <n-tag v-if="findProvider(stepDef.provider.name) && !findProvider(stepDef.provider.name)!.isActive" type="warning" size="small">
              {{ t('common.inactive') }}
            </n-tag>
            <n-tag v-if="!findProvider(stepDef.provider.name)" type="error" size="small">
              Not Configured
            </n-tag>
          </div>

          <!-- Model input -->
          <div class="flex items-center gap-1.5">
            <span class="text-muted-foreground">{{ t('studio.model') }}:</span>
            <n-input
              :value="(getStepConfig(stepDef.id).provider as StepProvider)?.model ?? stepDef.provider.model"
              @update:value="(v: string) => updateProviderModel(stepDef.id, v)"
              size="small"
              class="!w-64"
              :placeholder="stepDef.provider.model"
            />
          </div>

          <!-- Cost -->
          <div v-if="stepDef.fields.cost" class="flex items-center gap-1.5">
            <span class="text-muted-foreground">{{ t('tools.creditCost') }}:</span>
            <n-input-number
              :value="(getStepConfig(stepDef.id).cost as number | undefined) ?? (stepDef.fields.cost as NumberField).default"
              @update:value="(v: number | null) => updateStepField(stepDef.id, 'cost', v)"
              size="small"
              class="!w-20"
              :min="(stepDef.fields.cost as NumberField).min"
            />
          </div>
        </div>

        <!-- Admin-editable fields (excluding cost) -->
        <div class="space-y-3">
          <template v-for="(fieldDef, fieldName) in stepDef.fields" :key="fieldName">
            <ConfigFieldRenderer
              v-if="fieldName !== 'cost'"
              :name="String(fieldName)"
              :field="fieldDef"
              :value="getStepConfig(stepDef.id)[fieldName as string]"
              :on-change="(v: unknown) => updateStepField(stepDef.id, String(fieldName), v)"
            />
          </template>
        </div>

        <!-- Overridable options -->
        <div v-if="stepDef.overridableOptions && Object.keys(stepDef.overridableOptions).length > 0" class="space-y-3">
          <div class="text-sm font-medium">{{ t('tools.providerOptions') }}</div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="(optionDef, optionName) in stepDef.overridableOptions" :key="optionName" class="space-y-1">
              <div class="text-xs text-muted-foreground">
                {{ String(optionName).split(/(?=[A-Z])/).join(' ').replace(/^\w/, (c: string) => c.toUpperCase()) }}
              </div>
              <!-- String with options -->
              <n-select
                v-if="optionDef.type === 'string' && 'options' in optionDef && optionDef.options?.length"
                :value="String((getStepConfig(stepDef.id).provider as StepProvider)?.providerOptions?.[optionName as string] ?? getDefaultValue(optionDef) ?? '')"
                :options="optionDef.options!.map((o: string) => ({ label: o, value: o }))"
                @update:value="(v: string) => updateProviderOption(stepDef.id, String(optionName), v)"
                size="small"
              />
              <!-- Number -->
              <n-input-number
                v-else-if="optionDef.type === 'number'"
                :value="((getStepConfig(stepDef.id).provider as StepProvider)?.providerOptions?.[optionName as string] as number | undefined) ?? (getDefaultValue(optionDef) as number | undefined)"
                @update:value="(v: number | null) => updateProviderOption(stepDef.id, String(optionName), v)"
                size="small"
                :min="'min' in optionDef ? optionDef.min : undefined"
                :max="'max' in optionDef ? optionDef.max : undefined"
              />
              <!-- Boolean -->
              <n-switch
                v-else-if="optionDef.type === 'boolean'"
                :value="((getStepConfig(stepDef.id).provider as StepProvider)?.providerOptions?.[optionName as string] as boolean | undefined) ?? (getDefaultValue(optionDef) as boolean | undefined) ?? false"
                @update:value="(v: boolean) => updateProviderOption(stepDef.id, String(optionName), v)"
              />
              <!-- Default string -->
              <n-input
                v-else
                :value="String((getStepConfig(stepDef.id).provider as StepProvider)?.providerOptions?.[optionName as string] ?? getDefaultValue(optionDef) ?? '')"
                @update:value="(v: string) => updateProviderOption(stepDef.id, String(optionName), v)"
                size="small"
              />
            </div>
          </div>
        </div>

        <!-- Custom options key-value editor -->
        <div class="space-y-2">
          <div class="text-sm font-medium">{{ t('tools.customOptions') }}</div>
          <div class="text-xs text-muted-foreground">{{ t('tools.customOptionsHint') }}</div>
          <div
            v-for="(val, key) in ((getStepConfig(stepDef.id).provider as StepProvider)?.customProviderOptions ?? {})"
            :key="key"
            class="flex items-center gap-2"
          >
            <n-input :value="String(key)" disabled size="small" class="!w-40" />
            <n-input
              :value="String(val)"
              @update:value="(v: string) => {
                const stepConfig = getStepConfig(stepDef.id);
                const existing = { ...((stepConfig.provider as StepProvider)?.customProviderOptions ?? {}) };
                existing[String(key)] = v;
                updateCustomProviderOptions(stepDef.id, existing);
              }"
              size="small"
            />
            <n-button size="small" type="error" quaternary @click="removeCustomOption(stepDef.id, String(key))">
              {{ t('common.remove') }}
            </n-button>
          </div>
          <div class="flex items-center gap-2">
            <n-input v-model:value="newKey" :placeholder="t('placeholder.key')" size="small" class="!w-40" />
            <n-input v-model:value="newValue" :placeholder="t('placeholder.value')" size="small" />
            <n-button size="small" @click="addCustomOption(stepDef.id)">{{ t('common.add') }}</n-button>
          </div>
        </div>
      </div>
    </div>
  </n-card>
</template>
