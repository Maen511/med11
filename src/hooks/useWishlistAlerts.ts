import { useCallback, useEffect, useState } from 'react';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import {
  computeWishlistAlerts,
  dismissAllWishlistAlerts,
  dismissWishlistAlert,
  type WishlistAlert,
  WISHLIST_ALERTS_CHANGED,
} from '@/lib/wishlistAlerts';
import { WISHLIST_CHANGED } from '@/lib/wishlist';

export function useWishlistAlerts() {
  const [alerts, setAlerts] = useState<WishlistAlert[]>([]);

  const refresh = useCallback(() => {
    setAlerts(computeWishlistAlerts());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(WISHLIST_CHANGED, onUpdate);
    window.addEventListener(WISHLIST_ALERTS_CHANGED, onUpdate);
    window.addEventListener(CATALOG_CHANGED_EVENT, onUpdate);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'med-wishlist' ||
        e.key === 'med-wishlist-watch-state' ||
        e.key === null
      ) {
        refresh();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WISHLIST_CHANGED, onUpdate);
      window.removeEventListener(WISHLIST_ALERTS_CHANGED, onUpdate);
      window.removeEventListener(CATALOG_CHANGED_EVENT, onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const dismiss = useCallback(
    (alert: WishlistAlert) => {
      dismissWishlistAlert(alert);
      refresh();
    },
    [refresh],
  );

  const dismissAll = useCallback(() => {
    dismissAllWishlistAlerts(alerts);
    refresh();
  }, [alerts, refresh]);

  return { alerts, dismiss, dismissAll, refresh };
}
