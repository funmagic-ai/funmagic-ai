<script setup lang="ts">
const props = withDefaults(defineProps<{
  slug: string
  name: string
  description: string
  category?: string
  categoryLabel?: string
  image?: string
  rating?: number
  visitLabel?: string
  locale?: string
}>(), {
  rating: 0,
  locale: 'en',
})

const imageLoaded = ref(false)
const imageError = ref(false)

const showFallback = computed(() => imageError.value || !props.image)

function handleImageLoad() {
  imageLoaded.value = true
}

function handleImageError() {
  imageError.value = true
}

const route = useRoute()
const locale = computed(() => (route.params.locale as string) || props.locale)

const toolLink = computed(() => {
  const base = locale.value ? `/${locale.value}` : ''
  return `${base}/tools/${props.slug}`
})
</script>

<template>
  <article class="rounded-xl overflow-hidden border bg-card/50 backdrop-blur transition-all duration-300 hover:shadow-lg hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring group flex flex-col h-full">
    <!-- Image -->
    <RouterLink :to="toolLink" class="relative aspect-video w-full overflow-hidden bg-muted block">
      <div v-if="showFallback" class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="text-muted-foreground/50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </div>
      <template v-else>
        <div v-if="!imageLoaded" class="absolute inset-0 bg-muted animate-pulse" />
        <img
          :src="image"
          :alt="name"
          loading="lazy"
          class="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
          @load="handleImageLoad"
          @error="handleImageError"
        />
      </template>
      <!-- Category Badge -->
      <div v-if="categoryLabel" class="absolute top-3 left-3 z-10">
        <span class="inline-flex items-center px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase text-[10px] font-bold tracking-wide">
          {{ categoryLabel }}
        </span>
      </div>
      <!-- Bookmark Button -->
      <button
        type="button"
        class="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/60 text-white backdrop-blur-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-primary flex items-center justify-center"
        aria-label="Bookmark tool"
        @click.prevent
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
      </button>
    </RouterLink>

    <!-- Content -->
    <div class="p-5 flex flex-col flex-1 gap-3">
      <div class="flex justify-between items-start">
        <h3 class="font-bold text-lg">
          {{ name }}
        </h3>
        <!-- Rating -->
        <div v-if="rating > 0" class="flex items-center gap-1 text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="h-4 w-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span class="text-xs font-bold text-foreground tabular-nums">{{ rating.toFixed(1) }}</span>
        </div>
      </div>

      <p class="text-muted-foreground text-sm leading-relaxed line-clamp-2">
        {{ description }}
      </p>

      <!-- Footer -->
      <div class="mt-auto pt-4 flex items-center justify-end border-t border-border/50">
        <RouterLink
          v-if="visitLabel"
          :to="toolLink"
          class="text-foreground hover:text-primary text-sm font-medium transition-colors flex items-center gap-1"
        >
          {{ visitLabel }}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
        </RouterLink>
      </div>
    </div>
  </article>
</template>
