import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CategoryNavItem } from '@/lib/categoryNav';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
  categories: CategoryNavItem[];
  onSelect?: (id: string) => void;
  /** مع `onSelect`: يحدد التبويب النشط ويعطّل تتبع السكرول (صفحة `/products/:id`) */
  currentCategoryId?: string | null;
  /** شريط داكن متصل بالهيدر (صفحة المنتجات) */
  tone?: 'default' | 'merged';
  /** Store `/products/:id` sticky bar — horizontal scroll, snap, short labels on phones */
  variant?: 'default' | 'store';
};

const NARROW_MQ = '(max-width: 767px)';

const CategoryBar = ({
  language,
  categories,
  onSelect,
  currentCategoryId,
  tone = 'default',
  variant = 'default',
}: Props) => {
  const embedded = Boolean(onSelect);
  const merged = tone === 'merged';
  const isStore = variant === 'store';
  const defaultActive = categories[0]?.id ?? 'packages';
  const [active, setActive] = useState(() =>
    embedded
      ? currentCategoryId && categories.some((c) => c.id === currentCategoryId)
        ? currentCategoryId
        : defaultActive
      : defaultActive,
  );
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(NARROW_MQ).matches : false,
  );
  const listRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef(0);
  const activeIdRef = useRef(active);

  const getHeaderOffset = () => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const stickyTopPx = w >= 768 ? 96 : 76;
    return stickyTopPx + (isStore ? 52 : 48);
  };

  const labelFor = (c: CategoryNavItem) => {
    const useShort = isNarrow && c.shortLabel;
    const pack = useShort ? c.shortLabel! : c.label;
    return language === 'en' ? pack.en : pack.ar;
  };

  useEffect(() => {
    const mq = window.matchMedia(NARROW_MQ);
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!embedded || !currentCategoryId) return;
    if (categories.some((c) => c.id === currentCategoryId)) {
      setActive(currentCategoryId);
      activeIdRef.current = currentCategoryId;
    }
  }, [embedded, currentCategoryId, categories]);

  const scrollActiveIntoView = (id: string, behavior: ScrollBehavior = 'smooth') => {
    const btn = document.getElementById(`cat-btn-${id}`);
    if (btn && listRef.current) {
      btn.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
    }
  };

  useLayoutEffect(() => {
    if (!listRef.current) return;
    if (embedded && currentCategoryId) {
      scrollActiveIntoView(currentCategoryId, 'auto');
      return;
    }
    listRef.current.scrollLeft = 0;
    if (embedded) return;
    const firstId = categories[0]?.id;
    if (!firstId) return;
    scrollActiveIntoView(firstId, 'auto');
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollLeft = 0;
    });
  }, [embedded, categories, currentCategoryId]);

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
  }, [embedded, categories, defaultActive, isStore]);

  useEffect(() => {
    if (embedded) {
      if (currentCategoryId) scrollActiveIntoView(currentCategoryId);
      return;
    }
    activeIdRef.current = active;
    scrollActiveIntoView(active);
  }, [active, embedded, currentCategoryId]);

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
      className={cn(
        isStore
          ? 'store-category-bar w-full min-w-0 rounded-xl border border-border/50 bg-background/95 shadow-sm backdrop-blur-sm dark:bg-background/90'
          : merged
            ? 'rounded-xl border border-white/15 bg-white/5 px-2 py-1.5'
            : 'rounded-xl border border-border/60 bg-muted/50 px-2 py-1.5 dark:border-border/50 dark:bg-muted/30',
      )}
    >
      <div
        ref={listRef}
        dir="ltr"
        className={cn(
          'store-category-bar__track flex min-w-0 flex-nowrap items-stretch gap-1.5 overflow-x-auto overflow-y-hidden py-1 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]',
          isStore ? 'snap-x snap-mandatory scroll-smooth px-1.5 sm:px-2' : 'min-w-full justify-center gap-2 py-0.5',
        )}
        style={{ overscrollBehaviorX: 'contain' }}
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
              : 'bg-background/80 text-foreground hover:bg-muted/80 dark:bg-background/50';
          return (
            <button
              key={c.id}
              id={`cat-btn-${c.id}`}
              type="button"
              onClick={() => scrollTo(c.id)}
              className={cn(
                'inline-flex shrink-0 snap-center items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap transition-colors',
                isStore
                  ? 'min-h-11 max-w-[min(72vw,11.5rem)] px-3 py-2 text-xs sm:min-h-10 sm:max-w-none sm:px-3.5 sm:text-sm'
                  : 'min-h-10 px-3 py-2 text-sm',
                btnClass,
              )}
              aria-label={labelFor(c)}
              aria-current={isActive ? 'true' : undefined}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? '' : 'opacity-80')} aria-hidden />
              <span className="truncate">{labelFor(c)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBar;
