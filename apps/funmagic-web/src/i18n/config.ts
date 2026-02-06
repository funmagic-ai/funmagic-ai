export const locales = ['en', 'zh', 'ja', 'fr', 'es', 'pt', 'de', 'vi', 'ko'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
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
