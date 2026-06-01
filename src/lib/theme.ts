export const THEME_KEY = 'med-theme';
export const LEGACY_THEME_KEY = 'derma-theme';
export const THEME_EVENT = 'med-apply-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function getThemePreference(): ThemePreference {
  try {
    const saved = (localStorage.getItem(THEME_KEY) ||
      localStorage.getItem(LEGACY_THEME_KEY)) as ThemePreference | null;
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  } catch {}
  return 'system';
}

export function setThemePreference(mode: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, mode);
    localStorage.removeItem(LEGACY_THEME_KEY);
    window.dispatchEvent(new Event(THEME_EVENT));
  } catch {}
}

export function isDarkThemeActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

export function subscribeThemeChanges(onChange: () => void): () => void {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => onChange();
  window.addEventListener(THEME_EVENT, handler);
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY || e.key === LEGACY_THEME_KEY) handler();
  });
  media.addEventListener?.('change', handler);
  return () => {
    window.removeEventListener(THEME_EVENT, handler);
    media.removeEventListener?.('change', handler);
  };
}
