export type LanguageCode = 'en' | 'ar';

export type CatalogProduct = {
  id: number;
  name: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  rating: number;
  category: 'perfume' | 'spray' | 'apparel' | 'home' | 'powder' | 'incense' | 'oil';
  inStock?: boolean;
  stockCount?: number;
  views?: number;
  createdAt?: number;
  updatedAt?: number;
  notesTop?: string[];
  notesMiddle?: string[];
  notesBase?: string[];
  volumeMl?: number;
  /** Units inside one box (e.g. 5 vials). Enables per-unit sales when > 1. */
  unitsPerBox?: number;
  /** Optional override; otherwise derived from box price ÷ unitsPerBox */
  pricePerUnit?: number;
  sellByBox?: boolean;
  sellByUnit?: boolean;
};

export type CatalogSection = {
  id: string;
  title: { en: string; ar: string };
  products: CatalogProduct[];
};

import { CATALOG_CHANGED_EVENT, notifyCatalogChanged } from '@/lib/catalogEvents';

const CATALOG_KEY = 'med-catalog';
let catalogSectionsCache: CatalogSection[] | null = null;

function invalidateCatalogSectionsCache() {
  catalogSectionsCache = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener(CATALOG_CHANGED_EVENT, invalidateCatalogSectionsCache);
  window.addEventListener('storage', (e) => {
    if (e.key === CATALOG_KEY) invalidateCatalogSectionsCache();
  });
}
const VIEWS_KEY = 'med-analytics-views';
const PAGE_VIEWS_KEY = 'med-analytics-pageviews';
const SIGNUPS_KEY = 'med-signups';
const ORDERS_KEY = 'med-orders';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export type CatalogSaveResult = { ok: true } | { ok: false; reason: 'quota_exceeded' | 'storage_error' };

function write<T>(key: string, value: T): CatalogSaveResult {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return { ok: true };
  } catch (err) {
    const code = err instanceof DOMException ? err.code : 0;
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'QuotaExceededError' || code === 22 || code === 1014) {
      return { ok: false, reason: 'quota_exceeded' };
    }
    return { ok: false, reason: 'storage_error' };
  }
}

export function getCatalogSections(): CatalogSection[] {
  if (catalogSectionsCache) return catalogSectionsCache;
  catalogSectionsCache = read<CatalogSection[]>(CATALOG_KEY, []);
  return catalogSectionsCache;
}

export function saveCatalogSections(sections: CatalogSection[]): CatalogSaveResult {
  const result = write(CATALOG_KEY, sections);
  if (result.ok) {
    catalogSectionsCache = sections;
    notifyCatalogChanged();
  }
  return result;
}

export function upsertSection(section: Omit<CatalogSection, 'products'> & { products?: CatalogProduct[] }): CatalogSaveResult {
  const sections = getCatalogSections();
  const idx = sections.findIndex(s => s.id === section.id);
  const next: CatalogSection = {
    id: section.id,
    title: section.title,
    products: section.products ?? (idx >= 0 ? sections[idx].products : [])
  };
  if (idx >= 0) sections[idx] = next; else sections.push(next);
  return saveCatalogSections(sections);
}

export function updateSection(
  oldId: string,
  next: { id: string; title: { en: string; ar: string } },
): { ok: true } | { ok: false; reason: 'not_found' | 'id_taken' | 'quota_exceeded' | 'storage_error' } {
  const sections = getCatalogSections();
  const idx = sections.findIndex((s) => s.id === oldId);
  if (idx < 0) return { ok: false, reason: 'not_found' };

  const { id: newId, title } = next;
  if (newId !== oldId && sections.some((s) => s.id === newId)) {
    return { ok: false, reason: 'id_taken' };
  }

  const existing = sections[idx];
  sections[idx] = { id: newId, title, products: existing.products };
  const saved = saveCatalogSections(sections);
  if (saved.ok === false) {
    return { ok: false as const, reason: saved.reason };
  }
  return { ok: true as const };
}

