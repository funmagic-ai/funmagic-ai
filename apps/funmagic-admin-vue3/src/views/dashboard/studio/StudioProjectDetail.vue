<script setup lang="ts">
import {
  NButton,
  NIcon,
  NSpin,
  NEmpty,
  NCard,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NImage,
  NAlert,
  NModal,
  NTabs,
  NTabPane,
  NCode,
} from 'naive-ui'
import { ArrowBackOutline, CodeSlashOutline } from '@vicons/ionicons5'
import { useQuery } from '@tanstack/vue-query'
import { useI18n } from 'vue-i18n'
import PageHeader from '@/components/shared/PageHeader.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const projectId = computed(() => route.params.id as string)

interface GenerationImage {
  storageKey: string
  type?: string
}

interface Generation {
  id: string
  projectId: string
  role: 'user' | 'assistant'
  content: string | null
  quotedImageIds: string[] | null
  provider: string | null
  model: string | null
  images: GenerationImage[] | null
  status: string
  error: string | null
  input: Record<string, unknown> | null
  rawRequest: unknown | null
  rawResponse: unknown | null
  createdAt: string
}

// Raw data dialog state
const showRawDataModal = ref(false)
const rawDataGeneration = ref<Generation | null>(null)

function openRawData(gen: Generation) {
  rawDataGeneration.value = gen
  showRawDataModal.value = true
}

function getOptionsEntries(gen: Generation): Array<[string, unknown]> {
  const options = gen.input?.options
  if (!options || typeof options !== 'object') return []
  return Object.entries(options as Record<string, unknown>).filter(([, v]) => v != null)
}

function hasRawData(gen: Generation): boolean {
  return gen.rawRequest != null || gen.rawResponse != null
}

interface ProjectDetail {
  project: {
    id: string
    title: string | null
    createdAt: string
    updatedAt: string
  }
  generations: Generation[]
}

const { data, isLoading, isError } = useQuery({
  queryKey: computed(() => ['admin', 'studio-projects', projectId.value]),
  queryFn: async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/studio/projects/${projectId.value}`,
      { credentials: 'include' },
    )
    if (!res.ok) throw new Error('Failed to fetch project')
    return res.json() as Promise<ProjectDetail>
  },
  enabled: computed(() => !!projectId.value),
})

const project = computed(() => data.value?.project ?? null)
const generations = computed(() => data.value?.generations ?? [])

const assistantGenerations = computed(() => generations.value.filter(g => g.role === 'assistant'))
const completedCount = computed(() => assistantGenerations.value.filter(g => g.status === 'completed').length)
const failedCount = computed(() => assistantGenerations.value.filter(g => g.status === 'failed').length)
const processingCount = computed(() => assistantGenerations.value.filter(g => g.status === 'processing' || g.status === 'pending').length)

// Fetch presigned URLs for images
const imageUrls = ref<Record<string, string>>({})

async function getImageUrl(storageKey: string) {
  if (imageUrls.value[storageKey]) return imageUrls.value[storageKey]
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/studio/assets/url?storageKey=${encodeURIComponent(storageKey)}`,
      { credentials: 'include' },
    )
    if (!res.ok) return null
    const data = await res.json()
    const url = data?.url
    if (url) {
      imageUrls.value[storageKey] = url
    }
    return url
  } catch {
    return null
  }
}

// Load images when data is available
watch(generations, async (gens) => {
  for (const gen of gens) {
    if (gen.images) {
      for (const img of gen.images) {
        if (img.storageKey && !imageUrls.value[img.storageKey]) {
          getImageUrl(img.storageKey)
        }
      }
    }
  }
}, { immediate: true })

// Find the user prompt that precedes an assistant generation
function getUserPrompt(assistantGen: Generation): string | null {
  const idx = generations.value.indexOf(assistantGen)
  if (idx <= 0) return null
  const prev = generations.value[idx - 1]
  return prev?.role === 'user' ? prev.content : null
}
</script>

