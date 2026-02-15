<script setup lang="ts">
import {
  NButton,
  NDataTable,
  NSpin,
  NEmpty,
  NIcon,
  NTabs,
  NTabPane,
  NTag,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { EyeOutline } from '@vicons/ionicons5'
import PageHeader from '@/components/shared/PageHeader.vue'

const { t } = useI18n()
const router = useRouter()

const statusFilter = ref<string>('all')

interface ProjectRow {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  generationCount: number
  statusCounts: Record<string, number>
}

const { data, isLoading } = useQuery({
  queryKey: ['studio', 'projects-summary'],
  queryFn: async () => {
    // Use summary endpoint to avoid N+1
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/studio/projects/summary`, { credentials: 'include' })
    if (!res.ok) throw new Error('Failed to fetch projects')
    const data = await res.json() as {
      projects: Array<{ id: string; title: string | null; createdAt: string; updatedAt: string; generationCount: number }>
    }

    // Enrich with status counts by fetching each project's details
    const enrichedProjects: ProjectRow[] = await Promise.all(
      data.projects.map(async (project) => {
        try {
          const detailRes = await fetch(
            `${import.meta.env.VITE_API_URL}/api/admin/studio/projects/${project.id}`,
            { credentials: 'include' },
          )
          if (!detailRes.ok) throw new Error()
          const detail = await detailRes.json()
          const generations = detail?.generations ?? []
          const assistantGens = generations.filter((g: any) => g.role === 'assistant')

          const statusCounts: Record<string, number> = {}
          for (const gen of assistantGens) {
            statusCounts[gen.status] = (statusCounts[gen.status] ?? 0) + 1
          }

          return {
            id: project.id,
            title: project.title,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            generationCount: assistantGens.length,
            statusCounts,
          }
        } catch {
          return {
            id: project.id,
            title: project.title,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            generationCount: project.generationCount,
            statusCounts: {},
          }
        }
      }),
    )

    return enrichedProjects
  },
})

const allProjects = computed(() => data.value ?? [])

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') return allProjects.value
  return allProjects.value.filter(p =>
    (p.statusCounts[statusFilter.value] ?? 0) > 0,
  )
})

const statusTabs = computed(() => [
  { name: 'all', label: t('common.all') },
  { name: 'pending', label: t('tasks.pending') },
  { name: 'processing', label: t('tasks.processing') },
  { name: 'completed', label: t('tasks.completed') },
  { name: 'failed', label: t('tasks.failed') },
])

function getStatusType(status: string): 'default' | 'info' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'completed': return 'success'
    case 'processing': return 'info'
    case 'pending': return 'warning'
    case 'failed': return 'error'
    default: return 'default'
  }
}

const columns = computed<DataTableColumns<ProjectRow>>(() => [
  {
    title: t('studio.projectTitle'),
    key: 'title',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render(row) {
      return row.title || t('studio.untitledProject')
    },
  },
  {
    title: t('studio.generationCount'),
    key: 'generationCount',
    width: 120,
    render(row) {
      return `${row.generationCount} ${t('studio.generations').toLowerCase()}`
    },
  },
  {
    title: t('common.status'),
    key: 'statusCounts',
    width: 220,
    render(row) {
      const entries = Object.entries(row.statusCounts)
      if (entries.length === 0) return '--'
      return h('div', { class: 'flex gap-1 flex-wrap' }, entries.map(([status, count]) =>
        h(NTag, { size: 'small', type: getStatusType(status), bordered: false }, { default: () => `${status}: ${count}` }),
      ))
    },
  },
  {
    title: t('studio.lastActivity'),
    key: 'updatedAt',
    width: 160,
    render(row) {
      return new Date(row.updatedAt).toLocaleString()
    },
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 80,
    fixed: 'right',
    render(row) {
      return h(
        NButton,
        {
          size: 'small',
          quaternary: true,
          onClick: (e: Event) => {
            e.stopPropagation()
            router.push({ name: 'studio-projects-detail', params: { id: row.id } })
          },
        },
        {
          icon: () => h(NIcon, null, { default: () => h(EyeOutline) }),
        },
      )
    },
  },
])
</script>

<template>
  <div>
    <PageHeader :title="t('studio.projectsTitle')" :description="t('studio.projectsDescription')" />

    <div class="space-y-4">
      <NTabs v-model:value="statusFilter" type="line">
        <NTabPane
          v-for="tab in statusTabs"
          :key="tab.name"
          :name="tab.name"
          :tab="tab.label"
        />
      </NTabs>

      <div v-if="isLoading" class="flex justify-center py-12">
        <NSpin size="large" />
      </div>

      <div
        v-else-if="filteredProjects.length === 0"
        class="rounded-lg border border-dashed p-8 text-center md:p-12"
      >
        <NEmpty :description="t('studio.noProjects')" />
      </div>

      <template v-else>
        <div class="overflow-hidden rounded-md border">
          <NDataTable
            :columns="columns"
            :data="filteredProjects"
            :bordered="false"
            :single-line="false"
            size="small"
            :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => router.push({ name: 'studio-projects-detail', params: { id: row.id } }) })"
          />
        </div>
      </template>
    </div>
  </div>
</template>
