import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartProductImage } from '@/components/CartProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMergedCatalog } from '@/hooks/useMergedCatalog';
import {
  CATALOG_PROMO_CHANGED,
  clearCatalogPromoHomeVisitDismiss,
  dismissCatalogPromoForHomeVisit,
  isCatalogPromoDismissedForHomeVisit,
  readCatalogPromoConfig,
} from '@/lib/catalogPromo';
import { loadPromoImageDataUrl } from '@/lib/catalogPromoImage';
import { getProductById } from '@/lib/products';
import { resolveStoreSectionId } from '@/lib/storeNav';
import { cn } from '@/lib/utils';

/** Homepage promo — luxury horizontal dock; does not cover hero video. */
const CatalogPromoCorner = () => {
  const { language } = useLanguage();
  const { canAccessCatalog, isAdmin, grantedSectionIds, user } = useAuth();
  const { pathname } = useLocation();
  const { mergedSections } = useMergedCatalog();
  const isRtl = language === 'ar';
  const isHome = pathname === '/';
  const prevPathRef = useRef(pathname);

  const [config, setConfig] = useState(() => readCatalogPromoConfig());
  const [dismissed, setDismissed] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  const userId = user?.id ?? '';

  const syncDismissed = useCallback(() => {
    if (!userId || !isHome) {
      setDismissed(false);
      return;
    }
    setDismissed(isCatalogPromoDismissedForHomeVisit(userId));
  }, [userId, isHome]);

  const refresh = useCallback(() => {
    const next = readCatalogPromoConfig();
    setConfig(next);
    if (next.useCustomImage) {
      void loadPromoImageDataUrl().then(setCustomImageUrl);
    } else {
      setCustomImageUrl(null);
    }
    syncDismissed();
  }, [syncDismissed]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(CATALOG_PROMO_CHANGED, onChange);
    return () => window.removeEventListener(CATALOG_PROMO_CHANGED, onChange);
  }, [refresh]);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (pathname === '/' && prev !== '/') {
      if (userId) clearCatalogPromoHomeVisitDismiss(userId);
      setDismissed(false);
      return;
    }

    syncDismissed();
  }, [pathname, userId, syncDismissed]);

  const product = useMemo(() => {
    if (config.productId != null) {
      const direct = getProductById(config.productId);
      if (direct) return direct;
    }
    for (const sectionId of grantedSectionIds) {
      const section = mergedSections.find((s) => s.id === sectionId);
      const first = section?.products[0];
      if (first) return first;
    }
    return mergedSections.find((s) => s.products.length > 0)?.products[0] ?? null;
  }, [config.productId, grantedSectionIds, mergedSections]);

  const storeHref = useMemo(() => {
    if (product) {
      for (const sectionId of grantedSectionIds) {
        const section = mergedSections.find((s) => s.id === sectionId);
        if (section?.products.some((p) => p.id === product.id)) {
          return `/products/${sectionId}`;
        }
      }
      for (const section of mergedSections) {
        if (section.products.some((p) => p.id === product.id)) {
          return `/products/${section.id}`;
        }
      }
    }
    const sectionId = resolveStoreSectionId(grantedSectionIds, { catalogUnlocked: true });
    return sectionId ? `/products/${sectionId}` : '/';
  }, [product, grantedSectionIds, mergedSections]);

  const hide =
    !isHome ||
    !canAccessCatalog ||
    isAdmin ||
    !config.enabled ||
    dismissed ||
    !product ||
    !userId;

  if (hide) return null;

  const title = config.title[language];
  const cta = config.cta[language];
  const eyebrow = language === 'ar' ? 'عرض حصري لك' : 'Exclusive for you';

  const onDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissCatalogPromoForHomeVisit(userId);
    setDismissed(true);
  };

  return (
    <aside
      className={cn(
        'catalog-promo-dock pointer-events-none fixed z-[38]',
        'bottom-[max(0.65rem,env(safe-area-inset-bottom))]',
        'inset-x-3 sm:inset-x-auto sm:bottom-5',
        isRtl ? 'sm:start-5 sm:end-auto' : 'sm:end-5 sm:start-auto',
        'md:inset-x-auto md:bottom-6 md:left-1/2 md:-translate-x-1/2',
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={isRtl ? 'ar' : 'en'}
      aria-label={isRtl ? 'إعلان المتجر' : 'Store promotion'}
    >
      <div
        className={cn(
          'catalog-promo-dock__card pointer-events-auto relative w-full overflow-hidden',
          'sm:max-w-[22rem] md:max-w-[42rem] lg:max-w-[44rem]',
        )}
      >
        <div className="catalog-promo-dock__shine" aria-hidden />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-2 top-2 z-20 h-8 w-8 rounded-full border border-white/15 bg-black/35 text-white/90 shadow-lg backdrop-blur-md hover:bg-black/50 hover:text-white"
          onClick={onDismiss}
          aria-label={isRtl ? 'إغلاق الإعلان' : 'Close promotion'}
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        <div className="flex min-h-[5.25rem] flex-row items-stretch sm:min-h-[6.5rem]">
          <Link
            to={`/product/${product.id}`}
            className="catalog-promo-dock__media relative w-[38%] max-w-[9.5rem] shrink-0 overflow-hidden sm:max-w-[11rem] md:w-[34%] md:max-w-[13.5rem]"
          >
            {config.useCustomImage && customImageUrl ? (
              <img src={customImageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              <CartProductImage
                productId={product.id}
                image={product.image}
                alt={product.name[language]}
                className="h-full min-h-[5.25rem] w-full object-cover sm:min-h-[6.5rem]"
              />
            )}
            <div className="catalog-promo-dock__media-glow pointer-events-none absolute inset-0" aria-hidden />
          </Link>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-3 py-3 pe-10 sm:gap-2.5 sm:px-4 sm:py-3.5 md:flex-row md:items-center md:gap-4 md:pe-11">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="catalog-promo-dock__eyebrow flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-amber-200/90 sm:text-[0.68rem]">
                <Sparkles className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
                {eyebrow}
              </p>
              <p className="line-clamp-1 text-sm font-bold leading-tight text-white sm:text-base md:text-lg">
                {title}
              </p>
              <p className="line-clamp-2 text-[0.7rem] leading-snug text-white/72 sm:text-xs md:line-clamp-1">
                {product.name[language]}
              </p>
            </div>

            <Button
              asChild
              className="catalog-promo-dock__cta btn-primary h-9 shrink-0 px-4 text-xs font-semibold shadow-lg sm:h-10 sm:px-5 sm:text-sm md:h-11"
            >
              <Link to={storeHref}>{cta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CatalogPromoCorner;
