import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartProductImage } from '@/components/CartProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMergedCatalog } from '@/hooks/useMergedCatalog';
import {
  CATALOG_PROMO_CHANGED,
  dismissCatalogPromo,
  isCatalogPromoDismissed,
  readCatalogPromoConfig,
} from '@/lib/catalogPromo';
import { loadPromoImageDataUrl } from '@/lib/catalogPromoImage';
import { getProductById } from '@/lib/products';
import { resolveStoreSectionId } from '@/lib/storeNav';
import { cn } from '@/lib/utils';

const CatalogPromoCorner = () => {
  const { language } = useLanguage();
  const { canAccessCatalog, isAdmin, grantedSectionIds } = useAuth();
  const { pathname } = useLocation();
  const { mergedSections } = useMergedCatalog();
  const isRtl = language === 'ar';

  const [config, setConfig] = useState(() => readCatalogPromoConfig());
  const [dismissed, setDismissed] = useState(() => isCatalogPromoDismissed(readCatalogPromoConfig()));
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const next = readCatalogPromoConfig();
    setConfig(next);
    setDismissed(isCatalogPromoDismissed(next));
    if (next.useCustomImage) {
      void loadPromoImageDataUrl().then(setCustomImageUrl);
    } else {
      setCustomImageUrl(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(CATALOG_PROMO_CHANGED, onChange);
    return () => window.removeEventListener(CATALOG_PROMO_CHANGED, onChange);
  }, [refresh]);

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

  const isHomeHero = pathname === '/';

  const hide =
    !canAccessCatalog ||
    isAdmin ||
    !config.enabled ||
    dismissed ||
    !product ||
    pathname.startsWith('/admin') ||
    pathname === '/checkout';

  if (hide) return null;

  const title = config.title[language];
  const cta = config.cta[language];

  const onDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissCatalogPromo(config);
    setDismissed(true);
  };

  return (
    <aside
      className={cn(
        'pointer-events-none fixed animate-in fade-in duration-300',
        isHomeHero
          ? 'top-[5.25rem] right-3 z-40 w-[min(calc(100vw-1.5rem),17.5rem)] slide-in-from-top-3 sm:top-24 sm:right-6 sm:w-72 md:right-10'
          : cn(
              'bottom-4 z-[85] w-[min(100vw-2rem,11.5rem)] slide-in-from-bottom-4',
              isRtl ? 'start-4' : 'end-4',
            ),
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={isRtl ? 'ar' : 'en'}
      aria-label={isRtl ? 'إعلان منتج' : 'Product promotion'}
    >
      <div
        className={cn(
          'pointer-events-auto relative overflow-hidden rounded-2xl border shadow-2xl ring-1',
          isHomeHero
            ? 'border-white/25 bg-card/95 backdrop-blur-md ring-white/15 dark:border-white/15 dark:bg-card/92'
            : 'border-border/70 bg-card ring-black/5 dark:ring-white/10',
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'absolute end-1.5 top-1.5 z-20 h-8 w-8 rounded-full border shadow-md transition-colors',
            isHomeHero
              ? 'border-border/50 bg-background/95 hover:bg-background'
              : 'border-transparent bg-background/90 hover:bg-background',
          )}
          onClick={onDismiss}
          aria-label={isRtl ? 'إغلاق الإعلان' : 'Close promotion'}
        >
          <X className="h-4 w-4" />
        </Button>

        <Link to={`/product/${product.id}`} className="block">
          <div className="aspect-square w-full overflow-hidden bg-muted/40">
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

        <div className={cn('space-y-2 p-3 pt-2', isHomeHero && 'sm:p-3.5')} dir={isRtl ? 'rtl' : 'ltr'}>
          <p
            className={cn(
              'line-clamp-2 font-semibold leading-snug text-foreground',
              isHomeHero ? 'text-sm' : 'text-xs',
              isRtl ? 'text-start' : 'text-center',
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'line-clamp-1 text-muted-foreground',
              isHomeHero ? 'text-xs' : 'text-[0.65rem]',
              isRtl ? 'text-start' : 'text-center',
            )}
          >
            {product.name[language]}
          </p>
          <Button asChild className={cn('btn-primary w-full font-semibold', isHomeHero ? 'h-10 text-sm' : 'h-9 text-xs')}>
            <Link
              to={storeHref}
              onClick={() => {
                dismissCatalogPromo(config);
                setDismissed(true);
              }}
            >
              {cta}
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default CatalogPromoCorner;
