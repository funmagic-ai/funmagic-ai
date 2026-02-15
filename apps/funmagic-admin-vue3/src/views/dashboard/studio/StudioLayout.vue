<script setup lang="ts">
import { NButton, NIcon, NEmpty, NSpin, NPopconfirm, NTime, NScrollbar } from 'naive-ui'
import { AddOutline, ColorPaletteOutline, TrashOutline, ArrowBackOutline } from '@vicons/ionicons5'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()

const activeProjectId = computed(() => route.params.id as string | undefined)
const isProjectSelected = computed(() => !!activeProjectId.value)

const { data, isLoading, isError } = useQuery({
  queryKey: ['studio-projects'],
  queryFn: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/studio/projects`, { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to fetch projects')
    return res.json() as Promise<{
      projects: Array<{ id: string; title: string | null; createdAt: string; updatedAt: string }>
    }>
  },
})

const createProjectMutation = useMutation({
  mutationFn: async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/studio/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({}),
    })
    if (!res.ok) throw new Error('Failed to create project')
    return res.json() as Promise<{ project: { id: string; title: string | null; createdAt: string; updatedAt: string } }>
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['studio-projects'] })
    router.push({ name: 'studio-project', params: { id: data.project.id } })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

const deleteProjectMutation = useMutation({
  mutationFn: async (projectId: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/studio/projects/${projectId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Failed to delete project')
  },
  onSuccess: (_data, projectId) => {
    queryClient.invalidateQueries({ queryKey: ['studio-projects'] })
    message.success(t('studio.projectDeleted'))
    if (activeProjectId.value === projectId) {
      router.push({ name: 'studio' })
    }
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

const projects = computed(() => data.value?.projects ?? [])
const hasProjects = computed(() => projects.value.length > 0)
const showSidebar = computed(() => isLoading.value || isError.value || hasProjects.value)
</script>

<template>
  <div class="flex h-[calc(100dvh-6rem)] flex-col md:h-[calc(100dvh-7.5rem)]">
    <!-- Header -->
    <div class="mb-4 flex shrink-0 items-center justify-between">
      <div class="flex items-center gap-2">
        <NButton
          v-if="isProjectSelected"
          class="md:hidden"
          quaternary
          @click="router.push({ name: 'studio' })"
        >
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
        </NButton>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">{{ t('studio.title') }}</h1>
      </div>
      <NButton
        type="primary"
        :loading="createProjectMutation.isPending.value"
        @click="createProjectMutation.mutate()"
      >
        <template #icon>
          <NIcon><AddOutline /></NIcon>
        </template>
        {{ t('studio.newProject') }}
      </NButton>
    </div>

    <!-- Two-column body -->
    <div class="flex min-h-0 flex-1 items-stretch gap-3 overflow-hidden">
      <!-- Left sidebar: project list (hidden when no projects) -->
      <div
        v-if="showSidebar"
        class="w-full shrink-0 overflow-hidden rounded-lg border border-border bg-card md:flex md:w-60 md:flex-col"
        :class="isProjectSelected ? 'hidden' : 'flex flex-col'"
      >
        <div class="border-b border-border px-4 py-3">
          <h2 class="text-sm font-semibold text-muted-foreground">{{ t('studio.projects') }}</h2>
        </div>

        <div v-if="isLoading" class="flex flex-1 items-center justify-center py-12">
          <NSpin size="medium" />
        </div>

        <div v-else-if="isError" class="flex flex-1 items-center justify-center px-4">
          <NEmpty :description="t('studio.loadFailed')" size="small">
            <template #extra>
              <NButton size="small" @click="() => queryClient.invalidateQueries({ queryKey: ['studio-projects'] })">
                {{ t('common.retry') }}
              </NButton>
            </template>
          </NEmpty>
        </div>

        <NScrollbar v-else class="flex-1">
          <div class="flex flex-col">
            <div
              v-for="project in projects"
              :key="project.id"
              class="group flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50"
              :class="activeProjectId === project.id ? 'bg-muted' : ''"
              @click="router.push({ name: 'studio-project', params: { id: project.id } })"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <NIcon :size="16" class="text-primary">
                  <ColorPaletteOutline />
                </NIcon>
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">
                  {{ project.title || t('studio.untitledProject') }}
                </div>
                <div class="text-xs text-muted-foreground">
                  <NTime :time="new Date(project.createdAt)" type="relative" />
                </div>
              </div>
              <NPopconfirm
                @positive-click.stop="deleteProjectMutation.mutate(project.id)"
              >
                <template #trigger>
                  <NButton
                    size="tiny"
                    quaternary
                    type="error"
                    class="opacity-0 group-hover:opacity-100"
                    @click.stop
                  >
                    <template #icon>
                      <NIcon :size="14"><TrashOutline /></NIcon>
                    </template>
                  </NButton>
                </template>
                {{ t('studio.deleteProject') }}
              </NPopconfirm>
            </div>
          </div>
        </NScrollbar>
      </div>

      <!-- Right panel: workspace content -->
      <div
        class="min-h-0 min-w-0 flex-1 overflow-hidden"
        :class="isProjectSelected || !showSidebar ? 'flex flex-col' : 'hidden md:flex md:flex-col'"
      >
        <router-view class="flex-1" />
      </div>
    </div>
  </div>
</template>
