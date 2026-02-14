<script setup lang="ts">
import { NButton, NEmpty } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div>
    <PageHeader :title="t('tasks.title')" :description="t('tasks.adminDescription')" />

    <div class="rounded-lg border border-dashed p-8 text-center md:p-12">
      <NEmpty
        :description="t('tasks.adminNotAvailable')"
      >
        <template #extra>
          <NButton type="primary" @click="router.push({ name: 'users' })">
            {{ t('tasks.goToUsers') }}
          </NButton>
        </template>
      </NEmpty>
    </div>
  </div>
</template>
