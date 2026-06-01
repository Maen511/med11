import { BIOSKIN_CATALOG_VERSION, buildBioskinCatalog2026 } from '@/data/bioskinCatalog2026';
import { getCatalogSections, saveCatalogSections } from '@/lib/catalog';

const CATALOG_VERSION_KEY = 'med-catalog-version';

export function getAppliedCatalogVersion(): string | null {
  try {
    return localStorage.getItem(CATALOG_VERSION_KEY);
  } catch {
    return null;
  }
}

/** Apply Bioskin 2026 price list to localStorage catalog (store + admin). */
export function applyBioskinCatalog2026(force = false): boolean {
  try {
    if (!force && getAppliedCatalogVersion() === BIOSKIN_CATALOG_VERSION) {
      return false;
    }
    const sections = buildBioskinCatalog2026();
    saveCatalogSections(sections);
    localStorage.setItem(CATALOG_VERSION_KEY, BIOSKIN_CATALOG_VERSION);
    return true;
  } catch {
    return false;
  }
}

export function catalogNeedsBioskinImport(): boolean {
  return getAppliedCatalogVersion() !== BIOSKIN_CATALOG_VERSION;
}

export function catalogSummary() {
  const sections = getCatalogSections();
  const productCount = sections.reduce((n, s) => n + s.products.length, 0);
  return { sections: sections.length, products: productCount, version: getAppliedCatalogVersion() };
}
