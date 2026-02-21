<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import { extractApiError } from '@/lib/api-error'
import { useApiError } from '@/composables/useApiError'
import { subscribeToTask } from '@/composables/useUserStream'
import AppLayout from '@/components/layout/AppLayout.vue'

interface TaskItem {
  id: string
  status: string
  toolTypeName: string
  toolSlug: string
  toolTitle: string
  thumbnailUrl: string | null
  outputAssetId: string | null
  creditsCost: number
  createdAt: string
  completedAt: string | null
}

interface CategoryInfo {
  id: string
  name: string
  title: string
  count: number
}

interface TasksResponse {
  tasks: TaskItem[]
  pagination: { total: number; limit: number; offset: number }
  totalCount: number
  categories: CategoryInfo[]
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()
const { handleError } = useApiError()
const queryClient = useQueryClient()

const locale = computed(() => (route.params.locale as string) || 'en')

// Tab & pagination state
const activeTab = ref('')  // empty = all
const currentPage = ref(1)
const pageSize = 12

// Reset page when tab changes
watch(activeTab, () => {
  currentPage.value = 1
})

// Tasks query with polling fallback for active tasks
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['user-tasks', currentPage, activeTab],
  queryFn: async () => {
    const query: Record<string, unknown> = {
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
      locale: locale.value,
    }
    if (activeTab.value) {
      query.category = activeTab.value
    }
    const { data } = await api.GET('/api/tasks', {
      params: { query: query as any },
    })
    return data as unknown as TasksResponse
  },
  refetchInterval: (query) => {
    const list = (query.state.data as TasksResponse | undefined)?.tasks ?? []
    return list.some(t => ['pending', 'queued', 'processing'].includes(t.status)) ? 30000 : false
  },
})

const tasks = computed(() => data.value?.tasks ?? [])
const pagination = computed(() => data.value?.pagination)
const totalCount = computed(() => data.value?.totalCount ?? 0)
const categories = computed(() => data.value?.categories ?? [])
const totalPages = computed(() => {
  if (!pagination.value) return 1
  return Math.ceil(pagination.value.total / pageSize)
})

// Subscribe to SSE for active tasks — instant list refresh on completion/failure
const activeUnsubscribes = ref<Map<string, () => void>>(new Map())

function syncSubscriptions(taskList: TaskItem[]) {
  const activeIds = new Set(
    taskList
      .filter(t => ['pending', 'queued', 'processing'].includes(t.status))
      .map(t => t.id)
  )

  // Unsubscribe from tasks no longer active
  for (const [id, unsub] of activeUnsubscribes.value) {
    if (!activeIds.has(id)) {
      unsub()
      activeUnsubscribes.value.delete(id)
    }
  }

  // Subscribe to newly active tasks
  for (const id of activeIds) {
    if (activeUnsubscribes.value.has(id)) continue
    const unsub = subscribeToTask(id, (event) => {
      const type = event.type as string
      if (type === 'completed' || type === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['user-tasks'] })
        const u = activeUnsubscribes.value.get(id)
        if (u) {
          u()
          activeUnsubscribes.value.delete(id)
        }
      }
    })
    activeUnsubscribes.value.set(id, unsub)
  }
}

watch(tasks, (list) => syncSubscriptions(list), { immediate: true })

onUnmounted(() => {
  for (const [, unsub] of activeUnsubscribes.value) {
    unsub()
  }
  activeUnsubscribes.value.clear()
})

// Delete mutation (now uses tasks endpoint)
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error, response } = await api.DELETE('/api/tasks/{taskId}', {
      params: { path: { taskId: id } },
    })
    if (error) throw extractApiError(error, response)
  },
  onSuccess: () => {
    message.success(t('assets.deleted'))
    queryClient.invalidateQueries({ queryKey: ['user-tasks'] })
  },
  onError: handleError,
})

function handleDelete(id: string) {
  dialog.warning({
    title: t('common.confirm'),
    content: t('assets.deleteConfirm'),
    positiveText: t('common.delete'),
    negativeText: t('common.cancel'),
    onPositiveClick: () => {
      deleteMutation.mutate(id)
    },
  })
}

