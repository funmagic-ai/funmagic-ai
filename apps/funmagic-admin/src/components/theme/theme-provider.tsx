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
  // Initialize with server defaults to match SSR output
  // ThemeScript already applies the correct theme before React hydrates,
  // so there's no visual flash. We sync state after hydration.
  const [theme, setThemeState] = useState<ThemeId>(defaultTheme);
  const [mode, setModeState] = useState<ColorMode>(defaultMode);
  const [systemDark, setSystemDark] = useState(false);

  // Sync from localStorage AFTER hydration to avoid mismatch
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme && isValidTheme(storedTheme)) {
      setThemeState(storedTheme);
    }
    const storedMode = localStorage.getItem(MODE_STORAGE_KEY);
    if (storedMode && isValidMode(storedMode)) {
      setModeState(storedMode);
    }
    setSystemDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

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

// Default values for SSR - will be replaced after hydration
const DEFAULT_CONTEXT: ThemeContextValue = {
  theme: DEFAULT_THEME,
  mode: DEFAULT_MODE,
  resolvedMode: 'light',
  setTheme: () => {},
  setMode: () => {},
};

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return default context during SSR to avoid hydration errors
  // ThemeScript ensures correct theme is applied before React hydrates
  if (!context) {
    return DEFAULT_CONTEXT;
  }
  return context;
}
