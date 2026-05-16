'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  initial = 'dark',
}: {
  children: ReactNode;
  initial?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initial);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = t;
    }
  }, []);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
