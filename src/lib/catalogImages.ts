import {
  type CatalogProduct,
  type CatalogSection,
  getCatalogSections,
  saveCatalogSections,
} from '@/lib/catalog';
import { getBioskinProductImage } from '@/lib/bioskinProductImages';
import { getProductPlaceholderImage } from '@/lib/productPlaceholders';
import { getProductById } from '@/lib/products';
import {
  deleteProductImageDataUrl,
  getProductImageDataUrl,
  getProductImageDataUrlBatch,
  putProductImageDataUrl,
} from '@/lib/productImageStore';

export const CATALOG_IMAGE_REF_PREFIX = 'idb:';
export const CATALOG_IMAGES_HYDRATED_EVENT = 'med-catalog-images-hydrated';

export function notifyCatalogImagesHydrated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CATALOG_IMAGES_HYDRATED_EVENT));
}

export function catalogImageRef(productId: number): string {
  return `${CATALOG_IMAGE_REF_PREFIX}${productId}`;
}

export function parseCatalogImageRef(image: string): number | null {
  if (!image.startsWith(CATALOG_IMAGE_REF_PREFIX)) return null;
  const id = Number(image.slice(CATALOG_IMAGE_REF_PREFIX.length));
  return Number.isFinite(id) ? id : null;
}

const resolvedBlobUrls = new Map<number, string>();

export function revokeHydratedCatalogImages(): void {
  for (const url of resolvedBlobUrls.values()) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
  resolvedBlobUrls.clear();
}

/** Blob URL from a prior hydrate pass, if still valid. */
export function getCachedCatalogImage(productId: number): string | null {
  return resolvedBlobUrls.get(productId) ?? null;
}

/** Image ref for invoice / order history lines (stored hint, then live catalog). */
export function resolveStoredLineImage(productId: number, storedImage?: string | null): string {
  const hint = (storedImage ?? '').trim();
  if (hint && !hint.startsWith('blob:') && !hint.includes('images.unsplash.com')) {
    return persistableCartImage(productId, hint);
  }
  const raw = getRawCatalogProduct(productId);
  if (raw?.image?.trim()) return persistableCartImage(productId, raw.image);
  const live = getProductById(productId);
  return persistableCartImage(productId, live?.image);
}

/** Store a resolvable image ref in cart/localStorage (not ephemeral blob URLs). */
export function persistableCartImage(productId: number, image?: string | null): string {
  const value = (image ?? '').trim();
  if (!value) {
    const raw = getRawCatalogProduct(productId);
    if (raw?.image?.trim()) return persistableCartImage(productId, raw.image);
    return catalogImageRef(productId);
  }
  if (parseCatalogImageRef(value) !== null) return value;
  if (value.startsWith('blob:')) {
    const raw = getRawCatalogProduct(productId);
    if (raw?.image?.trim()) return persistableCartImage(productId, raw.image);
    return catalogImageRef(productId);
  }
  return value;
}

