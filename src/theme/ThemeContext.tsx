import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'auto';
export type ThemeMode = 'light' | 'dark';

export const THEME_KEY = 'zayro_theme';

interface ThemeContextValue {
  preference: ThemePreference;
  theme: ThemeMode;
  isDark: boolean;
  isAuto: boolean;
  setTheme: (mode: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const CYCLE: ThemePreference[] = ['light', 'dark', 'auto'];

function systemTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'auto') return stored;
  } catch {
    /* ignore */
  }
  return 'auto';
}

export function resolveTheme(preference: ThemePreference = readPreference()): ThemeMode {
  if (preference === 'auto') return systemTheme();
  return preference;
}

export function applyThemeClass(mode: ThemeMode, preference: ThemePreference = mode) {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.classList.toggle('light', mode === 'light');
  root.dataset.theme = mode;
  root.dataset.themePreference = preference;
  root.style.colorScheme = mode;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    typeof window === 'undefined' ? 'auto' : readPreference()
  );
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    typeof window === 'undefined' ? 'light' : resolveTheme(readPreference())
  );

  useEffect(() => {
    const resolved = preference === 'auto' ? systemTheme() : preference;
    setThemeState(resolved);
    applyThemeClass(resolved, preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const resolved = systemTheme();
      setThemeState(resolved);
      applyThemeClass(resolved, 'auto');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  const setTheme = useCallback((mode: ThemePreference) => {
    setPreference(mode);
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const next = CYCLE[(CYCLE.indexOf(prev) + 1) % CYCLE.length];
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      preference,
      theme,
      isDark: theme === 'dark',
      isAuto: preference === 'auto',
      setTheme,
      toggleTheme,
    }),
    [preference, theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
