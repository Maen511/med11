import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import ErrorBoundary from '@/components/ErrorBoundary'

// Basic runtime logging to help diagnose white screen issues
window.addEventListener('error', (e) => {
  console.error('Window error:', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// Ensure the app always starts at top (prevents browser scroll restoration)
try {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
} catch {}
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// Handle bfcache restore on iOS Safari and some Android browsers
window.addEventListener('pageshow', (e) => {
  // When a page is restored from cache, ensure we reset scroll to top
  // @ts-ignore
  if (e && e.persisted) {
    window.scrollTo(0, 0);
  }
});

// Apply theme: respect saved preference ('light' | 'dark' | 'system') and sync when 'system'
try {
  const root = document.documentElement;
  const MEDIA = window.matchMedia('(prefers-color-scheme: dark)');
  const THEME_KEY = 'med-theme';
  const APPLY_THEME_EVENT = 'med-apply-theme';
  const getPref = (): 'light' | 'dark' | 'system' =>
    (localStorage.getItem(THEME_KEY) as any) ||
    'system';
  const apply = (mode: 'light' | 'dark' | 'system') => {
    const dark = mode === 'dark' || (mode === 'system' && MEDIA.matches);
    root.classList.toggle('dark', dark);
  };
  // initial
  apply(getPref());
  // react to system only when mode is system
  const onSystem = () => { if (getPref() === 'system') apply('system'); };
  MEDIA.addEventListener ? MEDIA.addEventListener('change', onSystem) : MEDIA.addListener(onSystem as any);
  // cross-tab updates
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_KEY) apply(getPref());
  });
  // custom event from UI toggle
  window.addEventListener(APPLY_THEME_EVENT, () => apply(getPref()));
} catch {}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
