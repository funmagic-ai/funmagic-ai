<script setup lang="ts">
import {
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NCode,
  NSpin,
  NEmpty,
  NIcon,
  NDataTable,
  NTag,
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import { ArrowBackOutline, RefreshOutline, TrashOutline } from '@vicons/ionicons5'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import DeleteConfirmDialog from '@/components/shared/DeleteConfirmDialog.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const message = useMessage()
const queryClient = useQueryClient()
const authStore = useAuthStore()

const taskId = computed(() => route.params.id as string)

// Fetch task detail
const {
  data: taskData,
  isLoading,
  isError,
  refetch,
} = useQuery({
  queryKey: computed(() => ['task', taskId.value]),
  queryFn: async () => {
    const { data, error } = await api.GET('/api/tasks/{taskId}', {
      params: { path: { taskId: taskId.value } },
    })
    if (error) throw new Error('Failed to fetch task')
    return data
  },
  enabled: computed(() => !!taskId.value),
})

const task = computed(() => taskData.value?.task ?? null)
const isFailed = computed(() => task.value?.status === 'failed')
const parentTaskId = computed(() => (task.value as Record<string, unknown> | null)?.parentTaskId as string | null)

// Fetch child tasks
const { data: childData, isLoading: childrenLoading } = useQuery({
  queryKey: computed(() => ['admin', 'tasks', 'children', taskId.value]),
  queryFn: async () => {
    const { data, error } = await api.GET('/api/admin/tasks', {
      params: {
        query: {
          parentTaskId: taskId.value,
          limit: '50',
        },
      },
    })
    if (error) throw new Error('Failed to fetch child tasks')
    return data
  },
  enabled: computed(() => !!taskId.value),
})

const childTasks = computed(() => childData.value?.tasks ?? [])

// Format JSON for display
function formatJson(data: unknown): string {
  if (data === null || data === undefined) return 'null'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

// Retry mutation -- re-create the task with same input
const retryMutation = useMutation({
  mutationFn: async () => {
    if (!task.value?.payload?.input) {
      throw new Error('No input data available for retry')
    }
    message.info('Retry functionality requires a dedicated admin endpoint')
    throw new Error('Retry endpoint not implemented')
  },
  onError: (err: Error) => {
    message.warning(err.message)
  },
})

function handleRetry() {
  retryMutation.mutate()
}

// Delete task
const showDeleteDialog = ref(false)

const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await api.DELETE('/api/admin/tasks/{id}', {
      params: { path: { id } },
    })
    if (error) throw new Error((error as any).error ?? 'Failed to delete task')
  },
  onSuccess: () => {
    message.success(t('common.deleteSuccess'))
    showDeleteDialog.value = false
    queryClient.invalidateQueries({ queryKey: ['admin', 'tasks'] })
    router.push({ name: 'tasks' })
  },
  onError: (err: Error) => {
    message.error(err.message)
  },
})

function confirmDelete() {
  deleteMutation.mutate(taskId.value)
}

function navigateToTask(id: string) {
  router.push({ name: 'tasks-detail', params: { id } })
}

// Child tasks table columns
const childColumns = computed<DataTableColumns>(() => [
  {
    title: t('tasks.taskId'),
    key: 'id',
    width: 120,
    ellipsis: { tooltip: true },
    render(row: any) {
      return row.id.substring(0, 8) + '...'
    },
  },
  {
    title: t('tasks.status'),
    key: 'status',
    width: 120,
    render(row: any) {
      return h(StatusBadge, { status: row.status })
    },
  },
  {
    title: t('tasks.tool'),
    key: 'tool',
    render(row: any) {
      return row.tool?.title ?? '--'
    },
  },
  {
    title: t('users.credits'),
    key: 'creditsCost',
    width: 80,
  },
  {
    title: t('common.createdAt'),
    key: 'createdAt',
    width: 160,
    render(row: any) {
      return new Date(row.createdAt).toLocaleString()
    },
  },
])
</script>

