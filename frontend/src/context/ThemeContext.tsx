import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { isSiteTheme, type SiteTheme } from '../config/themes';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  siteTheme: SiteTheme;
  setSiteTheme: (theme: SiteTheme) => void;
  backgroundMotion: boolean;
  setBackgroundMotion: (enabled: boolean) => void;
};

const STORAGE_KEY = 'vsl-connect-theme';
const SITE_STORAGE_KEY = 'vsl-connect-site-theme';
const MOTION_STORAGE_KEY = 'vsl-connect-background-motion';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [backgroundMotion, setBackgroundMotion] = useState(() => {
    try { return localStorage.getItem(MOTION_STORAGE_KEY) !== 'off'; } catch { return true; }
  });
  const [siteTheme, setSiteTheme] = useState<SiteTheme>(() => {
    try {
      const saved = localStorage.getItem(SITE_STORAGE_KEY);
      if (isSiteTheme(saved)) return saved;
    } catch { /* Use the default when storage is unavailable. */ }
    return 'default';
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Keep the selected theme for this session even when persistence is blocked.
    }
  }, [theme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.siteTheme = siteTheme;
    try { localStorage.setItem(SITE_STORAGE_KEY, siteTheme); } catch { /* Keep the selection in memory. */ }
  }, [siteTheme]);

  useLayoutEffect(() => {
    document.documentElement.dataset.backgroundMotion = backgroundMotion ? 'on' : 'off';
    try { localStorage.setItem(MOTION_STORAGE_KEY, backgroundMotion ? 'on' : 'off'); } catch { /* Retain in memory. */ }
  }, [backgroundMotion]);

  useEffect(() => {
    function syncTheme(event: StorageEvent) {
      if (event.key === SITE_STORAGE_KEY) setSiteTheme(isSiteTheme(event.newValue) ? event.newValue : 'default');
      if (event.key === STORAGE_KEY && (event.newValue === 'light' || event.newValue === 'dark')) setTheme(event.newValue);
      if (event.key === MOTION_STORAGE_KEY) setBackgroundMotion(event.newValue !== 'off');
    }
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, siteTheme, setSiteTheme, backgroundMotion, setBackgroundMotion }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
