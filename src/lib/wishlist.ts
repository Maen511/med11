import { persistableCartImage } from '@/lib/catalogImages';
import { getProductById } from '@/lib/products';

export const WISHLIST_KEY = 'med-wishlist';
export const WISHLIST_CHANGED = 'med-wishlist-changed';

export type WishlistItem = {
  id: number;
  name: { en: string; ar: string };
  image: string;
  price: number;
  category: string;
};

export type WishlistProductInput = {
  id: number;
  name: { en: string; ar: string };
  image: string;
  price: number;
  category: string;
};

function parseStoredWishlist(raw: string | null): WishlistItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

/** Refresh names/prices/images from the live catalog; drop removed products. */
export function syncWishlistWithCatalog(list: WishlistItem[]): WishlistItem[] {
  const next: WishlistItem[] = [];
  for (const item of list) {
    const live = getProductById(item.id);
    if (!live) continue;
    next.push({
      id: item.id,
      name: live.name,
      category: live.category,
      price: live.price,
      image: persistableCartImage(item.id, live.image),
    });
  }
  return next;
}

function wishlistNeedsSync(stored: WishlistItem[], synced: WishlistItem[]): boolean {
  if (stored.length !== synced.length) return true;
  const byId = new Map(stored.map((i) => [i.id, i]));
  return synced.some((item) => {
    const prev = byId.get(item.id);
    return (
      !prev ||
      prev.image !== item.image ||
      prev.price !== item.price ||
      prev.name.en !== item.name.en ||
      prev.name.ar !== item.name.ar ||
      prev.category !== item.category
    );
  });
}

export function readWishlist(): WishlistItem[] {
  try {
    const stored = parseStoredWishlist(localStorage.getItem(WISHLIST_KEY));
    const synced = syncWishlistWithCatalog(stored);
    if (wishlistNeedsSync(stored, synced)) {
      writeWishlist(synced, { silent: true });
    }
    return synced;
  } catch {
    return [];
  }
}

/** Add or remove a product; returns true if now in the wishlist. */
export function toggleWishlistItem(product: WishlistProductInput): boolean {
  const list = readWishlist();
  const exists = list.some((w) => w.id === product.id);
  const live = getProductById(product.id);
  const entry: WishlistItem = live
    ? {
        id: product.id,
        name: live.name,
        category: live.category,
        price: live.price,
        image: persistableCartImage(product.id, live.image),
      }
    : {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: persistableCartImage(product.id, product.image),
      };
  const next = exists ? list.filter((w) => w.id !== product.id) : [entry, ...list];
  writeWishlist(next);
  return !exists;
}

export function isInWishlist(productId: number): boolean {
  return readWishlist().some((w) => w.id === productId);
}

export function writeWishlist(list: WishlistItem[], options?: { silent?: boolean }) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(syncWishlistWithCatalog(list)));
    if (!options?.silent) {
      window.dispatchEvent(new Event(WISHLIST_CHANGED));
    }
  } catch {}
}
