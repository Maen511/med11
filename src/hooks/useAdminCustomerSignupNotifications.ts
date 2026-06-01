import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_CHANGED,
  ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_KEY,
  dismissAdminCustomerSignupNotification,
  dismissAllAdminCustomerSignupNotifications,
  getAdminCustomerSignupNotifications,
  getUnreadAdminCustomerSignupCount,
  markAdminCustomerSignupNotificationRead,
  markAllAdminCustomerSignupNotificationsRead,
  type AdminCustomerSignupNotification,
} from '@/lib/adminCustomerSignupNotifications';

export function useAdminCustomerSignupNotifications() {
  const [notifications, setNotifications] = useState<AdminCustomerSignupNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(() => {
    setNotifications(getAdminCustomerSignupNotifications());
    setUnreadCount(getUnreadAdminCustomerSignupCount());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_CHANGED, onUpdate);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_KEY || e.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_CHANGED, onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const markRead = useCallback(
    (userId: string) => {
      markAdminCustomerSignupNotificationRead(userId);
      refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(() => {
    markAllAdminCustomerSignupNotificationsRead();
    refresh();
  }, [refresh]);

  const dismiss = useCallback(
    (userId: string) => {
      dismissAdminCustomerSignupNotification(userId);
      refresh();
    },
    [refresh],
  );

  const dismissAll = useCallback(() => {
    dismissAllAdminCustomerSignupNotifications();
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
