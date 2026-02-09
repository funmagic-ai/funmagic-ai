<script setup lang="ts">
interface Step {
  id: string
  label: string
}

defineProps<{
  steps: Step[]
  currentStep: number
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-for="(step, idx) in steps" :key="step.id">
      <div class="flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors"
          :class="[
            idx < currentStep || (idx === currentStep && idx === steps.length - 1)
              ? 'border-green-500 bg-green-500 text-white'
              : idx === currentStep
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/30 text-muted-foreground'
          ]"
        >
          <svg v-if="idx < currentStep || (idx === currentStep && idx === steps.length - 1)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else>{{ idx + 1 }}</span>
        </div>
        <span
          class="text-sm font-medium hidden sm:inline"
          :class="idx <= currentStep ? 'text-foreground' : 'text-muted-foreground'"
        >
          {{ step.label }}
        </span>
      </div>
      <div
        v-if="idx < steps.length - 1"
        class="flex-1 h-0.5 min-w-4"
        :class="idx < currentStep ? 'bg-green-500' : 'bg-muted-foreground/20'"
      />
    </template>
  </div>
</template>
