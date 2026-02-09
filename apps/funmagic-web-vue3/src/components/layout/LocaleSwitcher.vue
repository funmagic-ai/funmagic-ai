<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, LOCALE_LABELS, setLocale, type SupportedLocale } from '@/lib/i18n'
import { GlobeOutline } from '@vicons/ionicons5'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()

const localeOptions = SUPPORTED_LOCALES.map((loc) => ({
  label: LOCALE_LABELS[loc],
  key: loc,
}))

async function handleSelect(key: string) {
  const newLocale = key as SupportedLocale
  await setLocale(newLocale)

  // Update the locale param in the current route
  router.replace({
    ...route,
    params: { ...route.params, locale: newLocale },
  })
}
</script>

<template>
  <n-dropdown
    :options="localeOptions"
    :value="locale"
    trigger="click"
    @select="handleSelect"
  >
    <n-button quaternary circle>
      <template #icon>
        <n-icon :size="20">
          <GlobeOutline />
        </n-icon>
      </template>
    </n-button>
  </n-dropdown>
</template>
