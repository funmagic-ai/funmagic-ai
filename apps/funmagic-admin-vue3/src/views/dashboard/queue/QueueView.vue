<script setup lang="ts">
import {
  NIcon,
  NSpin,
  NEmpty,
  NButton,
  NDataTable,
  NTabs,
  NTabPane,
  NPagination,
  NCode,
  NTag,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  HourglassOutline,
  FlashOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  TimeOutline,
  RefreshOutline,
} from '@vicons/ionicons5'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()

type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'

const activeStatus = ref<JobStatus>('waiting')
const queueFilter = ref<string>('all')
const currentPage = ref(1)
const pageSize = ref(20)

// ─── Stats ───────────────────────────────────────────────
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: computed(() => ['queue-stats', queueFilter.value]),
  queryFn: async () => {
    const params = new URLSearchParams({ queue: queueFilter.value })
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/queue/stats?${params}`,
      { credentials: 'include' },
    )
    if (!response.ok) throw new Error('API not available')
    return await response.json() as {
      waiting: number
      active: number
      completed: number
      failed: number
      delayed: number
    }
  },
  retry: false,
  refetchInterval: 10000,
})

const stats = computed(() => [
  {
    key: 'waiting' as JobStatus,
    label: t('queue.waiting'),
    value: data.value?.waiting ?? 0,
    icon: HourglassOutline,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    ring: 'ring-yellow-500/30',
  },
  {
    key: 'active' as JobStatus,
    label: t('queue.active'),
    value: data.value?.active ?? 0,
    icon: FlashOutline,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/30',
  },
  {
    key: 'completed' as JobStatus,
    label: t('queue.completed'),
    value: data.value?.completed ?? 0,
    icon: CheckmarkCircleOutline,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    ring: 'ring-green-500/30',
  },
  {
    key: 'failed' as JobStatus,
    label: t('queue.failed'),
    value: data.value?.failed ?? 0,
    icon: CloseCircleOutline,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    ring: 'ring-red-500/30',
  },
  {
    key: 'delayed' as JobStatus,
    label: t('queue.delayed'),
    value: data.value?.delayed ?? 0,
    icon: TimeOutline,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    ring: 'ring-orange-500/30',
  },
])

function selectStatus(status: JobStatus) {
  activeStatus.value = status
  currentPage.value = 1
}

// ─── Jobs ────────────────────────────────────────────────
interface QueueJob {
  id: string
  queue: string
  name: string
  status: string
  data: Record<string, unknown>
  progress: number
  attemptsMade: number
  failedReason: string | null
  timestamp: number
  processedOn: number | null
  finishedOn: number | null
  delay: number
}

const { data: jobsData, isLoading: jobsLoading } = useQuery({
  queryKey: computed(() => ['queue-jobs', activeStatus.value, queueFilter.value, currentPage.value, pageSize.value]),
  queryFn: async () => {
    const params = new URLSearchParams({
      status: activeStatus.value,
      queue: queueFilter.value,
      limit: String(pageSize.value),
      offset: String((currentPage.value - 1) * pageSize.value),
    })
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/queue/jobs?${params}`,
      { credentials: 'include' },
    )
    if (!response.ok) throw new Error('Failed to fetch jobs')
    return await response.json() as { jobs: QueueJob[]; total: number }
  },
  refetchInterval: 10000,
  enabled: computed(() => !isError.value),
})

const jobs = computed(() => jobsData.value?.jobs ?? [])
const totalJobs = computed(() => jobsData.value?.total ?? 0)

// Reset page on filter changes
watch([activeStatus, queueFilter], () => {
  currentPage.value = 1
})

// ─── Expandable rows ────────────────────────────────────
const expandedRowKeys = ref<Array<string | number>>([])

function handleExpandChange(keys: Array<string | number>) {
  expandedRowKeys.value = keys
}

// Queue filter options
const queueOptions = computed(() => [
  { label: t('queue.allQueues'), value: 'all' },
  { label: t('queue.aiTasks'), value: 'ai-tasks' },
  { label: t('queue.studioTasks'), value: 'studio-tasks' },
])

// Queue label map
const queueLabelMap: Record<string, { label: string; type: 'info' | 'success' }> = {
  'ai-tasks': { label: 'AI', type: 'info' },
  'studio-tasks': { label: 'Studio', type: 'success' },
}

function formatTime(ts: number | null): string {
  if (!ts) return '--'
  return new Date(ts).toLocaleString()
}

function extractIdentifier(data: Record<string, unknown>): string {
  return (data.taskId as string) ?? (data.messageId as string) ?? '--'
}

function extractToolProvider(data: Record<string, unknown>): string {
  return (data.toolSlug as string) ?? (data.provider as string) ?? '--'
}

