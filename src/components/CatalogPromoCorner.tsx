import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
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

/** Homepage promo — centered card; X hides until user leaves home and returns. */
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

  const onDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissCatalogPromoForHomeVisit(userId);
    setDismissed(true);
  };

  return (
    <div
      className="catalog-promo-overlay fixed inset-0 z-[44] flex items-center justify-center p-4 sm:p-6"
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={isRtl ? 'ar' : 'en'}
      role="dialog"
      aria-modal="true"
      aria-label={isRtl ? 'إعلان المتجر' : 'Store promotion'}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={isRtl ? 'إغلاق الإعلان' : 'Close promotion'}
        onClick={onDismiss}
      />

      <aside
        className={cn(
          'catalog-promo-card pointer-events-auto relative z-[1] w-full max-w-[min(92vw,20rem)] animate-in fade-in zoom-in-95 duration-300 sm:max-w-[24rem] md:max-w-[26rem]',
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)] ring-2 ring-primary/20">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-2 top-2 z-20 h-9 w-9 rounded-full border border-border/60 bg-background/95 shadow-md hover:bg-background"
            onClick={onDismiss}
            aria-label={isRtl ? 'إغلاق الإعلان' : 'Close promotion'}
          >
            <X className="h-4 w-4" />
          </Button>

          <Link to={`/product/${product.id}`} className="block">
            <div className="catalog-promo-card__media aspect-[4/5] w-full overflow-hidden bg-muted/30 sm:aspect-square sm:min-h-[15rem]">
              {config.useCustomImage && customImageUrl ? (
                <img src={customImageUrl} alt={title} className="h-full w-full object-cover" />
              ) : (
                <CartProductImage
                  productId={product.id}
                  image={product.image}
                  alt={product.name[language]}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          </Link>

          <div className="space-y-3 p-4 sm:p-5" dir={isRtl ? 'rtl' : 'ltr'}>
            <p
              className={cn(
                'line-clamp-2 text-base font-bold leading-snug text-foreground sm:text-lg',
                isRtl ? 'text-start' : 'text-center',
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                'line-clamp-2 text-sm text-muted-foreground',
                isRtl ? 'text-start' : 'text-center',
              )}
            >
              {product.name[language]}
            </p>
            <Button asChild className="btn-primary h-11 w-full text-sm font-semibold sm:h-12 sm:text-base">
              <Link to={storeHref}>{cta}</Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CatalogPromoCorner;