<template>
  <div>
    <PageHeader :title="`Task ${task?.id?.substring(0, 8) ?? ''}...`">
      <template #actions>
        <NButton quaternary @click="router.back()">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
        <NButton
          v-if="isFailed"
          type="warning"
          ghost
          :loading="retryMutation.isPending.value"
          @click="handleRetry"
        >
          <template #icon>
            <NIcon><RefreshOutline /></NIcon>
          </template>
          {{ t('tasks.retryTask') }}
        </NButton>
        <NButton
          v-if="authStore.isAdmin"
          type="error"
          ghost
          @click="showDeleteDialog = true"
        >
          <template #icon>
            <NIcon><TrashOutline /></NIcon>
          </template>
          {{ t('common.delete') }}
        </NButton>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <!-- Error -->
    <div v-else-if="isError" class="py-12 text-center">
      <NEmpty :description="t('tasks.taskNotFound')">
        <template #extra>
          <NButton @click="() => refetch()">{{ t('common.retry') }}</NButton>
        </template>
      </NEmpty>
    </div>

    <!-- Content -->
    <template v-else-if="task">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Task Info -->
        <NCard :title="t('tasks.taskInformation')" size="small">
          <NDescriptions label-placement="left" :column="1" bordered>
            <NDescriptionsItem :label="t('tasks.taskId')">
              <code class="text-xs">{{ task.id }}</code>
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('tasks.user')">
              <code class="text-xs">{{ task.userId }}</code>
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('tasks.tool')">
              <code class="text-xs">{{ task.toolId }}</code>
            </NDescriptionsItem>
            <NDescriptionsItem v-if="parentTaskId" :label="t('tasks.parentTask')">
              <NTag
                type="info"
                size="small"
                class="cursor-pointer"
                @click="navigateToTask(parentTaskId!)"
              >
                {{ parentTaskId.substring(0, 8) }}...
              </NTag>
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('tasks.status')">
              <StatusBadge :status="task.status" />
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('tasks.creditsCost')">
              {{ task.creditsCost ?? '--' }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('common.createdAt')">
              {{ new Date(task.createdAt).toLocaleString() }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="t('common.updatedAt')">
              {{ new Date(task.updatedAt).toLocaleString() }}
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>

        <!-- Timestamps -->
        <NCard :title="t('common.timeline')" size="small">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="h-3 w-3 rounded-full bg-blue-500" />
              <div>
                <div class="text-sm font-medium text-foreground">{{ t('common.created') }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ new Date(task.createdAt).toLocaleString() }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div
                class="h-3 w-3 rounded-full"
                :class="task.status === 'completed' ? 'bg-green-500' : task.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'"
              />
              <div>
                <div class="text-sm font-medium text-foreground">
                  {{ task.status.charAt(0).toUpperCase() + task.status.slice(1) }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ new Date(task.updatedAt).toLocaleString() }}
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </div>

      <!-- Child Tasks -->
      <NCard v-if="childTasks.length > 0 || childrenLoading" :title="t('tasks.childTasks')" size="small" class="mt-6">
        <div v-if="childrenLoading" class="flex justify-center py-4">
          <NSpin size="small" />
        </div>
        <NDataTable
          v-else-if="childTasks.length > 0"
          :columns="childColumns"
          :data="childTasks"
          :bordered="false"
          :single-line="false"
          size="small"
          :row-props="(row: any) => ({ style: 'cursor: pointer;', onClick: () => navigateToTask(row.id) })"
        />
        <NEmpty
          v-else
          :description="t('tasks.noChildTasks')"
          class="py-4"
        />
      </NCard>

      <!-- Input Data -->
      <NCard :title="t('tasks.input')" size="small" class="mt-6">
        <NEmpty
          v-if="!task.payload?.input"
          :description="t('tasks.noInputData')"
          class="py-6"
        />
        <NCode
          v-else
          :code="formatJson(task.payload.input)"
          language="json"
          word-wrap
        />
      </NCard>

      <!-- Output Data -->
      <NCard :title="t('tasks.output')" size="small" class="mt-6">
        <NEmpty
          v-if="!task.payload?.output"
          :description="t('tasks.noOutputData')"
          class="py-6"
        />
        <NCode
          v-else
          :code="formatJson(task.payload.output)"
          language="json"
          word-wrap
        />
      </NCard>
    </template>

    <DeleteConfirmDialog
      v-model:show="showDeleteDialog"
      :title="`Delete task &quot;${task?.id?.substring(0, 8) ?? ''}&quot;?`"
      :message="t('common.deleteConfirm')"
      :loading="deleteMutation.isPending.value"
      @confirm="confirmDelete"
    />
  </div>
</template>
