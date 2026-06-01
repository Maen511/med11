import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_PROMO_USE_NOTIFICATIONS_CHANGED,
  ADMIN_PROMO_USE_NOTIFICATIONS_KEY,
  dismissAdminPromoCodeUseNotification,
  dismissAllAdminPromoCodeUseNotifications,
  getAdminPromoCodeUseNotifications,
  getUnreadAdminPromoCodeUseCount,
  markAdminPromoCodeUseNotificationRead,
  markAllAdminPromoCodeUseNotificationsRead,
  type AdminPromoCodeUseNotification,
} from '@/lib/adminPromoCodeNotifications';

export function useAdminPromoCodeNotifications() {
  const [notifications, setNotifications] = useState<AdminPromoCodeUseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    setNotifications(getAdminPromoCodeUseNotifications());
    setUnreadCount(getUnreadAdminPromoCodeUseCount());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(ADMIN_PROMO_USE_NOTIFICATIONS_CHANGED, onUpdate);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_PROMO_USE_NOTIFICATIONS_KEY || e.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ADMIN_PROMO_USE_NOTIFICATIONS_CHANGED, onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const markRead = useCallback(
    (useId: string) => {
      markAdminPromoCodeUseNotificationRead(useId);
      refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(() => {
    markAllAdminPromoCodeUseNotificationsRead();
    refresh();
  }, [refresh]);

  const dismiss = useCallback(
    (useId: string) => {
      dismissAdminPromoCodeUseNotification(useId);
      refresh();
    },
    [refresh],
  );

  const dismissAll = useCallback(() => {
    dismissAllAdminPromoCodeUseNotifications();
    refresh();
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    refresh,
    markRead,
    markAllRead,
    dismiss,
    dismissAll,
  };
}
