<script setup lang="ts">
import type { Field, StringField, NumberField, BooleanField, ArrayField, ObjectField } from '@funmagic/shared/tool-registry'

const props = defineProps<{
  name: string
  field: Field
  value: unknown
  onChange: (value: unknown) => void
}>()

const fieldLabel = computed(() =>
  props.name
    .split(/(?=[A-Z])/)
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase())
)
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
      <template v-if="field.description" #feedback>
        <span class="text-xs text-gray-500">{{ field.description }}</span>
      </template>
    </n-form-item>

    <!-- String with upload => file upload (simplified - just a text input for URL) -->
    <n-form-item v-else-if="(field as StringField).upload" :label="fieldLabel">
      <n-input
        :value="(value as string) ?? ''"
        @update:value="onChange"
        :placeholder="(field as StringField).placeholder ?? 'URL or file path'"
      />
      <template v-if="field.description" #feedback>
        <span class="text-xs text-gray-500">{{ field.description }}</span>
      </template>
    </n-form-item>

    <!-- Default string => NInput textarea -->
    <n-form-item v-else :label="fieldLabel">
      <n-input
        type="textarea"
        :value="(value as string) ?? (field as StringField).default ?? ''"
        @update:value="onChange"
        :placeholder="(field as StringField).placeholder"
        :rows="3"
      />
      <template v-if="field.description" #feedback>
        <span class="text-xs text-gray-500">{{ field.description }}</span>
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
    <template v-if="field.description" #feedback>
      <span class="text-xs text-gray-500">{{ field.description }}</span>
    </template>
  </n-form-item>

  <!-- Boolean field -->
  <n-form-item v-else-if="field.type === 'boolean'" :label="fieldLabel">
    <n-switch
      :value="(value as boolean | undefined) ?? (field as BooleanField).default ?? false"
      @update:value="onChange"
    />
    <template v-if="field.description" #feedback>
      <span class="text-xs text-gray-500">{{ field.description }}</span>
    </template>
  </n-form-item>

  <!-- Array field -->
  <template v-else-if="field.type === 'array'">
    <n-form-item :label="fieldLabel">
      <div class="w-full space-y-2">
        <div v-if="field.description" class="text-xs text-gray-500 mb-2">{{ field.description }}</div>
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
            @click="() => {
              const arr = [...((value as Record<string, unknown>[]) ?? [])];
              arr.splice(idx, 1);
              onChange(arr);
            }"
          >
            Remove
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
          + Add Item
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
  <div v-else class="text-sm text-gray-500">
    Unknown field type for {{ name }}
  </div>
</template>
