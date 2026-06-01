import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CategoryNavItem } from '@/lib/categoryNav';

type Props = {
  language: 'en' | 'ar';
  categories: CategoryNavItem[];
  onSelect?: (id: string) => void;
  /** مع `onSelect`: يحدد التبويب النشط ويعطّل تتبع السكرول (صفحة `/products/:id`) */
  currentCategoryId?: string | null;
  /** شريط داكن متصل بالهيدر (صفحة المنتجات) */
  tone?: 'default' | 'merged';
};

const CategoryBar = ({ language, categories, onSelect, currentCategoryId, tone = 'default' }: Props) => {
  const embedded = Boolean(onSelect);
  const merged = tone === 'merged';
  const defaultActive = categories[0]?.id ?? 'packages';
  const [active, setActive] = useState(() =>
    embedded
      ? currentCategoryId && categories.some((c) => c.id === currentCategoryId)
        ? currentCategoryId
        : defaultActive
      : defaultActive,
  );
  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef(0);
  const activeIdRef = useRef(active);

  const getHeaderOffset = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const stickyTopPx = w >= 768 ? 96 : 80;
    return stickyTopPx + 48;
  };

  useEffect(() => {
    if (!embedded || !currentCategoryId) return;
    if (categories.some((c) => c.id === currentCategoryId)) {
      setActive(currentCategoryId);
      activeIdRef.current = currentCategoryId;
    }
  }, [embedded, currentCategoryId, categories]);

  useLayoutEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollLeft = 0;
    if (embedded) return;
    const firstId = categories[0]?.id;
    if (!firstId) return;
    const firstBtn = document.getElementById(`cat-btn-${firstId}`);
    if (firstBtn) {
      firstBtn.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollLeft = 0;
        firstBtn.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
      });
    }
  }, [embedded, categories]);

  useEffect(() => {
    if (embedded) return;

    const computeActive = () => {
      const offset = getHeaderOffset();
      const positions = categories.map((c) => {
        const el = document.getElementById(c.id);
        if (!el) return { id: c.id, top: Number.POSITIVE_INFINITY };
        const rect = el.getBoundingClientRect();
        return { id: c.id, top: Math.abs(rect.top - offset) };
      });
      positions.sort((a, b) => a.top - b.top);
      return positions[0]?.id ?? defaultActive;
    };

    const handler = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        const nextId = computeActive();
        if (nextId !== activeIdRef.current) {
          activeIdRef.current = nextId;
          setActive(nextId);
        }
      });
    };

    activeIdRef.current = computeActive();
    setActive(activeIdRef.current);
    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [embedded, categories, defaultActive]);

  useEffect(() => {
    if (embedded) return;
    activeIdRef.current = active;
    const btn = document.getElementById(`cat-btn-${active}`);
    if (btn && listRef.current) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [active, embedded]);

  const scrollTo = (id: string) => {
    if (onSelect) {
      onSelect(id);
      return;
    }
    const el = document.getElementById(id);
    if (!el) return;
    const offset = getHeaderOffset();
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <div
      className={
        merged
          ? 'rounded-xl border border-white/15 bg-white/5 px-2 py-1.5'
          : 'rounded-xl border border-border/60 bg-muted/50 px-2 py-1.5 dark:border-border/50 dark:bg-muted/30'
      }
    >
      <div
        ref={listRef}
        dir="ltr"
        className="flex min-w-full flex-nowrap items-center justify-center gap-2 overflow-x-auto overflow-y-hidden py-0.5 [scrollbar-width:thin]"
      >
        {categories.map((c) => {
          const Icon = c.icon;
          const isActive = active === c.id;
          const btnClass = merged
            ? isActive
              ? 'bg-white text-gray-900 shadow-sm'
              : 'bg-white/10 text-white hover:bg-white/15'
            : isActive
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-background/80 text-foreground hover:bg-secondary dark:bg-background/40';
          return (
            <button
              key={c.id}
              id={`cat-btn-${c.id}`}
              type="button"
              onClick={() => scrollTo(c.id)}
              className={`inline-flex min-h-10 shrink-0 snap-center items-center justify-center gap-2 rounded-lg px-3 py-2 text-center text-sm font-medium whitespace-nowrap transition-colors ${btnClass}`}
              aria-label={language === 'en' ? c.label.en : c.label.ar}
            >
              <Icon className={`h-4 w-4 shrink-0 md:h-5 md:w-5 ${isActive ? '' : 'opacity-80'}`} />
              <span>{language === 'en' ? c.label.en : c.label.ar}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