// ─── Table columns ──────────────────────────────────────
const columns = computed<DataTableColumns<QueueJob>>(() => [
  {
    type: 'expand',
    renderExpand(row) {
      return h('div', { class: 'p-4' }, [
        h('p', { class: 'mb-2 text-sm font-medium text-muted-foreground' }, t('queue.jobData')),
        h(NCode, {
          code: JSON.stringify(row.data, null, 2),
          language: 'json',
          wordWrap: true,
        }),
      ])
    },
  },
  {
    title: t('queue.jobId'),
    key: 'id',
    width: 140,
    ellipsis: { tooltip: true },
    render(row) {
      const display = row.id.length > 16 ? row.id.substring(0, 16) + '...' : row.id
      return display
    },
  },
  {
    title: t('queue.queueName'),
    key: 'queue',
    width: 100,
    render(row) {
      const info = queueLabelMap[row.queue]
      if (info) {
        return h(NTag, { size: 'small', type: info.type, round: true }, { default: () => info.label })
      }
      return row.queue
    },
  },
  {
    title: t('common.status'),
    key: 'status',
    width: 100,
    render(row) {
      return h(StatusBadge, { status: row.status })
    },
  },
  {
    title: t('queue.taskId'),
    key: 'taskId',
    width: 140,
    ellipsis: { tooltip: true },
    render(row) {
      const val = extractIdentifier(row.data)
      if (val === '--') return val
      return val.length > 12 ? val.substring(0, 12) + '...' : val
    },
  },
  {
    title: t('queue.toolProvider'),
    key: 'toolProvider',
    width: 120,
    ellipsis: { tooltip: true },
    render(row) {
      return extractToolProvider(row.data)
    },
  },
  {
    title: t('queue.attempts'),
    key: 'attemptsMade',
    width: 80,
    align: 'center',
  },
  {
    title: t('queue.createdAt'),
    key: 'timestamp',
    width: 170,
    render(row) {
      return formatTime(row.timestamp)
    },
  },
  {
    title: t('queue.error'),
    key: 'failedReason',
    minWidth: 200,
    ellipsis: { tooltip: true },
    render(row) {
      return row.failedReason ?? '--'
    },
  },
])
</script>

<template>
  <div>
    <PageHeader :title="t('queue.title')" :description="t('queue.description')">
      <template #actions>
        <NButton :loading="isLoading" @click="() => refetch()">
          <template #icon>
            <NIcon><RefreshOutline /></NIcon>
          </template>
          {{ t('queue.refresh') }}
        </NButton>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <template v-else-if="isError">
      <n-card>
        <NEmpty :description="t('queue.notAvailable')" class="py-12">
          <template #extra>
            <p class="text-sm text-muted-foreground">
              {{ t('queue.notAvailableHint') }}
            </p>
          </template>
        </NEmpty>
      </n-card>

      <!-- Show placeholder stat cards -->
      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <n-card v-for="stat in stats" :key="stat.key" size="small">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg" :class="stat.bg">
              <NIcon :size="24" :class="stat.color">
                <component :is="stat.icon" />
              </NIcon>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
              <p class="text-xl font-bold text-foreground">--</p>
            </div>
          </div>
        </n-card>
      </div>
    </template>

    <template v-else>
      <!-- Clickable stat cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <n-card
          v-for="stat in stats"
          :key="stat.key"
          size="small"
          class="cursor-pointer transition-shadow hover:shadow-md"
          :class="activeStatus === stat.key ? `ring-2 ${stat.ring}` : ''"
          @click="selectStatus(stat.key)"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg" :class="stat.bg">
              <NIcon :size="24" :class="stat.color">
                <component :is="stat.icon" />
              </NIcon>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">{{ stat.label }}</p>
              <p class="text-xl font-bold text-foreground">{{ stat.value.toLocaleString() }}</p>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Job list section -->
      <div class="mt-6 space-y-4">
        <NTabs v-model:value="queueFilter" type="line" size="small">
          <NTabPane
            v-for="opt in queueOptions"
            :key="opt.value"
            :name="opt.value"
            :tab="opt.label"
          />
        </NTabs>

        <div v-if="jobsLoading" class="flex justify-center py-8">
          <NSpin size="medium" />
        </div>

        <div
          v-else-if="jobs.length === 0"
          class="rounded-lg border border-dashed p-8 text-center"
        >
          <NEmpty :description="t('queue.noJobs')" />
        </div>

        <template v-else>
          <div class="overflow-hidden rounded-md border">
            <NDataTable
              :columns="columns"
              :data="jobs"
              :bordered="false"
              :single-line="false"
              :expanded-row-keys="expandedRowKeys"
              :row-key="(row: QueueJob) => row.id"
              size="small"
              @update:expanded-row-keys="handleExpandChange"
            />
          </div>
          <div v-if="totalJobs > pageSize" class="flex justify-end">
            <NPagination
              v-model:page="currentPage"
              :page-size="pageSize"
              :item-count="totalJobs"
              show-quick-jumper
            />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
