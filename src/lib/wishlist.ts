export const WISHLIST_KEY = 'med-wishlist';
export const WISHLIST_CHANGED = 'med-wishlist-changed';

export type WishlistItem = {
  id: number;
  name: { en: string; ar: string };
  image: string;
  price: number;
  category: string;
};

export function readWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? (arr as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

export function writeWishlist(list: WishlistItem[]) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(WISHLIST_CHANGED));
  } catch {}
}
