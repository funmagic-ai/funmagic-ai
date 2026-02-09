<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()

const sectionKeys = ['collect', 'use', 'processing', 'sharing', 'security', 'retention', 'rights', 'cookies', 'changes', 'contact'] as const
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-foreground mb-8">{{ t('nav.privacy') }}</h1>

      <div class="prose prose-neutral dark:prose-invert max-w-none space-y-6">
        <section v-for="key in sectionKeys" :key="key">
          <h2 class="text-xl font-semibold text-foreground mt-8 mb-4">{{ t(`privacy.sections.${key}.title`) }}</h2>
          <p class="text-muted-foreground leading-relaxed">
            {{ t(`privacy.sections.${key}.content`) }}
          </p>
        </section>

        <p class="text-sm text-muted-foreground mt-12 pt-6 border-t border-border">
          {{ t('privacy.lastUpdated') }}
        </p>
      </div>
    </div>
  </AppLayout>
</template>
