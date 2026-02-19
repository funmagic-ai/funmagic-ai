<script setup lang="ts">
import { NImage, NTag, NSpin, NEmpty, NIcon, NTooltip, NButton } from 'naive-ui'
import { DownloadOutline, WarningOutline, CheckmarkCircle, PersonOutline, ColorWandOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Reactive timer for elapsed time on pending cards
const now = ref(Date.now())
let timerHandle: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timerHandle = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timerHandle) clearInterval(timerHandle)
})

function getElapsedSeconds(createdAt: string): number {
  return Math.floor((now.value - new Date(createdAt).getTime()) / 1000)
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function displayError(raw: string | null | undefined): string {
  if (!raw) return t('errors.fallback')
  const key = `errors.${raw}`
  const resolved = t(key)
  return resolved !== key ? resolved : t('errors.fallback')
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

interface StudioImage {
  storageKey: string
  type?: string
}

interface Generation {
  id: string
  role: 'user' | 'assistant'
  content: string | null
  quotedImageIds?: string[] | null
  provider: string | null
  model: string | null
  images: StudioImage[] | null
  status: string
  error: string | null
  createdAt: string
}

interface Round {
  user: Generation | null
  assistant: Generation | null
}

const props = defineProps<{
  generations: Generation[]
  isLoading: boolean
  quotedIds: string[]
}>()

const emit = defineEmits<{
  quote: [generationId: string]
  unquote: [generationId: string]
}>()

// Resolve quoted generation IDs to their images
function getQuotedImages(quotedIds: string[]): StudioImage[] {
  const images: StudioImage[] = []
  for (const genId of quotedIds) {
    const gen = props.generations.find(g => g.id === genId)
    if (gen?.images) {
      for (const img of gen.images) {
        images.push(img)
      }
    }
  }
  return images
}

// Group generations into rounds (user + assistant pairs)
// API returns DESC order (newest first), so reverse to chronological (oldest first)
const rounds = computed<Round[]>(() => {
  const result: Round[] = []
  const gens = [...props.generations].reverse()

  let i = 0
  while (i < gens.length) {
    const gen = gens[i]
    if (gen.role === 'user') {
      const next = gens[i + 1]
      if (next && next.role === 'assistant') {
        result.push({ user: gen, assistant: next })
        i += 2
      } else {
        result.push({ user: gen, assistant: null })
        i++
      }
    } else {
      // assistant without a preceding user (orphan)
      result.push({ user: null, assistant: gen })
      i++
    }
  }

  return result
})

// Resolve presigned URLs for display
const resolvedUrls = ref<Record<string, string>>({})

async function resolveImageUrl(storageKey: string) {
  if (resolvedUrls.value[storageKey]) return
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/admin/studio/assets/url?storageKey=${encodeURIComponent(storageKey)}`,
      { credentials: 'include' },
    )
    if (!res.ok) return
    const data = await res.json()
    if (data.url) {
      resolvedUrls.value[storageKey] = data.url
    }
  } catch {
    // ignore
  }
}

// Resolve URLs whenever generations change
watch(() => props.generations, (gens) => {
  for (const gen of gens) {
    if (gen.images) {
      for (const img of gen.images) {
        if (img.storageKey && !resolvedUrls.value[img.storageKey]) {
          resolveImageUrl(img.storageKey)
        }
      }
    }
  }
}, { immediate: true })

async function downloadImage(storageKey: string) {
  const url = resolvedUrls.value[storageKey]
  if (!url) return

  try {
    // Fetch as blob so the download attribute works (cross-origin URLs ignore it)
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = storageKey.split('/').pop() || 'image.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch {
    // Fallback: open in new tab
    window.open(url, '_blank')
  }
}

function isQuoted(genId: string): boolean {
  return props.quotedIds.includes(genId)
}

function toggleQuote(genId: string) {
  if (isQuoted(genId)) {
    emit('unquote', genId)
  } else {
    emit('quote', genId)
  }
}

// Auto-scroll to bottom on new rounds
const containerRef = ref<HTMLElement | null>(null)

watch(() => rounds.value.length, () => {
  nextTick(() => {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  })
})
</script>

<template>
  <div
    ref="containerRef"
    class="flex flex-1 flex-col overflow-y-auto rounded-lg border border-border bg-muted/10 p-4"
  >
    <div v-if="isLoading" class="flex flex-1 items-center justify-center">
      <NSpin size="large" />
    </div>

    <div
      v-else-if="rounds.length === 0"
      class="flex flex-1 items-center justify-center"
    >
      <NEmpty :description="t('studio.noGenerations')" />
    </div>

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="(round, idx) in rounds"
        :key="idx"
        class="rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
      >
        <!-- User prompt section -->
        <div
          v-if="round.user"
          class="flex items-start gap-3 border-b border-border px-4 py-3"
        >
          <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <NIcon :size="16"><PersonOutline /></NIcon>
          </div>
          <div class="min-w-0 flex-1">
            <div class="mb-1 flex items-center gap-2">
              <span class="text-sm font-medium text-foreground">{{ t('studio.you') }}</span>
              <span class="text-xs text-muted-foreground">{{ formatTime(round.user.createdAt) }}</span>
            </div>
            <p class="whitespace-pre-wrap text-sm text-foreground/90">{{ round.user.content }}</p>

            <!-- Uploaded images -->
            <div
              v-if="round.user.images && round.user.images.length > 0"
              class="mt-2 flex flex-wrap gap-2"
            >
              <div
                v-for="(img, imgIdx) in round.user.images"
                :key="`upload-${round.user.id}-${imgIdx}`"
                class="relative h-20 w-20 overflow-hidden rounded-md border border-border bg-muted/20"
              >
                <NImage
                  v-if="resolvedUrls[img.storageKey]"
                  :src="resolvedUrls[img.storageKey]"
                  object-fit="contain"
                  class="h-full w-full"
                  lazy
                  :alt="`Uploaded image ${imgIdx + 1}`"
                />
                <div v-else class="flex h-full w-full items-center justify-center">
                  <NSpin :size="16" />
                </div>
              </div>
            </div>

            <!-- Quoted images -->
            <div
              v-if="round.user.quotedImageIds && round.user.quotedImageIds.length > 0"
              class="mt-2"
            >
              <span class="mb-1 block text-xs text-muted-foreground">{{ t('studio.quotedImages') }}</span>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="(img, imgIdx) in getQuotedImages(round.user.quotedImageIds)"
                  :key="`quoted-${round.user.id}-${imgIdx}`"
                  class="relative h-20 w-20 overflow-hidden rounded-md border border-primary/30 bg-muted/20"
                >
                  <NImage
                    v-if="resolvedUrls[img.storageKey]"
                    :src="resolvedUrls[img.storageKey]"
                    object-fit="contain"
                    class="h-full w-full"
                    lazy
                    :alt="`Quoted image ${imgIdx + 1}`"
                  />
                  <div v-else class="flex h-full w-full items-center justify-center">
                    <NSpin :size="16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assistant response section -->
        <div
          v-if="round.assistant"
          class="px-4 py-3"
        >
          <div class="flex items-start gap-3">
            <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent-foreground">
              <NIcon :size="16"><ColorWandOutline /></NIcon>
            </div>
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-foreground">{{ t('studio.assistant') }}</span>
                <NTag v-if="round.assistant.provider" size="tiny" :bordered="false">
                  {{ round.assistant.provider }}{{ round.assistant.model ? ` / ${round.assistant.model}` : '' }}
                </NTag>
                <NTag
                  v-if="round.assistant.status === 'pending' || round.assistant.status === 'processing'"
                  :type="round.assistant.status === 'processing' ? 'info' : 'warning'"
                  size="tiny"
                >
                  {{ round.assistant.status }}
                </NTag>
                <NTag v-else-if="round.assistant.status === 'failed'" type="error" size="tiny">
                  {{ t('tasks.failed') }}
                </NTag>
                <span class="text-xs text-muted-foreground">{{ formatTime(round.assistant.createdAt) }}</span>
              </div>

              <!-- Pending / Processing state -->
              <div
                v-if="round.assistant.status === 'pending' || round.assistant.status === 'processing'"
                class="flex items-center gap-3 rounded-md bg-muted/50 px-3 py-4"
              >
                <NSpin size="small" />
                <span class="text-sm text-muted-foreground">
                  {{ formatElapsed(getElapsedSeconds(round.assistant.createdAt)) }}
                </span>
                <NTooltip v-if="getElapsedSeconds(round.assistant.createdAt) > 120">
                  <template #trigger>
                    <NIcon size="18" color="#f0a020" class="cursor-pointer">
                      <WarningOutline />
                    </NIcon>
                  </template>
                  {{ t('studio.workerNotRunning') }} — {{ t('studio.workerHint') }}
                </NTooltip>
              </div>

              <!-- Failed state -->
              <div
                v-else-if="round.assistant.status === 'failed'"
                class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-3"
              >
                <p class="text-sm text-destructive">{{ displayError(round.assistant.error) }}</p>
              </div>

              <!-- Completed: text content -->
              <div v-else>
                <p
                  v-if="round.assistant.content"
                  class="mb-3 whitespace-pre-wrap text-sm text-foreground/90"
                >
                  {{ round.assistant.content }}
                </p>

                <!-- Completed: image grid -->
                <div
                  v-if="round.assistant.images && round.assistant.images.length > 0"
                  class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
                >
                  <div
                    v-for="(img, imgIdx) in round.assistant.images"
                    :key="`${round.assistant.id}-${imgIdx}`"
                    class="group relative aspect-square overflow-hidden rounded-lg border-2 bg-muted/20 transition-all"
                    :class="isQuoted(round.assistant.id) ? 'border-primary shadow-md' : 'border-border hover:border-muted-foreground/30'"
                  >
                    <!-- Image with preview (click image to preview) -->
                    <NImage
                      v-if="resolvedUrls[img.storageKey]"
                      :src="resolvedUrls[img.storageKey]"
                      object-fit="contain"
                      class="h-full w-full"
                      lazy
                      :alt="`Generated image ${imgIdx + 1}`"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center bg-muted/30">
                      <NSpin size="small" />
                    </div>

                    <!-- Hover action buttons (top-right) -->
                    <div class="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <!-- Quote/unquote button -->
                      <NTooltip>
                        <template #trigger>
                          <NButton
                            size="tiny"
                            :type="isQuoted(round.assistant!.id) ? 'primary' : 'default'"
                            circle
                            class="shadow-sm"
                            @click.stop="toggleQuote(round.assistant!.id)"
                          >
                            <template #icon>
                              <NIcon :size="14"><CheckmarkCircle /></NIcon>
                            </template>
                          </NButton>
                        </template>
                        {{ t('studio.clickToQuote') }}
                      </NTooltip>
                      <!-- Download button -->
                      <NTooltip>
                        <template #trigger>
                          <NButton
                            size="tiny"
                            type="default"
                            circle
                            class="shadow-sm"
                            @click.stop="downloadImage(img.storageKey)"
                          >
                            <template #icon>
                              <NIcon :size="14"><DownloadOutline /></NIcon>
                            </template>
                          </NButton>
                        </template>
                        {{ t('studio.download') }}
                      </NTooltip>
                    </div>

                    <!-- Quoted indicator (bottom-left, always visible when quoted) -->
                    <div
                      v-if="isQuoted(round.assistant!.id)"
                      class="absolute bottom-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md"
                    >
                      <NIcon :size="14"><CheckmarkCircle /></NIcon>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