<template>
  <div>
    <PageHeader :title="t('studio.projectDetail')">
      <template #actions>
        <NButton @click="router.push({ name: 'studio-projects' })">
          <template #icon>
            <NIcon><ArrowBackOutline /></NIcon>
          </template>
          {{ t('common.back') }}
        </NButton>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex justify-center py-12">
      <NSpin size="large" />
    </div>

    <div v-else-if="isError || !project" class="rounded-lg border border-dashed p-8 text-center md:p-12">
      <NEmpty :description="t('studio.loadFailed')" />
    </div>

    <div v-else class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('studio.project') }}</div>
          <div class="mt-1 text-lg font-semibold truncate">{{ project.title || t('studio.untitledProject') }}</div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('tasks.completed') }}</div>
          <div class="mt-1 text-lg font-semibold text-green-600">{{ completedCount }}</div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('tasks.processing') }}</div>
          <div class="mt-1 text-lg font-semibold text-blue-600">{{ processingCount }}</div>
        </NCard>
        <NCard size="small">
          <div class="text-sm text-gray-500">{{ t('tasks.failed') }}</div>
          <div class="mt-1 text-lg font-semibold text-red-600">{{ failedCount }}</div>
        </NCard>
      </div>

      <!-- Project Info -->
      <NCard :title="t('studio.projectInfo')" size="small">
        <NDescriptions label-placement="left" :column="2" bordered>
          <NDescriptionsItem :label="t('common.id')">
            {{ project.id }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('common.createdAt')">
            {{ new Date(project.createdAt).toLocaleString() }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('studio.lastActivity')">
            {{ new Date(project.updatedAt).toLocaleString() }}
          </NDescriptionsItem>
          <NDescriptionsItem :label="t('studio.generationCount')">
            {{ generations.length }} total / {{ assistantGenerations.length }} {{ t('studio.generations').toLowerCase() }}
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- Generations Accordion -->
      <NCard :title="t('studio.generations')" size="small">
        <NCollapse v-if="assistantGenerations.length > 0">
          <NCollapseItem
            v-for="(gen, idx) in assistantGenerations"
            :key="gen.id"
            :name="gen.id"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium">#{{ idx + 1 }}</span>
                <StatusBadge :status="gen.status" />
                <span v-if="gen.provider" class="text-xs text-gray-500">
                  {{ gen.provider }}{{ gen.model ? ` / ${gen.model}` : '' }}
                </span>
                <NButton
                  v-if="hasRawData(gen)"
                  size="tiny"
                  quaternary
                  @click.stop="openRawData(gen)"
                >
                  <template #icon>
                    <NIcon size="14"><CodeSlashOutline /></NIcon>
                  </template>
                  {{ t('studio.rawData') }}
                </NButton>
                <span class="text-xs text-gray-400 ml-auto">
                  {{ new Date(gen.createdAt).toLocaleString() }}
                </span>
              </div>
            </template>

            <div class="space-y-4">
              <!-- User prompt -->
              <div v-if="getUserPrompt(gen)">
                <div class="text-xs font-medium text-gray-500 mb-1">{{ t('studio.input') }}</div>
                <div class="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm whitespace-pre-wrap">
                  {{ getUserPrompt(gen) }}
                </div>
              </div>

              <!-- Provider / Model -->
              <NDescriptions v-if="gen.provider" label-placement="left" :column="2" size="small" bordered>
                <NDescriptionsItem :label="t('studio.provider')">
                  {{ gen.provider }}
                </NDescriptionsItem>
                <NDescriptionsItem :label="t('studio.model')">
                  {{ gen.model || '--' }}
                </NDescriptionsItem>
              </NDescriptions>

              <!-- Options -->
              <div v-if="getOptionsEntries(gen).length > 0">
                <div class="text-xs font-medium text-gray-500 mb-1">{{ t('studio.generationOptions') }}</div>
                <NDescriptions label-placement="left" :column="2" size="small" bordered>
                  <NDescriptionsItem v-for="[key, val] in getOptionsEntries(gen)" :key="key" :label="key">
                    {{ val }}
                  </NDescriptionsItem>
                </NDescriptions>
              </div>

              <!-- Response -->
              <div v-if="gen.content">
                <div class="text-xs font-medium text-gray-500 mb-1">{{ t('studio.response') }}</div>
                <div class="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm whitespace-pre-wrap">
                  {{ gen.content }}
                </div>
              </div>

              <!-- Images -->
              <div v-if="gen.images && gen.images.length > 0">
                <div class="text-xs font-medium text-gray-500 mb-1">{{ t('studio.images') }} ({{ gen.images.length }})</div>
                <div class="flex flex-wrap gap-2">
                  <div v-for="(img, imgIdx) in gen.images" :key="imgIdx" class="w-32 h-32 rounded border overflow-hidden">
                    <NImage
                      v-if="imageUrls[img.storageKey]"
                      :src="imageUrls[img.storageKey]"
                      object-fit="cover"
                      class="w-full h-full"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-400 bg-gray-100 dark:bg-gray-800">
                      {{ t('common.loading') }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error -->
              <NAlert v-if="gen.error" type="error" :title="t('studio.error')">
                {{ gen.error }}
              </NAlert>
            </div>
          </NCollapseItem>
        </NCollapse>
        <NEmpty v-else :description="t('studio.noGenerations')" />
      </NCard>
    </div>

    <!-- Raw Data Modal -->
    <NModal
      v-model:show="showRawDataModal"
      preset="card"
      :title="t('studio.rawData')"
      style="width: 720px; max-width: 90vw;"
      :mask-closable="true"
    >
      <NTabs v-if="rawDataGeneration" type="line">
        <NTabPane :name="t('studio.rawRequest')" :tab="t('studio.rawRequest')">
          <NCode
            v-if="rawDataGeneration.rawRequest"
            :code="JSON.stringify(rawDataGeneration.rawRequest, null, 2)"
            language="json"
            word-wrap
          />
          <NEmpty v-else description="No request data" />
        </NTabPane>
        <NTabPane :name="t('studio.rawResponse')" :tab="t('studio.rawResponse')">
          <NCode
            v-if="rawDataGeneration.rawResponse"
            :code="JSON.stringify(rawDataGeneration.rawResponse, null, 2)"
            language="json"
            word-wrap
          />
          <NEmpty v-else description="No response data" />
        </NTabPane>
      </NTabs>
    </NModal>
  </div>
</template>