async function dataUrlToBlobUrl(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function resolveCatalogImage(productId: number, image: string): Promise<string> {
  const trimmed = image?.trim() ?? '';
  const refId = parseCatalogImageRef(trimmed);
  if (refId === null) {
    return trimmed || getProductPlaceholderImage(productId);
  }

  const cached = resolvedBlobUrls.get(productId);
  if (cached) return cached;

  const dataUrl = await getProductImageDataUrl(refId);
  if (!dataUrl) {
    const bioskin = bioskinImageFallback(productId);
    return bioskin ?? getProductPlaceholderImage(productId);
  }

  const blobUrl = await dataUrlToBlobUrl(dataUrl);
  resolvedBlobUrls.set(productId, blobUrl);
  return blobUrl;
}

export type ResolveCartImageOptions = {
  /** When false, return empty string instead of generic Unsplash placeholders. */
  allowPlaceholder?: boolean;
};

/** عرض السلة — يحل من الكاش أو الكتالوج أو IndexedDB */
export async function resolveCartProductImage(
  productId: number,
  imageHint?: string | null,
  options?: ResolveCartImageOptions,
): Promise<string> {
  const allowPlaceholder = options?.allowPlaceholder !== false;
  const cached = getCachedCatalogImage(productId);
  if (cached) return cached;

  const hint = (imageHint ?? '').trim();
  if (hint && !hint.startsWith('blob:') && parseCatalogImageRef(hint) === null) {
    if (!hint.includes('images.unsplash.com')) return hint;
  }

  const raw = getRawCatalogProduct(productId);
  const catalogImage = raw?.image?.trim();
  if (catalogImage && !catalogImage.includes('images.unsplash.com')) {
    const resolved = await resolveCatalogImage(productId, catalogImage);
    if (resolved && !resolved.includes('images.unsplash.com')) return resolved;
  }

  if (hint && !hint.startsWith('blob:') && parseCatalogImageRef(hint) !== null) {
    const resolved = await resolveCatalogImage(productId, hint);
    if (resolved && !resolved.includes('images.unsplash.com')) return resolved;
  }

  const bioskin = bioskinImageFallback(productId);
  if (bioskin) return bioskin;

  return allowPlaceholder ? getProductPlaceholderImage(productId) : '';
}

export async function prefetchCartProductImages(productIds: number[]): Promise<void> {
  const unique = [...new Set(productIds.filter((id) => Number.isFinite(id)))];
  await Promise.all(
    unique.map(async (id) => {
      const raw = getRawCatalogProduct(id);
      await resolveCartProductImage(id, raw?.image ?? catalogImageRef(id));
    }),
  );
}

/** Store large uploads outside localStorage; catalog keeps a short idb: reference. */
export async function prepareProductImageForSave(productId: number, image: string): Promise<string> {
  if (image.startsWith('data:')) {
    await putProductImageDataUrl(productId, image);
    return catalogImageRef(productId);
  }
  if (parseCatalogImageRef(image) !== null) return image;
  return image;
}

export async function hydrateCatalogSections(sections: CatalogSection[]): Promise<CatalogSection[]> {
  const idbIds: number[] = [];
  for (const sec of sections) {
    for (const p of sec.products) {
      const refId = parseCatalogImageRef(p.image);
      if (refId !== null && !resolvedBlobUrls.has(p.id)) idbIds.push(refId);
    }
  }
  const dataUrls = idbIds.length > 0 ? await getProductImageDataUrlBatch(idbIds) : new Map<number, string>();

  const result = await Promise.all(
    sections.map(async (sec) => ({
      ...sec,
      products: await Promise.all(
        sec.products.map(async (p) => {
          const refId = parseCatalogImageRef(p.image);
          if (refId === null) return p;
          const cached = resolvedBlobUrls.get(p.id);
          if (cached) return { ...p, image: cached };
          const dataUrl = dataUrls.get(refId);
          if (!dataUrl) return { ...p, image: getProductPlaceholderImage(p.id) };
          const blobUrl = await dataUrlToBlobUrl(dataUrl);
          resolvedBlobUrls.set(p.id, blobUrl);
          return { ...p, image: blobUrl };
        }),
      ),
    })),
  );
  notifyCatalogImagesHydrated();
  return result;
}

/** Move legacy base64 images out of med-catalog JSON to free localStorage. */
export async function migrateCatalogImagesToIndexedDB(): Promise<boolean> {
  const sections = getCatalogSections();
  let changed = false;

  for (const sec of sections) {
    for (const p of sec.products) {
      if (!p.image.startsWith('data:')) continue;
      await putProductImageDataUrl(p.id, p.image);
      p.image = catalogImageRef(p.id);
      changed = true;
    }
  }

  if (!changed) return false;
  const saved = saveCatalogSections(sections);
  if (saved.ok) revokeHydratedCatalogImages();
  return saved.ok;
}

export async function removeStoredProductImage(productId: number): Promise<void> {
  resolvedBlobUrls.delete(productId);
  await deleteProductImageDataUrl(productId);
}

function bioskinCodeFromName(nameEn?: string): string | null {
  const m = (nameEn ?? '').match(/BSK\d+/i);
  return m ? m[0].toUpperCase() : null;
}

function bioskinImageFallback(productId: number): string | null {
  const raw = getRawCatalogProductFromStorage(productId);
  const nameEn = raw?.name?.en ?? getProductById(productId)?.name?.en;
  const code = bioskinCodeFromName(nameEn);
  return code ? getBioskinProductImage(code) : null;
}

function getRawCatalogProductFromStorage(productId: number): CatalogProduct | undefined {
  for (const sec of getCatalogSections()) {
    const found = sec.products.find((p) => p.id === productId);
    if (found) return found;
  }
  return undefined;
}

export function getRawCatalogProduct(productId: number): CatalogProduct | undefined {
  const fromStorage = getRawCatalogProductFromStorage(productId);
  if (fromStorage) return fromStorage;
  const live = getProductById(productId);
  if (!live) return undefined;
  return {
    id: live.id,
    name: live.name,
    subtitle: live.subtitle,
    description: live.description,
    price: live.price,
    image: live.image,
    rating: live.rating,
    category: live.category,
    inStock: live.inStock,
    unitsPerBox: live.unitsPerBox,
    pricePerUnit: live.pricePerUnit,
    sellByBox: live.sellByBox,
    sellByUnit: live.sellByUnit,
  };
}