export function deleteSection(sectionId: string): CatalogSaveResult {
  const sections = getCatalogSections().filter(s => s.id !== sectionId);
  return saveCatalogSections(sections);
}

export function normalizeSectionId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function upsertProduct(sectionId: string, product: CatalogProduct): CatalogSaveResult {
  const sections = getCatalogSections();
  let sec = sections.find(s => s.id === sectionId);
  if (!sec) {
    sec = { id: sectionId, title: { en: sectionId, ar: sectionId }, products: [] };
    sections.push(sec);
  }
  const list = sec.products;
  const idx = list.findIndex(p => p.id === product.id);
  const timestamp = Date.now();
  const normalized: CatalogProduct = {
    ...product,
    inStock: typeof product.stockCount === 'number' ? (product.stockCount > 0) : product.inStock,
    createdAt: idx >= 0 ? list[idx].createdAt ?? timestamp : timestamp,
    updatedAt: timestamp
  };
  if (idx >= 0) list[idx] = normalized; else list.push(normalized);
  return saveCatalogSections(sections);
}

export function deleteProduct(sectionId: string, productId: number): CatalogSaveResult {
  const sections = getCatalogSections();
  const sec = sections.find(s => s.id === sectionId);
  if (!sec) return { ok: true };
  sec.products = sec.products.filter(p => p.id !== productId);
  return saveCatalogSections(sections);
}

export function setProductStock(sectionId: string, productId: number, stockCount: number): CatalogSaveResult {
  const sections = getCatalogSections();
  const sec = sections.find(s => s.id === sectionId);
  if (!sec) return { ok: true };
  const p = sec.products.find(p => p.id === productId);
  if (!p) return { ok: true };
  p.stockCount = Math.max(0, Math.floor(stockCount));
  p.inStock = (p.stockCount || 0) > 0;
  p.updatedAt = Date.now();
  return saveCatalogSections(sections);
}

export function getAllCatalogProducts(): CatalogProduct[] {
  return getCatalogSections().flatMap(s => s.products);
}

export function nextCatalogProductId(sections?: CatalogSection[]): number {
  const list = sections ?? getCatalogSections();
  let max = 0;
  for (const section of list) {
    for (const product of section.products) {
      if (product.id > max) max = product.id;
    }
  }
  return max + 1;
}

export function recordProductView(productId: number) {
  const map = read<Record<string, number>>(VIEWS_KEY, {});
  map[String(productId)] = (map[String(productId)] || 0) + 1;
  write(VIEWS_KEY, map);
}

export function getProductViews(productId: number): number {
  const map = read<Record<string, number>>(VIEWS_KEY, {});
  return map[String(productId)] || 0;
}

export function recordPageView(path: string) {
  const map = read<Record<string, number[]>>(PAGE_VIEWS_KEY, {});
  const day = new Date(); day.setHours(0,0,0,0);
  const key = `${path}|${day.getTime()}`;
  const counts = map[key] || [0];
  counts[0] = (counts[0] || 0) + 1;
  map[key] = counts;
  write(PAGE_VIEWS_KEY, map);
}

export function recordSignup(email: string) {
  const list = read<Array<{ email: string; time: number }>>(SIGNUPS_KEY, []);
  list.push({ email, time: Date.now() });
  write(SIGNUPS_KEY, list);
}

export function getSignups() {
  return read<Array<{ email: string; time: number }>>(SIGNUPS_KEY, []);
}

export function getReservations() {
  return read<any[]>('med-reservations', []);
}

export function getSaleWatches() {
  return read<any[]>('med-sale-watches', []);
}

export function getOrders() {
  return read<any[]>(ORDERS_KEY, []);
}

export function addMockOrder(order: any) {
  const list = getOrders();
  list.push({ ...order, time: Date.now() });
  write(ORDERS_KEY, list);
}

