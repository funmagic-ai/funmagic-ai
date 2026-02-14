<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/lib/api'
import type { SupportedLocale } from '@/lib/i18n'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const locale = computed(() => (route.params.locale as string) || 'en')
const slug = computed(() => route.params.slug as string)

const { data, isLoading, isError } = useQuery({
  queryKey: ['tool-detail', slug],
  queryFn: async () => {
    const { data, error } = await api.GET('/api/tools/{slug}', {
      params: {
        path: { slug: slug.value },
        query: { locale: locale.value as SupportedLocale },
      },
    })
    if (error) throw new Error(error.error)
    return data
  },
  enabled: computed(() => !!slug.value),
})

const tool = computed(() => data.value?.tool ?? null)

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
    previewUrl.value = URL.createObjectURL(input.files[0])
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function goBack() {
  router.push({ name: 'tools', params: { locale: locale.value } })
}
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Back Button -->
      <n-button text class="mb-6" @click="goBack">
        &larr; {{ t('common.back') }}
      </n-button>

      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-6">
        <n-skeleton text style="width: 60%" />
        <n-skeleton text :repeat="3" />
        <n-skeleton height="300px" />
      </div>

      <!-- Error State -->
      <div v-else-if="isError" class="flex flex-col items-center justify-center py-20">
        <p class="text-lg text-muted-foreground mb-4">{{ t('common.error') }}</p>
        <n-button type="primary" @click="goBack">{{ t('common.back') }}</n-button>
      </div>

      <!-- Tool Detail -->
      <div v-else-if="tool">
        <!-- Tool Header -->
        <div class="mb-8">
          <div class="flex items-start gap-6">
            <div
              v-if="tool.thumbnail"
              class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl"
            >
              <img
                :src="tool.thumbnail"
                :alt="tool.title"
                class="h-full w-full object-cover"
              />
            </div>
            <div
              v-else
              class="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20"
            >
              <n-icon :size="36" class="text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </n-icon>
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-bold text-foreground">{{ tool.title }}</h1>
              <p v-if="tool.description" class="mt-2 text-muted-foreground">
                {{ tool.description }}
              </p>
              <div class="mt-3 flex items-center gap-3">
                <n-tag v-if="tool.isFeatured" type="warning" size="small">
                  {{ t('tools.featured') }}
                </n-tag>
                <n-tag type="info" size="small">
                  {{ tool.usageCount }} {{ t('tools.uses') }}
                </n-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <n-card v-if="tool.description" class="mb-8">
          <p class="text-foreground whitespace-pre-line">{{ tool.description }}</p>
        </n-card>

        <!-- Tool Workspace (Placeholder) -->
        <n-card :title="t('tools.tryNow')">
          <div class="space-y-6">
            <n-alert type="info" :bordered="false">
              {{ t('tools.workspacePlaceholder') }}
            </n-alert>

            <!-- Generic File Upload Form -->
            <div class="space-y-4">
              <p class="text-sm text-muted-foreground">{{ t('tools.uploadImage') }}</p>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              />
              <div
                class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-10 transition-colors hover:border-primary/50 hover:bg-primary/5"
                @click="triggerFileInput"
              >
                <n-icon :size="48" class="text-muted-foreground mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </n-icon>
                <span class="text-sm text-muted-foreground">
                  {{ t('tools.clickToUpload') }}
                </span>
              </div>

              <!-- Preview -->
              <div v-if="previewUrl" class="mt-4">
                <p class="text-sm font-medium text-foreground mb-2">{{ t('tools.preview') }}</p>
                <img
                  :src="previewUrl"
                  :alt="selectedFile?.name"
                  class="max-h-64 rounded-lg border border-border"
                />
                <p class="mt-2 text-xs text-muted-foreground">
                  {{ selectedFile?.name }} ({{ ((selectedFile?.size ?? 0) / 1024).toFixed(1) }} KB)
                </p>
              </div>

              <n-button
                type="primary"
                size="large"
                block
                :disabled="!selectedFile"
              >
                {{ t('tools.processing') }}
              </n-button>
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </AppLayout>
</template>
