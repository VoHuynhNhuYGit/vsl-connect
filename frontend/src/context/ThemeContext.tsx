import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = 'vsl-connect-theme';
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

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
