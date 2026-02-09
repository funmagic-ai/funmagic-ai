<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AppLayout from '@/components/layout/AppLayout.vue'

const { t } = useI18n()

const faqKeys = ['what', 'credits', 'formats', 'processing', 'refunds', 'storage', 'expiry', 'security'] as const
</script>

<template>
  <AppLayout>
    <div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-foreground mb-4">{{ t('nav.help') }}</h1>
      <p class="text-muted-foreground mb-10">
        {{ t('help.subtitle') }}
      </p>

      <!-- FAQ Section -->
      <section class="mb-12">
        <h2 class="text-xl font-semibold text-foreground mb-6">{{ t('help.faqTitle') }}</h2>

        <n-collapse accordion arrow-placement="right">
          <n-collapse-item
            v-for="key in faqKeys"
            :key="key"
            :title="t(`help.faq.${key}.title`)"
            :name="key"
          >
            <p class="text-muted-foreground">
              {{ t(`help.faq.${key}.content`) }}
            </p>
          </n-collapse-item>
        </n-collapse>
      </section>

      <!-- Contact Section -->
      <section>
        <h2 class="text-xl font-semibold text-foreground mb-6">{{ t('help.contactTitle') }}</h2>
        <n-card>
          <div class="space-y-4">
            <p class="text-muted-foreground">
              {{ t('help.contactSubtitle') }}
            </p>
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <n-icon :size="20" class="text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </n-icon>
                <span class="text-foreground">support@funmagic.ai</span>
              </div>
              <div class="flex items-center gap-3">
                <n-icon :size="20" class="text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </n-icon>
                <span class="text-foreground">{{ t('help.contactResponseTime') }}</span>
              </div>
            </div>
          </div>
        </n-card>
      </section>
    </div>
  </AppLayout>
</template>
