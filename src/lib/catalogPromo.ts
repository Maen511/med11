export const CATALOG_PROMO_KEY = 'med-catalog-promo';
export const CATALOG_PROMO_CHANGED = 'med-catalog-promo-changed';
const DISMISS_PREFIX = 'med-catalog-promo-dismissed:';
/** Legacy timed dismiss (other pages); homepage uses session dismiss only. */
export const CATALOG_PROMO_DISMISS_MS = 6 * 60 * 60 * 1000;

const HOME_DISMISS_PREFIX = 'med-catalog-promo-home-dismissed:';

function homeDismissStorageKey(userId: string): string {
  return `${HOME_DISMISS_PREFIX}${userId}`;
}

/** Hide promo for current homepage visit only — returns on next visit to `/`. */
export function isCatalogPromoDismissedForHomeVisit(userId: string): boolean {
  try {
    return sessionStorage.getItem(homeDismissStorageKey(userId)) === '1';
  } catch {
    return false;
  }
}

export function dismissCatalogPromoForHomeVisit(userId: string): void {
  try {
    sessionStorage.setItem(homeDismissStorageKey(userId), '1');
  } catch {
    /* ignore */
  }
}

export function clearCatalogPromoHomeVisitDismiss(userId: string): void {
  try {
    sessionStorage.removeItem(homeDismissStorageKey(userId));
  } catch {
    /* ignore */
  }
}

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

export function mergeConfig(partial: Partial<CatalogPromoConfig> | null): CatalogPromoConfig {
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

function dismissStorageKey(config: CatalogPromoConfig): string {
  return `${DISMISS_PREFIX}${getCatalogPromoFingerprint(config)}`;
}

export function isCatalogPromoDismissed(config: CatalogPromoConfig): boolean {
  try {
    const raw = localStorage.getItem(dismissStorageKey(config));
    if (!raw) return false;
    if (raw === '1') {
      localStorage.removeItem(dismissStorageKey(config));
      return false;
    }
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) {
      localStorage.removeItem(dismissStorageKey(config));
      return false;
    }
    if (Date.now() - dismissedAt >= CATALOG_PROMO_DISMISS_MS) {
      localStorage.removeItem(dismissStorageKey(config));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function dismissCatalogPromo(config: CatalogPromoConfig): void {
  try {
    localStorage.setItem(dismissStorageKey(config), String(Date.now()));
  } catch {
    /* ignore */
  }
}
