<script setup lang="ts">
interface Step {
  id: string
  label: string
}

const props = defineProps<{
  steps: Step[]
  currentStep: number
}>()

const showDialog = ref(false)

function isCompleted(idx: number) {
  return idx < props.currentStep || (idx === props.currentStep && idx === props.steps.length - 1)
}

// Close mobile dialog when viewport crosses sm breakpoint
const smQuery = typeof window !== 'undefined' ? window.matchMedia('(min-width: 640px)') : null
function onBreakpointChange(e: MediaQueryListEvent) {
  if (e.matches) showDialog.value = false
}
onMounted(() => smQuery?.addEventListener('change', onBreakpointChange))
onUnmounted(() => smQuery?.removeEventListener('change', onBreakpointChange))
</script>

<template>
  <div>
  <!-- Desktop: full horizontal stepper -->
  <div class="hidden sm:flex items-center gap-2">
    <template v-for="(step, idx) in steps" :key="step.id">
      <div class="flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors"
          :class="[
            isCompleted(idx)
              ? 'border-green-500 bg-green-500 text-white'
              : idx === currentStep
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/30 text-muted-foreground'
          ]"
        >
          <svg v-if="isCompleted(idx)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else>{{ idx + 1 }}</span>
        </div>
        <span
          class="text-sm font-medium"
          :class="idx <= currentStep ? 'text-foreground' : 'text-muted-foreground'"
        >
          {{ step.label }}
        </span>
      </div>
      <div
        v-if="idx < steps.length - 1"
        class="flex-1 h-0.5 min-w-4"
        :class="isCompleted(idx) ? 'bg-green-500' : 'bg-muted-foreground/20'"
      />
    </template>
  </div>

  <!-- Mobile: compact current step + tap to expand -->
  <button
    class="flex sm:hidden items-center gap-3 w-full rounded-lg border bg-card px-4 py-3 cursor-pointer"
    @click="showDialog = true"
  >
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
      :class="[
        isCompleted(currentStep)
          ? 'border-green-500 bg-green-500 text-white'
          : 'border-primary bg-primary text-primary-foreground'
      ]"
    >
      <svg v-if="isCompleted(currentStep)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      <span v-else>{{ currentStep + 1 }}</span>
    </div>
    <div class="flex-1 text-left">
      <p class="text-sm font-medium text-foreground">{{ steps[currentStep]?.label }}</p>
      <p class="text-xs text-muted-foreground">{{ currentStep + 1 }} / {{ steps.length }}</p>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><polyline points="6 9 12 15 18 9"/></svg>
  </button>

  <!-- Mobile dialog: vertical steps list -->
  <n-modal v-model:show="showDialog">
    <div class="rounded-lg bg-card p-5 mx-4 max-w-sm w-full space-y-0">
      <div v-for="(step, idx) in steps" :key="step.id" class="flex items-start gap-3">
        <div class="flex flex-col items-center">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors"
            :class="[
              isCompleted(idx)
                ? 'border-green-500 bg-green-500 text-white'
                : idx === currentStep
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/30 text-muted-foreground'
            ]"
          >
            <svg v-if="isCompleted(idx)" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <div
            v-if="idx < steps.length - 1"
            class="w-0.5 h-6 my-1"
            :class="isCompleted(idx) ? 'bg-green-500' : 'bg-muted-foreground/20'"
          />
        </div>
        <div class="pt-1.5">
          <span
            class="text-sm font-medium"
            :class="[
              isCompleted(idx) ? 'text-green-500' : idx === currentStep ? 'text-foreground' : 'text-muted-foreground'
            ]"
          >
            {{ step.label }}
          </span>
        </div>
      </div>
    </div>
  </n-modal>
  </div>
</template>
