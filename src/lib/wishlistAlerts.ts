import { getProductById } from '@/lib/products';
import { getPriceForMode } from '@/lib/productSaleModes';
import { readWishlist, WISHLIST_CHANGED } from '@/lib/wishlist';

export const WISHLIST_WATCH_STATE_KEY = 'med-wishlist-watch-state';
export const WISHLIST_ALERTS_CHANGED = 'med-wishlist-alerts-changed';

export type WishlistWatchEntry = {
  baselinePrice: number;
  lastKnownInStock: boolean;
};

export type WishlistAlertType = 'price_drop' | 'back_in_stock';

export type WishlistAlert = {
  id: string;
  productId: number;
  type: WishlistAlertType;
  name: { en: string; ar: string };
  image: string;
  category: string;
  previousPrice?: number;
  currentPrice: number;
};

type WatchState = Record<string, WishlistWatchEntry>;

function readWatchState(): WatchState {
  try {
    const raw = localStorage.getItem(WISHLIST_WATCH_STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as WatchState) : {};
  } catch {
    return {};
  }
}

function writeWatchStateSilently(state: WatchState) {
  try {
    localStorage.setItem(WISHLIST_WATCH_STATE_KEY, JSON.stringify(state));
  } catch {}
}

function writeWatchState(state: WatchState) {
  writeWatchStateSilently(state);
  notifyWishlistAlertsChanged();
}

export function notifyWishlistAlertsChanged() {
  window.dispatchEvent(new Event(WISHLIST_ALERTS_CHANGED));
}

export function setWatchEntryOnAdd(productId: number, price: number, inStock: boolean) {
  const state = readWatchState();
  state[String(productId)] = { baselinePrice: price, lastKnownInStock: inStock };
  writeWatchState(state);
}

export function removeWatchEntry(productId: number) {
  const state = readWatchState();
  delete state[String(productId)];
  writeWatchState(state);
}

export function computeWishlistAlerts(): WishlistAlert[] {
  const wishlist = readWishlist();
  if (wishlist.length === 0) return [];

  const state = readWatchState();
  const alerts: WishlistAlert[] = [];

  for (const w of wishlist) {
    const live = getProductById(w.id);
    if (!live) continue;

    const currentPrice = getPriceForMode(live, 'box');
    const inStock = live.inStock !== false;
    const key = String(w.id);

    let entry = state[key];
    if (!entry) {
      entry = { baselinePrice: w.price, lastKnownInStock: inStock };
      state[key] = entry;
    }

    if (currentPrice >= entry.baselinePrice) {
      entry.baselinePrice = currentPrice;
    } else if (currentPrice < entry.baselinePrice - 0.005) {
      alerts.push({
        id: `${w.id}-price`,
        productId: w.id,
        type: 'price_drop',
        name: live.name,
        image: live.image,
        category: live.category,
        previousPrice: entry.baselinePrice,
        currentPrice,
      });
    }

    if (!entry.lastKnownInStock && inStock) {
      alerts.push({
        id: `${w.id}-restock`,
        productId: w.id,
        type: 'back_in_stock',
        name: live.name,
        image: live.image,
        category: live.category,
        currentPrice,
      });
    }

    entry.lastKnownInStock = inStock;
  }

  writeWatchStateSilently(state);
  return alerts;
}

export function dismissWishlistAlert(alert: WishlistAlert) {
  const state = readWatchState();
  const entry = state[String(alert.productId)];
  if (!entry) {
    notifyWishlistAlertsChanged();
    return;
  }
  if (alert.type === 'price_drop') {
    entry.baselinePrice = alert.currentPrice;
  } else {
    entry.lastKnownInStock = true;
  }
  writeWatchState(state);
}

export function dismissAllWishlistAlerts(alerts: WishlistAlert[]) {
  const state = readWatchState();
  for (const alert of alerts) {
    const entry = state[String(alert.productId)];
    if (!entry) continue;
    if (alert.type === 'price_drop') {
      entry.baselinePrice = alert.currentPrice;
    } else {
      entry.lastKnownInStock = true;
    }
  }
  writeWatchState(state);
}
