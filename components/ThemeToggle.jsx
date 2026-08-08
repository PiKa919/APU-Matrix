'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'apu-matrix-theme';
const THEME_CHANGE_EVENT = 'apu-matrix-theme-change';

function getClientTheme() {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getServerTheme() {
  return 'dark';
}

function subscribe(onStoreChange) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getClientTheme, getServerTheme);
}

export default function ThemeToggle() {
  const theme = useTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button type="button" className="theme-toggle" aria-label={label} onClick={toggleTheme}>
      {isDark ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
      <span>{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
