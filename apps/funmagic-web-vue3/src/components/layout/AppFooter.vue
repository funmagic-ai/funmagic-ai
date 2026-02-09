<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const currentLocale = computed(() => (route.params.locale as string) || 'en')
const currentYear = new Date().getFullYear()

interface FooterLink {
  name: string
  labelKey: string
}

const footerLinks: FooterLink[] = [
  { name: 'terms', labelKey: 'nav.terms' },
  { name: 'privacy', labelKey: 'nav.privacy' },
  { name: 'help', labelKey: 'nav.help' },
]
</script>

<template>
  <footer class="border-t border-border bg-background">
    <div class="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
      <!-- Footer Links -->
      <nav class="flex items-center gap-6">
        <router-link
          v-for="link in footerLinks"
          :key="link.name"
          :to="{ name: link.name, params: { locale: currentLocale } }"
          class="text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
        >
          {{ t(link.labelKey) }}
        </router-link>
      </nav>

      <!-- Copyright -->
      <p class="text-sm text-muted-foreground">
        &copy; {{ currentYear }} FunMagic. {{ t('footer.copyright') }}
      </p>
    </div>
  </footer>
</template>
