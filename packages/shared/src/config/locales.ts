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

// Translation content interfaces
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

export interface BannerTranslationContent {
  title: string
  description?: string
  linkText?: string
  badge?: string
}

// Generic translations record type
export type TranslationsRecord<T> = {
  en: T
} & {
  [K in Exclude<SupportedLocale, 'en'>]?: Partial<T>
}

/**
 * Generic localization helper with fallback to English.
 * For each key, uses locale value if present, otherwise falls back to English.
 */
export function getLocalizedContent<T>(
  translations: TranslationsRecord<T>,
  locale: SupportedLocale
): T {
  const enContent = translations.en

  if (!translations[locale] || locale === 'en') {
    return enContent
  }

  const localeContent = translations[locale] as Partial<T>
  const result = { ...enContent }

  for (const key of Object.keys(enContent as object) as Array<keyof T>) {
    const localeVal = localeContent[key]
    if (localeVal !== undefined && localeVal !== null && localeVal !== '') {
      result[key] = localeVal as T[keyof T]
    }
  }

  return result
}

// Helper to get localized tool content with fallback to English (handles steps deep merge)
export function getLocalizedToolContent(
  translations: TranslationsRecord<ToolTranslationContent>,
  locale: SupportedLocale
): ToolTranslationContent {
  const enContent = translations.en

  if (!translations[locale] || locale === 'en') {
    return enContent
  }

  const localeContent = translations[locale]!

  // Deep merge step translations
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
  return getLocalizedContent(translations, locale)
}

export function getLocalizedCreditPackageContent(
  translations: TranslationsRecord<CreditPackageTranslationContent>,
  locale: SupportedLocale
): CreditPackageTranslationContent {
  return getLocalizedContent(translations, locale)
}

export function getLocalizedBannerContent(
  translations: TranslationsRecord<BannerTranslationContent>,
  locale: SupportedLocale
): BannerTranslationContent {
  return getLocalizedContent(translations, locale)
}
