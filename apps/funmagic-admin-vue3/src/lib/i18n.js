import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';
export const SUPPORTED_LOCALES = ['en', 'zh'];
export const DEFAULT_LOCALE = 'en';
export const LOCALE_LABELS = {
    en: 'English',
    zh: '中文',
};
export const i18n = createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: DEFAULT_LOCALE,
    messages: { en },
});
const loadedLocales = new Set(['en']);
export async function loadLocaleMessages(locale) {
    if (loadedLocales.has(locale))
        return;
    const messages = await import(`@/locales/${locale}.json`);
    i18n.global.setLocaleMessage(locale, messages.default);
    loadedLocales.add(locale);
}
export async function setLocale(locale) {
    await loadLocaleMessages(locale);
    i18n.global.locale.value = locale;
    document.documentElement.lang = locale;
}
