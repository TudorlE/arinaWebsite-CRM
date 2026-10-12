'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('arry-theme') as Theme | null;
    // The CRM's main content area is a fixed light cream (--cream lives only
    // under :root, never overridden in .dark) — only the sidebar is always
    // dark navy regardless of this toggle. Defaulting to 'dark' here used to
    // silently activate every dark: utility class (washed-out/invisible text
    // on components that still carry a dark: variant) against that backdrop
    // that never actually turns dark, with no visible toggle to undo it.
    const initial = saved ?? 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('arry-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  // Render children immediately (avoid layout flash), theme applied via CSS class
  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
