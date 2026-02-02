'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type ColorMode,
  type ThemeId,
  DEFAULT_MODE,
  DEFAULT_THEME,
  isValidMode,
  isValidTheme,
  MODE_COOKIE_KEY,
  MODE_STORAGE_KEY,
  THEME_COOKIE_KEY,
  THEME_STORAGE_KEY,
} from '@/lib/theme';

interface ThemeContextValue {
  theme: ThemeId;
  mode: ColorMode;
  resolvedMode: 'light' | 'dark';
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
  defaultMode?: ColorMode;
}

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  defaultMode = DEFAULT_MODE,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored && isValidTheme(stored) ? stored : defaultTheme;
  });

  const [mode, setModeState] = useState<ColorMode>(() => {
    if (typeof window === 'undefined') return defaultMode;
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return stored && isValidMode(stored) ? stored : defaultMode;
  });

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const resolvedMode = useMemo(() => {
    if (mode === 'system') return systemDark ? 'dark' : 'light';
    return mode;
  }, [mode, systemDark]);

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply dark mode to document
  useEffect(() => {
    if (resolvedMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedMode]);

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setCookie(THEME_COOKIE_KEY, newTheme);
  }, []);

  const setMode = useCallback((newMode: ColorMode) => {
    setModeState(newMode);
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    setCookie(MODE_COOKIE_KEY, newMode);
  }, []);

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode }),
    [theme, mode, resolvedMode, setTheme, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
