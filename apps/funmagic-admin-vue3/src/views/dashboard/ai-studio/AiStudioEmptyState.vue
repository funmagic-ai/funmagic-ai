<script setup lang="ts">
import { NEmpty } from 'naive-ui'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="flex h-full flex-1 items-center justify-center">
    <NEmpty :description="t('aiStudio.selectOrCreateChat')" />
  </div>
</template>
