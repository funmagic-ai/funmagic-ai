<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { AddOutline, ColorPaletteOutline, ImageOutline, SparklesOutline } from '@vicons/ionicons5'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const message = useMessage()
const queryClient = useQueryClient()

const createProjectMutation = useMutation({
  mutationFn: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/studio/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    })
    if (!res.ok) throw new Error('Failed to create project')
    return res.json() as Promise<{ project: { id: string } }>
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['studio-projects'] })
    router.push({ name: 'studio-project', params: { id: data.project.id } })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})
</script>

<template>
  <div class="flex h-full flex-1 flex-col items-center justify-center px-6">
    <div class="flex max-w-sm flex-col items-center text-center">
      <!-- Icon -->
      <div class="mb-6">
        <NIcon :size="48" class="text-primary">
          <ColorPaletteOutline />
        </NIcon>
      </div>

      <!-- Title & description -->
      <h2 class="mb-2 text-xl font-semibold text-foreground">{{ t('studio.title') }}</h2>
      <p class="mb-8 text-sm leading-relaxed text-muted-foreground">
        {{ t('studio.selectOrCreateProject') }}
      </p>

      <!-- Feature hints -->
      <div class="mb-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
          <NIcon :size="20" class="text-muted-foreground">
            <ImageOutline />
          </NIcon>
          <span class="text-xs text-muted-foreground">{{ t('studio.uploadImage') }}</span>
        </div>
        <div class="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
          <NIcon :size="20" class="text-muted-foreground">
            <SparklesOutline />
          </NIcon>
          <span class="text-xs text-muted-foreground">{{ t('studio.generations') }}</span>
        </div>
        <div class="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
          <NIcon :size="20" class="text-muted-foreground">
            <ColorPaletteOutline />
          </NIcon>
          <span class="text-xs text-muted-foreground">{{ t('studio.batchMode') }}</span>
        </div>
      </div>

      <!-- CTA button -->
      <NButton
        type="primary"
        size="large"
        :loading="createProjectMutation.isPending.value"
        @click="createProjectMutation.mutate()"
      >
        <template #icon>
          <NIcon><AddOutline /></NIcon>
        </template>
        {{ t('studio.newProject') }}
      </NButton>
    </div>
  </div>
</template>
