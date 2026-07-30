'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'smart-eat-theme';

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(currentTheme);
  }, []);

  function selectTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  return (
    <div className="theme-switch" role="group" aria-label="Farbschema auswählen">
      <button
        type="button"
        className="theme-switch__option"
        aria-label="Helles Farbschema verwenden"
        aria-pressed={theme === 'light'}
        onClick={() => selectTheme('light')}
      >
        <span aria-hidden="true">☀</span>
        <span className="theme-switch__label">Hell</span>
      </button>
      <button
        type="button"
        className="theme-switch__option"
        aria-label="Dunkles Farbschema verwenden"
        aria-pressed={theme === 'dark'}
        onClick={() => selectTheme('dark')}
      >
        <span aria-hidden="true">☾</span>
        <span className="theme-switch__label">Dunkel</span>
      </button>
    </div>
  );
}
