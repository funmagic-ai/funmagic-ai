<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'

interface Slide {
  id: string
  title: string
  description: string
  image: string
  badge: string
  link?: string
}

const props = withDefaults(defineProps<{
  slides: Slide[]
  featuredLabel?: string
}>(), {
  featuredLabel: 'Featured',
})

const router = useRouter()

function onSlideClick(slide: Slide) {
  if (!slide.link) return
  if (slide.link.startsWith('http://') || slide.link.startsWith('https://') || slide.link.startsWith('//')) {
    window.open(slide.link, '_blank', 'noopener')
  } else {
    router.push(slide.link)
  }
}

const [emblaRef, emblaApi] = emblaCarouselVue({ loop: true })
const selectedIndex = ref(0)
let autoScrollInterval: ReturnType<typeof setInterval> | undefined

function scrollPrev() {
  emblaApi.value?.scrollPrev()
}

function scrollNext() {
  emblaApi.value?.scrollNext()
}

function scrollTo(index: number) {
  emblaApi.value?.scrollTo(index)
}

watch(emblaApi, (api) => {
  if (!api) return
  api.on('select', () => {
    selectedIndex.value = api.selectedScrollSnap()
  })

  // Auto-scroll
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!prefersReducedMotion) {
    clearInterval(autoScrollInterval)
    autoScrollInterval = setInterval(() => {
      api.scrollNext()
    }, 5000)
  }
})

onUnmounted(() => {
  clearInterval(autoScrollInterval)
})
</script>

<template>
  <div v-if="slides.length === 0" class="relative aspect-[21/9] overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50" />

  <div v-else class="relative aspect-[21/9] overflow-hidden rounded-2xl group">
    <div ref="emblaRef" class="h-full overflow-hidden">
      <div class="flex h-full">
        <div
          v-for="slide in slides"
          :key="slide.id"
          class="relative h-full min-w-0 flex-[0_0_100%]"
          :class="slide.link ? 'cursor-pointer' : ''"
          @click="onSlideClick(slide)"
        >
          <!-- Background Image -->
          <div
            class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            :style="{ backgroundImage: `url(${slide.image})` }"
          />
          <!-- Feature Label -->
          <span class="absolute top-6 left-6 md:top-8 md:left-8 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground border border-primary/50">
            {{ featuredLabel }}
          </span>
          <!-- Content -->
          <div class="absolute bottom-0 left-0 w-full p-6 pb-12 md:p-8 md:pb-14">
            <div class="inline-flex flex-col gap-2 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-md text-white">
              <h2 class="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                {{ slide.title }}
              </h2>
              <p class="text-white/85 text-sm md:text-base lg:text-lg max-w-2xl line-clamp-2">
                {{ slide.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <button
      type="button"
      class="absolute top-1/2 left-4 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-primary"
      aria-label="Previous slide"
      @click="scrollPrev"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>
    <button
      type="button"
      class="absolute top-1/2 right-4 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-primary"
      aria-label="Next slide"
      @click="scrollNext"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
    </button>

    <!-- Dots Indicator -->
    <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-0" role="tablist" aria-label="Carousel slides">
      <button
        v-for="(slide, index) in slides"
        :key="slide.id"
        type="button"
        class="flex items-center justify-center h-8 w-8"
        role="tab"
        :aria-selected="selectedIndex === index"
        :aria-label="`Go to slide ${index + 1}`"
        @click="scrollTo(index)"
      >
        <span
          class="h-1.5 rounded-full transition-all"
          :class="selectedIndex === index ? 'w-8 bg-primary' : 'w-2 bg-white/20'"
        />
      </button>
    </div>
  </div>
</template>
