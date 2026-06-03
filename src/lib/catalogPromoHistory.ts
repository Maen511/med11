import {
  mergeConfig,
  readCatalogPromoConfig,
  writeCatalogPromoConfig,
  type CatalogPromoConfig,
} from '@/lib/catalogPromo';
import {
  loadPromoImageDataUrl,
  removePromoImageDataUrl,
  savePromoImageDataUrl,
} from '@/lib/catalogPromoImage';

export const CATALOG_PROMO_HISTORY_KEY = 'med-catalog-promo-history';
export const CATALOG_PROMO_HISTORY_CHANGED = 'med-catalog-promo-history-changed';

const MAX_ENTRIES = 50;

export type CatalogPromoHistoryEntry = {
  id: string;
  savedAt: number;
  config: CatalogPromoConfig;
  /** Snapshot when the archived promo used a custom image */
  customImageDataUrl?: string | null;
};

function parseEntry(raw: unknown): CatalogPromoHistoryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<CatalogPromoHistoryEntry>;
  if (typeof o.id !== 'string' || typeof o.savedAt !== 'number' || !o.config) return null;
  return {
    id: o.id,
    savedAt: o.savedAt,
    config: mergeConfig(o.config),
    customImageDataUrl:
      typeof o.customImageDataUrl === 'string' ? o.customImageDataUrl : o.customImageDataUrl ?? null,
  };
}

export function readCatalogPromoHistory(): CatalogPromoHistoryEntry[] {
  try {
    const raw = localStorage.getItem(CATALOG_PROMO_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseEntry)
      .filter((e): e is CatalogPromoHistoryEntry => e != null)
      .sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

function writeHistory(list: CatalogPromoHistoryEntry[]) {
  try {
    localStorage.setItem(CATALOG_PROMO_HISTORY_KEY, JSON.stringify(list.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent(CATALOG_PROMO_HISTORY_CHANGED));
  } catch {
    /* ignore */
  }
}

export function promoConfigFingerprint(config: CatalogPromoConfig): string {
  return JSON.stringify(mergeConfig(config));
}

export async function pushCatalogPromoHistoryEntry(
  config: CatalogPromoConfig,
  customImageDataUrl?: string | null,
): Promise<void> {
  const normalized = mergeConfig(config);
  const entry: CatalogPromoHistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    savedAt: Date.now(),
    config: normalized,
    customImageDataUrl: normalized.useCustomImage ? customImageDataUrl ?? null : null,
  };
  const list = readCatalogPromoHistory();
  writeHistory([entry, ...list]);
}

export function deleteCatalogPromoHistoryEntry(id: string): void {
  writeHistory(readCatalogPromoHistory().filter((e) => e.id !== id));
}

/** Archive active promo, then apply a history entry as the new active promo. */
export async function restoreCatalogPromoFromHistory(id: string): Promise<boolean> {
  const entry = readCatalogPromoHistory().find((e) => e.id === id);
  if (!entry) return false;

  const current = readCatalogPromoConfig();
  const currentFp = promoConfigFingerprint(current);
  const defaultFp = promoConfigFingerprint(mergeConfig(null));

  if (currentFp !== defaultFp) {
    const currentImage = current.useCustomImage ? await loadPromoImageDataUrl() : null;
    await pushCatalogPromoHistoryEntry(current, currentImage);
  }

  if (entry.config.useCustomImage && entry.customImageDataUrl) {
    await savePromoImageDataUrl(entry.customImageDataUrl);
  } else {
    await removePromoImageDataUrl();
  }

  return writeCatalogPromoConfig(entry.config);
}
