import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_ORDER_NOTIFICATIONS_CHANGED,
  ADMIN_ORDER_NOTIFICATIONS_KEY,
  dismissAdminOrderNotification,
  dismissAllAdminOrderNotifications,
  getAdminOrderNotifications,
  getUnreadAdminOrderCount,
  markAdminOrderNotificationRead,
  markAllAdminOrderNotificationsRead,
  type AdminOrderNotification,
} from '@/lib/adminOrderNotifications';

export function useAdminOrderNotifications() {
  const [notifications, setNotifications] = useState<AdminOrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    setNotifications(getAdminOrderNotifications());
    setUnreadCount(getUnreadAdminOrderCount());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(ADMIN_ORDER_NOTIFICATIONS_CHANGED, onUpdate);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_ORDER_NOTIFICATIONS_KEY || e.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ADMIN_ORDER_NOTIFICATIONS_CHANGED, onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const markRead = useCallback(
    (invoiceId: string) => {
      markAdminOrderNotificationRead(invoiceId);
      refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(() => {
    markAllAdminOrderNotificationsRead();
    refresh();
  }, [refresh]);

  const dismiss = useCallback(
    (invoiceId: string) => {
      dismissAdminOrderNotification(invoiceId);
      refresh();
    },
    [refresh],
  );

  const dismissAll = useCallback(() => {
    dismissAllAdminOrderNotifications();
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
