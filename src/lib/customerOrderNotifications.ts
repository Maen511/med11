import {
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  type OrderTrackStatus,
  type StoredInvoice,
} from '@/lib/invoices';

export const CUSTOMER_ORDER_NOTIFICATIONS_KEY = 'med-customer-order-notifications';
export const CUSTOMER_ORDER_NOTIFICATIONS_CHANGED = 'med-customer-order-notifications-changed';
export const CUSTOMER_ORDER_STATUS_EVENT = 'med-customer-order-status-updated';

export type CustomerOrderNotification = {
  id: string;
  invoiceId: string;
  customerUsername?: string;
  customerEmail?: string;
  status: OrderTrackStatus;
  previousStatus: OrderTrackStatus;
  createdAt: number;
  read: boolean;
};

function norm(s: string | undefined): string {
  return (s || '').trim().toLowerCase();
}

function readAll(): CustomerOrderNotification[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_ORDER_NOTIFICATIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (n): n is CustomerOrderNotification =>
        n &&
        typeof n === 'object' &&
        typeof n.id === 'string' &&
        typeof n.invoiceId === 'string' &&
        typeof n.createdAt === 'number' &&
        typeof n.status === 'string',
    );
  } catch {
    return [];
  }
}

function write(list: CustomerOrderNotification[]) {
  try {
    localStorage.setItem(CUSTOMER_ORDER_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {}
  window.dispatchEvent(
    new CustomEvent(CUSTOMER_ORDER_NOTIFICATIONS_CHANGED, {
      detail: { list },
    }),
  );
}

export function notificationBelongsToCustomer(
  n: CustomerOrderNotification,
  email: string | undefined,
  username: string | undefined,
): boolean {
  const u = norm(username);
  const e = norm(email);
  const nUser = norm(n.customerUsername);
  const nEmail = norm(n.customerEmail);
  if (nUser && u) return nUser === u;
  if (nEmail && e) return nEmail === e;
  return false;
}

export function getCustomerOrderNotifications(
  email: string | undefined,
  username: string | undefined,
): CustomerOrderNotification[] {
  return readAll()
    .filter((n) => notificationBelongsToCustomer(n, email, username))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getUnreadCustomerOrderNotificationCount(
  email: string | undefined,
  username: string | undefined,
): number {
  return getCustomerOrderNotifications(email, username).filter((n) => !n.read).length;
}

/** يُستدعى عند تغيير حالة الطلب من لوحة الأدمن */
export function notifyCustomerOrderStatusUpdate(
  invoice: StoredInvoice,
  previousStatus: OrderTrackStatus,
): boolean {
  const next = normalizeInvoiceStatus(invoice.status);
  if (previousStatus === next) return false;

  const customerUsername = invoice.customerUsername?.trim().toLowerCase();
  const customerEmail = invoice.customerEmail?.trim().toLowerCase();
  if (!customerUsername && !customerEmail) return false;

  const entry: CustomerOrderNotification = {
    id: `${invoice.id}-${next}-${Date.now()}`,
    invoiceId: invoice.id,
    customerUsername,
    customerEmail,
    status: next,
    previousStatus,
    createdAt: Date.now(),
    read: false,
  };

  write([entry, ...readAll()]);

  window.dispatchEvent(
    new CustomEvent(CUSTOMER_ORDER_STATUS_EVENT, {
      detail: { notification: entry, invoice },
    }),
  );

  return true;
}

export function markCustomerOrderNotificationRead(id: string) {
  const list = readAll();
  let changed = false;
  const next = list.map((n) => {
    if (n.id !== id || n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  if (changed) write(next);
}

export function markAllCustomerOrderNotificationsRead(
  email: string | undefined,
  username: string | undefined,
) {
  const list = readAll();
  let changed = false;
  const next = list.map((n) => {
    if (!notificationBelongsToCustomer(n, email, username) || n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  if (changed) write(next);
}

export function dismissCustomerOrderNotification(id: string) {
  const list = readAll();
  const next = list.filter((n) => n.id !== id);
  if (next.length !== list.length) write(next);
}

export function formatCustomerOrderNotificationTitle(
  n: CustomerOrderNotification,
  lang: 'en' | 'ar',
): string {
  return lang === 'ar'
    ? `تحديث طلبك #${n.invoiceId}`
    : `Order #${n.invoiceId} updated`;
}

export function formatCustomerOrderNotificationBody(
  n: CustomerOrderNotification,
  lang: 'en' | 'ar',
): string {
  const label = invoiceStatusLabel(n.status, lang);
  return lang === 'ar' ? `الحالة الآن: ${label}` : `Status: ${label}`;
}
