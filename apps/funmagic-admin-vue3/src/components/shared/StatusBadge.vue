<script setup lang="ts">
import { NTag } from 'naive-ui'

const props = defineProps<{
  status: string
}>()

const typeMap: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  queued: 'info',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  active: 'success',
  inactive: 'default',
  waiting: 'warning',
  delayed: 'warning',
}

const tagType = computed(() => typeMap[props.status.toLowerCase()] ?? 'default')

const label = computed(() => {
  const s = props.status
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
})
</script>

<template>
  <NTag :type="tagType" size="small" round>
    {{ label }}
  </NTag>
</template>
