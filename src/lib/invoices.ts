import { getCustomerAccount } from '@/lib/customerAccounts';

export const INVOICES_STORAGE_KEY = 'med-invoices';
const INVOICES_KEY = INVOICES_STORAGE_KEY;

export type InvoiceStatus = 'pending' | 'paid' | 'delivering' | 'delivered';

export type InvoicePaymentMethod = 'online' | 'cod' | 'bank_transfer';

/** ترتيب مراحل التتبع — من الطلب حتى التسليم */
export const ORDER_TRACK_STEPS: InvoiceStatus[] = ['pending', 'paid', 'delivering', 'delivered'];

/** بعد التوصيل: إخفاء الطلب من لوحة «الطلبات» في الأدمن (يبقى في الفواتير) */
export const ADMIN_DELIVERED_ARCHIVE_MS = 24 * 60 * 60 * 1000;

export function orderStepIndex(status?: string): number {
  const s = normalizeInvoiceStatus(status);
  const i = ORDER_TRACK_STEPS.indexOf(s);
  return i >= 0 ? i : 0;
}

export function orderStepLabel(step: InvoiceStatus, lang: 'en' | 'ar'): string {
  const labels: Record<InvoiceStatus, { en: string; ar: string }> = {
    pending: { en: 'Order placed', ar: 'تم الطلب' },
    paid: { en: 'Payment received', ar: 'تم الدفع' },
    delivering: { en: 'On the way', ar: 'في الطريق' },
    delivered: { en: 'Delivered', ar: 'تم التوصيل' },
  };
  return labels[step][lang];
}

export function paymentMethodLabel(method: InvoicePaymentMethod | undefined, lang: 'en' | 'ar'): string {
  if (!method) return lang === 'ar' ? '—' : '—';
  const labels: Record<InvoicePaymentMethod, { en: string; ar: string }> = {
    online: { en: 'Online payment', ar: 'دفع إلكتروني' },
    cod: { en: 'Cash on delivery', ar: 'دفع عند الاستلام' },
    bank_transfer: { en: 'Bank transfer', ar: 'تحويل بنكي' },
  };
  return labels[method][lang];
}

export function isInvoiceDelivered(inv: StoredInvoice): boolean {
  return normalizeInvoiceStatus(inv.status) === 'delivered';
}

export function filterDeliveredInvoices(invoices: StoredInvoice[]): StoredInvoice[] {
  return invoices.filter(isInvoiceDelivered);
}

export function normalizeInvoiceStatus(status?: string): InvoiceStatus {
  if (status === 'delivered') return 'delivered';
  if (status === 'delivering') return 'delivering';
  if (status === 'paid') return 'paid';
  return 'pending';
}

export function invoiceStatusLabel(status: InvoiceStatus, lang: 'en' | 'ar'): string {
  return orderStepLabel(status, lang);
}

export function invoiceStatusBadgeClass(status: InvoiceStatus): string {
  switch (status) {
    case 'delivered':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100';
    case 'delivering':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
    case 'paid':
      return 'border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-100';
    default:
      return 'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-50';
  }
}

export type StoredInvoice = {
  id: string;
  createdAt: number;
  items: Array<{
    id: number;
    name: string;
    qty: number;
    price: number;
    variant?: 'box' | 'unit';
    /** Stable catalog image ref (idb: / public path) — not ephemeral blob URLs */
    image?: string;
  }>;
  total: number;
  /** Sum before influencer/promo discount */
  subtotal?: number;
  discountAmount?: number;
  discountCode?: string;
  influencerName?: string;
  customerEmail?: string;
  /** اسم العميل عند إتمام الطلب */
  customerName?: string;
  /** اسم المستخدم للعميل (أحرف صغيرة) — المعرف الأساسي لفصل فواتير الحسابات */
  customerUsername?: string;
  status?: InvoiceStatus;
  /** وقت تعيين حالة «تم التوصيل» — لإخفاء الطلب من لوحة الطلبات بعد 24 ساعة */
  deliveredAt?: number;
  /** طريقة الدفع المختارة عند إتمام الطلب */
  paymentMethod?: InvoicePaymentMethod;
};

export function getInvoiceDeliveredAt(inv: StoredInvoice): number | undefined {
  if (normalizeInvoiceStatus(inv.status) !== 'delivered') return undefined;
  if (typeof inv.deliveredAt === 'number' && inv.deliveredAt > 0) return inv.deliveredAt;
  /** لا نستخدم تاريخ الطلب — العدّ من لحظة «تم التوصيل» فقط */
  return undefined;
}

export function isArchivedFromAdminOrders(inv: StoredInvoice, now = Date.now()): boolean {
  const deliveredAt = getInvoiceDeliveredAt(inv);
  if (deliveredAt == null) return false;
  return now - deliveredAt >= ADMIN_DELIVERED_ARCHIVE_MS;
}

