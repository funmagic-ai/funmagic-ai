<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{
  toolName: string
}>()

const { t } = useI18n()
const route = useRoute()
const locale = computed(() => (route.params.locale as string) || 'en')
</script>

<template>
  <nav class="flex items-center gap-1.5 text-sm text-muted-foreground">
    <router-link
      :to="{ name: 'home', params: { locale } }"
      class="hover:text-foreground transition-colors"
    >
      {{ t('nav.home') }}
    </router-link>
    <span class="text-muted-foreground/50">/</span>
    <router-link
      :to="{ name: 'tools', params: { locale } }"
      class="hover:text-foreground transition-colors"
    >
      {{ t('nav.tools') }}
    </router-link>
    <span class="text-muted-foreground/50">/</span>
    <span class="text-foreground font-medium">{{ toolName }}</span>
  </nav>
</template>