async function handleDownload(outputAssetId: string) {
  try {
    const { data, error } = await api.GET('/api/assets/{id}/url', {
      params: { path: { id: outputAssetId } },
    })
    if (error) {
      message.error(t('assets.downloadUrlFailed'))
      return
    }
    if (data?.url) {
      const link = document.createElement('a')
      link.href = data.url
      link.download = ''
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch {
    message.error(t('assets.downloadFailed'))
  }
}

function openDetail(task: TaskItem) {
  const base = locale.value ? `/${locale.value}` : ''
  router.push(`${base}/tools/${task.toolSlug}?taskId=${task.id}`)
}

// Status helpers
function isProcessing(task: { status: string }) {
  return ['pending', 'queued', 'processing'].includes(task.status)
}

function isActionRequired(task: { status: string }) {
  return task.status === 'action_required'
}

function isFailed(task: { status: string }) {
  return task.status === 'failed'
}

function isCompleted(task: { status: string }) {
  return task.status === 'completed'
}

// Category helpers
const badgeColors = [
  'bg-blue-500/80',
  'bg-purple-500/80',
  'bg-emerald-500/80',
  'bg-amber-500/80',
  'bg-rose-500/80',
  'bg-cyan-500/80',
]

function getCategoryLabel(toolTypeName: string) {
  const cat = categories.value.find(c => c.name === toolTypeName)
  return cat?.title ?? toolTypeName
}

function getCategoryBadgeClass(toolTypeName: string) {
  const idx = categories.value.findIndex(c => c.name === toolTypeName)
  return idx >= 0 ? badgeColors[idx % badgeColors.length] : 'bg-zinc-500/80'
}

function getStatusLabel(status: string) {
  const key = `assets.status.${status}` as const
  return t(key)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-foreground mb-6">{{ t('assets.title') }}</h1>

      <!-- Category Filter -->
      <div v-if="categories.length > 0" class="mb-6">
        <n-space>
          <n-button
            :type="!activeTab ? 'primary' : 'default'"
            :secondary="!!activeTab"
            size="small"
            @click="activeTab = ''"
          >
            {{ t('assets.tabs.all') }} ({{ totalCount }})
          </n-button>
          <n-button
            v-for="cat in categories"
            :key="cat.id"
            :type="activeTab === cat.name ? 'primary' : 'default'"
            :secondary="activeTab !== cat.name"
            size="small"
            @click="activeTab = cat.name"
          >
            {{ cat.title }} ({{ cat.count }})
          </n-button>
        </n-space>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <n-card v-for="i in 8" :key="i">
          <n-skeleton height="160px" />
          <template #footer>
            <n-skeleton text />
          </template>
        </n-card>
      </div>

      <!-- Error State -->
      <div v-else-if="isError" class="flex flex-col items-center justify-center py-20">
        <p class="text-muted-foreground mb-4">{{ t('common.error') }}</p>
        <n-button type="primary" @click="() => refetch()">{{ t('common.retry') }}</n-button>
      </div>

      <!-- Empty State -->
      <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center py-20">
        <n-icon :size="64" class="text-muted-foreground/30 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </n-icon>
        <p class="text-lg text-muted-foreground">{{ t('assets.noAssets') }}</p>
      </div>

      <!-- Tasks Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <n-card
          v-for="task in tasks"
          :key="task.id"
          class="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30"
        >
          <template #cover>
            <div
              class="relative aspect-[4/3] overflow-hidden bg-muted/50 cursor-pointer"
              @click="openDetail(task)"
            >
              <!-- Actual thumbnail -->
              <img
                v-if="task.thumbnailUrl"
                :src="task.thumbnailUrl"
                :alt="task.toolTitle"
                loading="lazy"
                class="h-full w-full object-cover"
              />
              <!-- Fallback icon -->
              <div v-else class="flex h-full items-center justify-center">
                <n-icon :size="48" class="text-muted-foreground/30">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                </n-icon>
              </div>

              <!-- Processing overlay -->
              <div
                v-if="isProcessing(task)"
                class="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              >
                <n-spin size="large" stroke="#fff" />
              </div>

              <!-- Category badge (top-left) -->
              <span
                class="absolute top-2 left-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                :class="getCategoryBadgeClass(task.toolTypeName)"
              >
                {{ getCategoryLabel(task.toolTypeName) }}
              </span>

              <!-- Status badge (top-right) -->
              <span
                v-if="!isCompleted(task)"
                class="absolute top-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                :class="{
                  'bg-blue-500 animate-pulse': isProcessing(task),
                  'bg-amber-500': isActionRequired(task),
                  'bg-red-500': isFailed(task),
                }"
              >
                {{ getStatusLabel(task.status) }}
              </span>

              <!-- Tool name (bottom-right) -->
              <span class="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/80">
                {{ task.toolTitle }}
              </span>
            </div>
          </template>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ t('assets.credits', { n: task.creditsCost }) }}</span>
              <span>{{ formatDate(task.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-2">
              <n-button
                v-if="isCompleted(task) && task.outputAssetId"
                size="small"
                type="primary"
                secondary
                @click.stop="handleDownload(task.outputAssetId!)"
              >
                {{ t('tools.download') }}
              </n-button>
              <n-button
                size="small"
                type="error"
                quaternary
                @click.stop="handleDelete(task.id)"
              >
                {{ t('common.delete') }}
              </n-button>
            </div>
          </div>
        </n-card>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="mt-10 flex justify-center">
        <n-pagination
          v-model:page="currentPage"
          :page-count="totalPages"
        />
      </div>
    </div>

  </AppLayout>
</template>