export function filterAdminActiveOrders(invoices: StoredInvoice[], now = Date.now()): StoredInvoice[] {
  return invoices.filter((inv) => !isArchivedFromAdminOrders(inv, now));
}

/** اسم العميل للعرض في لوحة الفواتير */
export function getInvoiceCustomerDisplayName(inv: StoredInvoice, lang: 'en' | 'ar' = 'ar'): string {
  const stored = inv.customerName?.trim();
  if (stored) return stored;

  const username = inv.customerUsername?.trim();
  if (username) {
    const account = getCustomerAccount(username);
    const fromAccount = account?.user?.name?.trim();
    if (fromAccount) return fromAccount;
    return username;
  }

  const email = inv.customerEmail?.trim();
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local;
    return email;
  }

  return lang === 'ar' ? 'عميل' : 'Customer';
}

/** ملخص مختصر لما طُلب (أسماء المنتجات) */
export function formatInvoiceItemsSummary(
  inv: StoredInvoice,
  lang: 'en' | 'ar' = 'ar',
  maxNames = 2,
): string {
  const items = inv.items;
  if (!items.length) return lang === 'ar' ? '—' : '—';

  const sep = lang === 'ar' ? ' · ' : ' · ';
  const parts = items.slice(0, maxNames).map((it) => {
    const qty = it.qty > 1 ? ` ×${it.qty}` : '';
    return `${it.name}${qty}`;
  });

  if (items.length > maxNames) {
    const rest = items.length - maxNames;
    parts.push(lang === 'ar' ? `+${rest} منتج` : `+${rest} more`);
  }

  return parts.join(sep);
}

/** الوقت المتبقي قبل إخفاء الطلب من لوحة الطلبات (ملّي ثانية)، أو null */
export function adminOrdersArchiveRemainingMs(inv: StoredInvoice, now = Date.now()): number | null {
  const deliveredAt = getInvoiceDeliveredAt(inv);
  if (deliveredAt == null) return null;
  const remaining = deliveredAt + ADMIN_DELIVERED_ARCHIVE_MS - now;
  return remaining > 0 ? remaining : null;
}

export function getInvoices(): StoredInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.map((inv: StoredInvoice & { paymentMethod?: string }) => {
      let paymentMethod = inv.paymentMethod as InvoicePaymentMethod | 'whatsapp' | undefined;
      if (paymentMethod === 'whatsapp') paymentMethod = 'bank_transfer';
      return {
        ...inv,
        paymentMethod: paymentMethod as InvoicePaymentMethod | undefined,
        customerUsername: inv.customerUsername ? norm(inv.customerUsername) : undefined,
        status: normalizeInvoiceStatus(inv.status),
      };
    });
  } catch {
    return [];
  }
}

export function setInvoices(list: StoredInvoice[]) {
  try {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
  } catch {}
}

function norm(s: string | undefined): string {
  return (s || '').trim().toLowerCase();
}

/**
 * فواتير هذا الحساب فقط — لا تُعرض فواتير بلا ربط، ولا فواتير حساب آخر.
 * الفواتير الجديدة تُطابق بـ customerUsername؛ القديمة (بدون username) تُطابق بالبريد.
 */
export function getInvoicesForCustomer(email: string | undefined, username: string | undefined): StoredInvoice[] {
  const e = norm(email);
  const u = norm(username);
  if (!e && !u) return [];

  return getInvoices()
    .filter((inv) => {
      const invEmail = norm(inv.customerEmail);
      const invUser = norm(inv.customerUsername);
      if (!invEmail && !invUser) return false;
      if (invUser) {
        if (!u) return false;
        return invUser === u;
      }
      if (!e) return false;
      return invEmail === e;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function appendInvoice(inv: StoredInvoice) {
  const list = getInvoices();
  setInvoices([inv, ...list]);
}

export function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus) {
  const list = getInvoices();
  const i = list.findIndex((x) => x.id === invoiceId);
  if (i === -1) return;
  const prev = normalizeInvoiceStatus(list[i].status);
  const next = normalizeInvoiceStatus(status);
  if (prev === next) return;

  let nextInv: StoredInvoice = { ...list[i], status: next };
  if (next === 'delivered') {
    const hasDeliveredAt =
      typeof list[i].deliveredAt === 'number' && list[i].deliveredAt > 0;
    // يبدأ العدّ من اليوم الذي يُضغط فيه «تم التوصيل» (وليس من تاريخ إنشاء الطلب)
    if (prev !== 'delivered' || !hasDeliveredAt) {
      nextInv = { ...nextInv, deliveredAt: Date.now() };
    }
  } else {
    const { deliveredAt: _d, ...rest } = nextInv;
    nextInv = rest;
  }

  list[i] = nextInv;
  setInvoices(list);
}
