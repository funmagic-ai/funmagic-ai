import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '@/lib/theme';

export function ThemeScript() {
  const script = `
(function() {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME}';
    var mode = localStorage.getItem('${MODE_STORAGE_KEY}') || '${DEFAULT_MODE}';
    var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.setAttribute('data-theme', theme);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
