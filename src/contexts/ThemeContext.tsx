import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

const STORAGE_KEY_MODE = 'codeengine_theme_v2';

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

/** Modo claro / escuro / sistema. A cor de destaque vem do Aura (tokens), não de paletas por utilizador. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Padrão do sistema: modo claro
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      // limpeza de chaves antigas (modo e paleta das versões anteriores)
      ['gestao_theme_mode', 'gestao_theme_mode_v2', 'gestao_theme_mode_v3', 'gestao_theme_mode_v4', 'gestao_theme_mode_v5', 'gestao_color_palette']
        .forEach((k) => localStorage.removeItem(k));
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    } catch {}
    return 'light';
  });

  const [isDark, setIsDark] = useState<boolean>(() => mode === 'dark' || (mode === 'system' && prefersDark()));

  // Atualizar quando o modo ou a preferência do sistema mudam
  useEffect(() => {
    const updateDarkState = () => {
      const active = mode === 'dark' || (mode === 'system' && prefersDark());
      setIsDark(active);
      const root = document.documentElement;
      root.classList.toggle('dark', active);
      root.style.colorScheme = active ? 'dark' : 'light';
    };

    updateDarkState();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (mode === 'system') updateDarkState();
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY_MODE, newMode);
    } catch {}
  };

  const toggleTheme = () => {
    setMode(isDark ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
