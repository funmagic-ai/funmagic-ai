export const THEMES = [
  { id: 'purple', name: 'Purple', description: 'Creative & Modern', swatch: '#9333ea' },
  { id: 'blue', name: 'Blue', description: 'Professional & Trustworthy', swatch: '#3b82f6' },
  { id: 'green', name: 'Green', description: 'Growth & Success', swatch: '#22c55e' },
  { id: 'orange', name: 'Orange', description: 'Energetic & Action', swatch: '#f97316' },
  { id: 'red', name: 'Red', description: 'Bold & Urgent', swatch: '#ef4444' },
  { id: 'teal', name: 'Teal', description: 'Calm & Sophisticated', swatch: '#14b8a6' },
  { id: 'indigo', name: 'Indigo', description: 'Deep & Focused', swatch: '#6366f1' },
  { id: 'slate', name: 'Slate', description: 'Neutral & Minimal', swatch: '#64748b' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export type ColorMode = 'light' | 'dark' | 'system';

export const DEFAULT_THEME: ThemeId = 'purple';
export const DEFAULT_MODE: ColorMode = 'system';

export const THEME_STORAGE_KEY = 'funmagic-admin-theme';
export const MODE_STORAGE_KEY = 'funmagic-admin-mode';
export const THEME_COOKIE_KEY = 'funmagic-admin-theme';
export const MODE_COOKIE_KEY = 'funmagic-admin-mode';

export function isValidTheme(theme: string): theme is ThemeId {
  return THEMES.some((t) => t.id === theme);
}

export function isValidMode(mode: string): mode is ColorMode {
  return ['light', 'dark', 'system'].includes(mode);
}
