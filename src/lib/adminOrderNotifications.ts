import { getInvoiceCustomerDisplayName, getInvoices, type StoredInvoice } from '@/lib/invoices';

const SEEN_INVOICES_KEY = 'med-admin-seen-invoice-ids';

function briefItemsSummary(inv: StoredInvoice, lang: 'en' | 'ar'): string {
  const first = inv.items[0];
  if (!first) return lang === 'ar' ? '—' : '—';
  const qty = first.qty > 1 ? ` ×${first.qty}` : '';
  if (inv.items.length <= 1) return `${first.name}${qty}`;
  const more = inv.items.length - 1;
  return lang === 'ar' ? `${first.name}${qty} · +${more}` : `${first.name}${qty} · +${more}`;
}

export const ADMIN_ORDER_NOTIFICATIONS_KEY = 'med-admin-order-notifications';
export const ADMIN_ORDER_NOTIFICATIONS_CHANGED = 'med-admin-order-notifications-changed';

export type AdminOrderNotification = {
  invoiceId: string;
  createdAt: number;
  customerName?: string;
  customerUsername?: string;
  total: number;
  itemCount: number;
  orderSummary?: string;
  read: boolean;
};

function readAll(): AdminOrderNotification[] {
  try {
    const raw = localStorage.getItem(ADMIN_ORDER_NOTIFICATIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (n): n is AdminOrderNotification =>
        n &&
        typeof n === 'object' &&
        typeof n.invoiceId === 'string' &&
        typeof n.createdAt === 'number',
    );
  } catch {
    return [];
  }
}

function write(list: AdminOrderNotification[]) {
  try {
    localStorage.setItem(ADMIN_ORDER_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 80)));
  } catch {}
  window.dispatchEvent(
    new CustomEvent(ADMIN_ORDER_NOTIFICATIONS_CHANGED, {
      detail: { list },
    }),
  );
}

export function getAdminOrderNotifications(): AdminOrderNotification[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getUnreadAdminOrderCount(): number {
  return readAll().filter((n) => !n.read).length;
}

function readSeenInvoiceIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_INVOICES_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeSeenInvoiceIds(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_INVOICES_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {}
}

function markInvoiceSeen(invoiceId: string) {
  const seen = readSeenInvoiceIds();
  if (seen.has(invoiceId)) return;
  seen.add(invoiceId);
  writeSeenInvoiceIds(seen);
}

/** أول زيارة للأدمن: لا إشعار عن فواتير قديمة */
export function ensureSeenInvoicesInitialized() {
  if (localStorage.getItem(SEEN_INVOICES_KEY) != null) return;
  writeSeenInvoiceIds(new Set(getInvoices().map((i) => i.id)));
}

/** يكتشف فواتير جديدة (تبويب آخر أو نفس المتصفح) */
export function scanForNewAdminOrders(): boolean {
  ensureSeenInvoicesInitialized();
  const seen = readSeenInvoiceIds();
  let added = false;
  for (const inv of getInvoices()) {
    if (seen.has(inv.id)) continue;
    seen.add(inv.id);
    if (notifyAdminNewOrder(inv)) added = true;
  }
  writeSeenInvoiceIds(seen);
  return added;
}

export function notifyAdminNewOrder(inv: StoredInvoice): boolean {
  markInvoiceSeen(inv.id);
  const list = readAll();
  if (list.some((n) => n.invoiceId === inv.id)) return false;

  const entry: AdminOrderNotification = {
    invoiceId: inv.id,
    createdAt: inv.createdAt,
    customerName: getInvoiceCustomerDisplayName(inv, 'ar'),
    customerUsername: inv.customerUsername,
    total: inv.total,
    itemCount: inv.items.length,
    orderSummary: briefItemsSummary(inv, 'ar'),
    read: false,
  };

  write([entry, ...list]);
  window.dispatchEvent(
    new CustomEvent('med-admin-new-order', {
      detail: { notification: entry, invoice: inv },
    }),
  );
  return true;
}

export function markAdminOrderNotificationRead(invoiceId: string) {
  const list = readAll();
  let changed = false;
  const next = list.map((n) => {
    if (n.invoiceId !== invoiceId || n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  if (changed) write(next);
}

export function markAllAdminOrderNotificationsRead() {
  const list = readAll();
  if (!list.some((n) => !n.read)) return;
  write(list.map((n) => ({ ...n, read: true })));
}

export function dismissAdminOrderNotification(invoiceId: string) {
  const list = readAll();
  const next = list.filter((n) => n.invoiceId !== invoiceId);
  if (next.length !== list.length) write(next);
}

export function dismissAllAdminOrderNotifications() {
  if (readAll().length === 0) return;
  write([]);
}

export function formatAdminOrderNotificationTitle(
  n: AdminOrderNotification,
  lang: 'en' | 'ar',
  inv?: StoredInvoice,
): string {
  return resolveNotificationCustomerName(n, inv, lang);
}

export function formatAdminOrderNotificationBody(
  n: AdminOrderNotification,
  lang: 'en' | 'ar',
): string {
  const currency = lang === 'ar' ? 'د.أ' : 'JOD';
  const items = n.orderSummary
    ? n.orderSummary
    : lang === 'ar'
      ? `${n.itemCount} منتج`
      : `${n.itemCount} item(s)`;
  return lang === 'ar'
    ? `${items} · ${n.total.toFixed(2)} ${currency} · #${n.invoiceId}`
    : `${items} · ${n.total.toFixed(2)} ${currency} · #${n.invoiceId}`;
}

/** للعرض في القائمة — يستكمل الاسم من الفاتورة إن لزم */
export function resolveNotificationCustomerName(
  n: AdminOrderNotification,
  inv: StoredInvoice | undefined,
  lang: 'en' | 'ar',
): string {
  if (n.customerName?.trim()) return n.customerName.trim();
  if (inv?.customerName?.trim()) return inv.customerName.trim();
  if (inv?.customerUsername?.trim()) return inv.customerUsername.trim();
  if (n.customerUsername?.trim()) return n.customerUsername.trim();
  const email = inv?.customerEmail?.trim();
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local;
    return email;
  }
  return lang === 'ar' ? 'عميل' : 'Customer';
}
