<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  label: string
  labelColor?: 'primary' | 'teal'
  image: string
  href: string
}>(), {
  labelColor: 'primary',
})
</script>

<template>
  <RouterLink
    :to="href"
    class="relative aspect-[21/9] lg:aspect-auto lg:flex-1 rounded-2xl overflow-hidden group cursor-pointer block"
  >
    <!-- Background Image -->
    <div
      class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
      :style="{ backgroundImage: `url(${image})` }"
    />
    <!-- Gradient Overlay -->
    <div class="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-90" />
    <!-- Content -->
    <div class="absolute bottom-0 left-0 p-6">
      <p
        class="text-sm font-semibold mb-1 uppercase tracking-wider"
        :class="labelColor === 'primary' ? 'text-primary' : 'text-teal-400'"
      >
        {{ label }}
      </p>
      <h3 class="text-xl font-bold leading-tight">{{ title }}</h3>
      <p class="text-muted-foreground text-sm mt-1">{{ description }}</p>
    </div>
  </RouterLink>
</template>
