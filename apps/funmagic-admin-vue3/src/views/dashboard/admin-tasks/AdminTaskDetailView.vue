<script setup lang="ts">
import { NButton, NIcon, NEmpty } from 'naive-ui'
import { ArrowBackOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const id = computed(() => route.params.id as string)
</script>

<template>
  <div>
    <PageHeader :title="'Task Detail'">
      <template #actions>
        <NButton @click="router.push({ name: 'admin-tasks' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <div class="rounded-lg border border-dashed p-8 text-center md:p-12">
      <NEmpty
        :description="`Admin Task detail API is not yet available. Task ID: ${id}`"
      >
        <template #extra>
          <NButton @click="router.push({ name: 'admin-tasks' })">
            Back to Admin Tasks
          </NButton>
        </template>
      </NEmpty>
    </div>
  </div>
</template>
