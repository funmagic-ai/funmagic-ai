<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
const route = useRoute()
const dialog = useDialog()
const message = useMessage()
const queryClient = useQueryClient()

const locale = computed(() => (route.params.locale as string) || 'en')

const currentPage = ref(1)
const pageSize = 12

const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['user-assets', currentPage],
  queryFn: async () => {
    const { data } = await api.GET('/api/assets', {
      params: {
        query: {
          limit: pageSize,
          offset: (currentPage.value - 1) * pageSize,
        },
      },
    })
    return data
  },
})

const assets = computed(() => data.value?.assets ?? [])
const pagination = computed(() => data.value?.pagination)
const totalPages = computed(() => {
  if (!pagination.value) return 1
  return Math.ceil(pagination.value.total / pageSize)
})

// Delete mutation
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await api.DELETE('/api/assets/{id}', {
      params: { path: { id } },
    })
    if (error) throw new Error(error.error)
  },
  onSuccess: () => {
    message.success(t('assets.deleted'))
    queryClient.invalidateQueries({ queryKey: ['user-assets'] })
  },
  onError: (err: Error) => {
    message.error(err.message || t('assets.deleteFailed'))
  },
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

async function handleDownload(id: string, filename: string) {
  try {
    const { data, error } = await api.GET('/api/assets/{id}/url', {
      params: { path: { id } },
    })
    if (error) {
      message.error(t('assets.downloadUrlFailed'))
      return
    }
    if (data?.url) {
      const link = document.createElement('a')
      link.href = data.url
      link.download = filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch {
    message.error(t('assets.downloadFailed'))
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(mimeType: string) {
  return mimeType.startsWith('image/')
}
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-foreground mb-8">{{ t('assets.title') }}</h1>

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
      <div v-else-if="assets.length === 0" class="flex flex-col items-center justify-center py-20">
        <n-icon :size="64" class="text-muted-foreground/30 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
        </n-icon>
        <p class="text-lg text-muted-foreground">{{ t('assets.noAssets') }}</p>
      </div>

      <!-- Assets Grid -->
      <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <n-card
          v-for="asset in assets"
          :key="asset.id"
          class="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30"
        >
          <template #cover>
            <div
              v-if="isImage(asset.mimeType)"
              class="flex h-40 items-center justify-center bg-muted/50 overflow-hidden"
            >
              <n-icon :size="48" class="text-muted-foreground/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </n-icon>
            </div>
            <div
              v-else
              class="flex h-40 items-center justify-center bg-muted/50"
            >
              <n-icon :size="48" class="text-muted-foreground/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
              </n-icon>
            </div>
          </template>

          <div class="space-y-2">
            <p class="text-sm font-medium text-foreground truncate" :title="asset.filename">
              {{ asset.filename }}
            </p>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ formatFileSize(asset.size) }}</span>
              <span>{{ formatDate(asset.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-2 pt-2">
              <n-button
                size="small"
                type="primary"
                secondary
                @click="handleDownload(asset.id, asset.filename)"
              >
                {{ t('tools.download') }}
              </n-button>
              <n-button
                size="small"
                type="error"
                quaternary
                @click="handleDelete(asset.id)"
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
