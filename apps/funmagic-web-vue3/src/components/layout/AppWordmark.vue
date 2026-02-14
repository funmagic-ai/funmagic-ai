<script setup lang="ts">
defineProps<{
  class?: string
}>()
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 116 30"
    preserveAspectRatio="xMinYMid meet"
    :class="['h-6 w-auto', $props.class]"
    aria-label="FunMagic"
    role="img"
  >
    <text
      x="0"
      y="23"
      font-family="Inter, 'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif"
      font-size="24"
      letter-spacing="-0.5"
    >
      <tspan font-weight="500" fill="var(--primary)">Fun</tspan><tspan font-weight="700" fill="var(--foreground)">Magic</tspan>
    </text>
  </svg>
</template>
