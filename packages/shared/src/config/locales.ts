export const SUPPORTED_LOCALES = [
  'en', // English (default, required)
  'zh', // Chinese
  'ja', // Japanese
  'fr', // French
  'es', // Spanish
  'pt', // Portuguese
  'de', // German
  'vi', // Vietnamese
  'ko', // Korean
] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'en'

// Locale display names for admin UI
export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  de: 'Deutsch',
  vi: 'Tiếng Việt',
  ko: '한국어',
}

// Translation content interfaces (used by helper functions)
export interface ToolTranslationContent {
  title: string
  description?: string
  steps?: Record<string, { name: string; description?: string }>
}

export interface ToolTypeTranslationContent {
  title: string
  description?: string
}

export interface CreditPackageTranslationContent {
  name: string
  description?: string
}

// Generic translations record type
export type TranslationsRecord<T> = {
  en: T
} & {
  [K in Exclude<SupportedLocale, 'en'>]?: Partial<T>
}

// Helper to get localized tool content with fallback to English
export function getLocalizedToolContent(
  translations: TranslationsRecord<ToolTranslationContent>,
  locale: SupportedLocale
): ToolTranslationContent {
  const localeContent = translations[locale]
  const enContent = translations.en

  if (!localeContent || locale === 'en') {
    return enContent
  }

  // Merge step translations: locale-specific steps override English steps
  const enSteps = enContent.steps
  const localeSteps = localeContent.steps
  let mergedSteps: Record<string, { name: string; description?: string }> | undefined
  if (enSteps || localeSteps) {
    mergedSteps = { ...enSteps }
    if (localeSteps) {
      for (const [stepId, stepTranslation] of Object.entries(localeSteps)) {
        mergedSteps[stepId] = {
          name: stepTranslation.name || mergedSteps[stepId]?.name || stepId,
          description: stepTranslation.description ?? mergedSteps[stepId]?.description,
        }
      }
    }
  }

  return {
    title: localeContent.title || enContent.title,
    description: localeContent.description ?? enContent.description,
    steps: mergedSteps,
  }
}

export function getLocalizedToolTypeContent(
  translations: TranslationsRecord<ToolTypeTranslationContent>,
  locale: SupportedLocale
): ToolTypeTranslationContent {
  const localeContent = translations[locale]
  const enContent = translations.en

  if (!localeContent || locale === 'en') {
    return enContent
  }

  return {
    title: localeContent.title || enContent.title,
    description: localeContent.description ?? enContent.description,
  }
}

export function getLocalizedCreditPackageContent(
  translations: TranslationsRecord<CreditPackageTranslationContent>,
  locale: SupportedLocale
): CreditPackageTranslationContent {
  const localeContent = translations[locale]
  const enContent = translations.en

  if (!localeContent || locale === 'en') {
    return enContent
  }

  return {
    name: localeContent.name || enContent.name,
    description: localeContent.description ?? enContent.description,
  }
}

// Banner translation content interface
export interface BannerTranslationContent {
  title: string
  description?: string
  linkText?: string
  badge?: string
}

// Helper to get localized banner content with fallback to English
export function getLocalizedBannerContent(
  translations: TranslationsRecord<BannerTranslationContent>,
  locale: SupportedLocale
): BannerTranslationContent {
  const localeContent = translations[locale]
  const enContent = translations.en

  if (!localeContent || locale === 'en') {
    return enContent
  }

  return {
    title: localeContent.title || enContent.title,
    description: localeContent.description ?? enContent.description,
    linkText: localeContent.linkText ?? enContent.linkText,
    badge: localeContent.badge ?? enContent.badge,
  }
}
