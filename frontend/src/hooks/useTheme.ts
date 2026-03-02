import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('xeta_theme') as Theme | null;
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('xeta_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}

// Call this before React renders to avoid flash
export function initTheme() {
  const stored = localStorage.getItem('xeta_theme') as Theme | null;
  const theme: Theme = stored === 'light' ? 'light' : 'dark';
  applyTheme(theme);
}
