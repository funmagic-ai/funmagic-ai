<script setup lang="ts">
import { NModal, NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    show: boolean
    title?: string
    message?: string
    loading?: boolean
  }>(),
  {
    title: undefined,
    message: undefined,
    loading: false,
  },
)

const emit = defineEmits<{
  'update:show': [value: boolean]
  confirm: []
}>()

const { t } = useI18n()

const displayTitle = computed(() => props.title ?? t('common.confirm'))
const displayMessage = computed(() => props.message ?? t('common.deleteConfirm'))
</script>

<template>
  <NModal
    :show="show"
    preset="dialog"
    type="error"
    :title="displayTitle"
    :positive-text="t('common.delete')"
    :negative-text="t('common.cancel')"
    :positive-button-props="{ type: 'error', loading }"
    :loading="loading"
    :mask-closable="!loading"
    :closable="!loading"
    @positive-click="emit('confirm')"
    @negative-click="emit('update:show', false)"
    @close="emit('update:show', false)"
    @mask-click="emit('update:show', false)"
  >
    <p class="text-sm text-muted-foreground">{{ displayMessage }}</p>
  </NModal>
</template>
