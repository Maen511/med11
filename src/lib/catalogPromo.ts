export const CATALOG_PROMO_KEY = 'med-catalog-promo';
export const CATALOG_PROMO_CHANGED = 'med-catalog-promo-changed';
const DISMISS_PREFIX = 'med-catalog-promo-dismissed:';

export type CatalogPromoConfig = {
  enabled: boolean;
  /** null = أول منتج متاح في الكتالوج */
  productId: number | null;
  /** When true, show uploaded promo image instead of the product thumbnail. */
  useCustomImage: boolean;
  title: { en: string; ar: string };
  cta: { en: string; ar: string };
};

export const DEFAULT_CATALOG_PROMO: CatalogPromoConfig = {
  enabled: true,
  productId: null,
  useCustomImage: false,
  title: { en: 'New in store', ar: 'جديد في المتجر' },
  cta: { en: 'Browse store', ar: 'تصفّح المتجر' },
};

function mergeConfig(partial: Partial<CatalogPromoConfig> | null): CatalogPromoConfig {
  const d = DEFAULT_CATALOG_PROMO;
  if (!partial || typeof partial !== 'object') return { ...d };
  return {
    enabled: typeof partial.enabled === 'boolean' ? partial.enabled : d.enabled,
    productId:
      partial.productId === null || typeof partial.productId === 'number'
        ? partial.productId
        : d.productId,
    useCustomImage:
      typeof partial.useCustomImage === 'boolean' ? partial.useCustomImage : d.useCustomImage,
    title: {
      en: partial.title?.en?.trim() || d.title.en,
      ar: partial.title?.ar?.trim() || d.title.ar,
    },
    cta: {
      en: partial.cta?.en?.trim() || d.cta.en,
      ar: partial.cta?.ar?.trim() || d.cta.ar,
    },
  };
}

export function readCatalogPromoConfig(): CatalogPromoConfig {
  try {
    const raw = localStorage.getItem(CATALOG_PROMO_KEY);
    if (!raw) return { ...DEFAULT_CATALOG_PROMO };
    return mergeConfig(JSON.parse(raw) as Partial<CatalogPromoConfig>);
  } catch {
    return { ...DEFAULT_CATALOG_PROMO };
  }
}

export function writeCatalogPromoConfig(config: CatalogPromoConfig): boolean {
  try {
    localStorage.setItem(CATALOG_PROMO_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(CATALOG_PROMO_CHANGED));
    return true;
  } catch {
    return false;
  }
}

export function getCatalogPromoFingerprint(config: CatalogPromoConfig): string {
  return `${config.enabled ? 1 : 0}:${config.productId ?? 'auto'}:${config.useCustomImage ? 1 : 0}`;
}

export function isCatalogPromoDismissed(config: CatalogPromoConfig): boolean {
  try {
    return localStorage.getItem(`${DISMISS_PREFIX}${getCatalogPromoFingerprint(config)}`) === '1';
  } catch {
    return false;
  }
}

export function dismissCatalogPromo(config: CatalogPromoConfig): void {
  try {
    localStorage.setItem(`${DISMISS_PREFIX}${getCatalogPromoFingerprint(config)}`, '1');
  } catch {
    /* ignore */
  }
}
