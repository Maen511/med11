import { useCallback, useEffect, useState } from 'react';
import {
  CUSTOMER_ORDER_NOTIFICATIONS_CHANGED,
  CUSTOMER_ORDER_NOTIFICATIONS_KEY,
  dismissCustomerOrderNotification,
  getCustomerOrderNotifications,
  getUnreadCustomerOrderNotificationCount,
  markAllCustomerOrderNotificationsRead,
  markCustomerOrderNotificationRead,
  type CustomerOrderNotification,
} from '@/lib/customerOrderNotifications';

export function useCustomerOrderNotifications(
  email: string | undefined,
  username: string | undefined,
) {
  const [notifications, setNotifications] = useState<CustomerOrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    setNotifications(getCustomerOrderNotifications(email, username));
    setUnreadCount(getUnreadCustomerOrderNotificationCount(email, username));
  }, [email, username]);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(CUSTOMER_ORDER_NOTIFICATIONS_CHANGED, onUpdate);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CUSTOMER_ORDER_NOTIFICATIONS_KEY || e.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CUSTOMER_ORDER_NOTIFICATIONS_CHANGED, onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const markRead = useCallback(
    (id: string) => {
      markCustomerOrderNotificationRead(id);
      refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(() => {
    markAllCustomerOrderNotificationsRead(email, username);
    refresh();
  }, [email, username, refresh]);

  const dismiss = useCallback(
    (id: string) => {
      dismissCustomerOrderNotification(id);
      refresh();
    },
    [refresh],
  );

  return {
    notifications,
    unreadCount,
    refresh,
    markRead,
    markAllRead,
    dismiss,
  };
}
