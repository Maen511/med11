import { notifyCustomerOrderStatusUpdate } from '@/lib/customerOrderNotifications';
import { getCustomerAccount } from '@/lib/customerAccounts';
import { readCustomerAddresses } from '@/lib/customerAddresses';
import {
  extractJordanPhonesFromText,
  formatJordanPhoneDisplay,
  stripJordanPhonesFromText,
} from '@/lib/jordanPhone';

export const INVOICES_STORAGE_KEY = 'med-invoices';
const INVOICES_KEY = INVOICES_STORAGE_KEY;

/** مراحل التتبع المعروضة (الدفع عند الاستلام — بدون «تم الدفع») */
export type OrderTrackStatus = 'pending' | 'delivering' | 'delivered';

/** يشمل paid القديمة في التخزين فقط */
export type InvoiceStatus = OrderTrackStatus | 'paid';

export type InvoicePaymentMethod = 'online' | 'cod' | 'bank_transfer';

/** ترتيب مراحل التتبع — من الطلب حتى التسليم */
export const ORDER_TRACK_STEPS: OrderTrackStatus[] = ['pending', 'delivering', 'delivered'];

/** كل مراحل المسار — الأدمن يقدر يضغط على أي خطوة لتصحيح الحالة */
export const ADMIN_ORDER_STATUS_ACTIONS: OrderTrackStatus[] = [...ORDER_TRACK_STEPS];

/** أزرار الإجراء — نفس تسميات الحالة (الحالية مميّزة، الأخرى للتبديل) */
export function adminStatusButtonsFor(current: OrderTrackStatus): OrderTrackStatus[] {
  if (current === 'delivered') return [...ORDER_TRACK_STEPS];
  if (current === 'delivering') return ['pending', 'delivering', 'delivered'];
  return ['pending', 'delivering'];
}

/** بعد التوصيل: إخفاء الطلب من لوحة «الطلبات» في الأدمن (يبقى في الفواتير) */
export const ADMIN_DELIVERED_ARCHIVE_MS = 24 * 60 * 60 * 1000;

export function orderStepIndex(status?: string): number {
  const s = normalizeInvoiceStatus(status);
  const i = ORDER_TRACK_STEPS.indexOf(s);
  return i >= 0 ? i : 0;
}

export function orderStepLabel(step: OrderTrackStatus, lang: 'en' | 'ar'): string {
  const labels: Record<OrderTrackStatus, { en: string; ar: string }> = {
    pending: { en: 'Order placed', ar: 'تم الطلب' },
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

/** يطبّع الحالة للعرض والفلترة (paid القديمة → delivering — دفع عند الاستلام) */
export function normalizeInvoiceStatus(status?: string): OrderTrackStatus {
  if (status === 'delivered') return 'delivered';
  if (status === 'delivering' || status === 'paid') return 'delivering';
  return 'pending';
}

export function invoiceStatusLabel(status: OrderTrackStatus | InvoiceStatus, lang: 'en' | 'ar'): string {
  return orderStepLabel(normalizeInvoiceStatus(status), lang);
}

export function invoiceStatusBadgeClass(status: OrderTrackStatus | InvoiceStatus): string {
  switch (normalizeInvoiceStatus(status)) {
    case 'delivered':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100';
    case 'delivering':
      return 'border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100';
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
  /** هاتف التوصيل عند إتمام الطلب */
  customerPhone?: string;
  /** عنوان التوصيل — تفاصيل (منطقة، شارع، ملاحظات) */
  deliveryAddress?: string;
  /** مدينة التوصيل */
  deliveryCity?: string;
  /** تسمية العنوان (مثلاً: المنزل) */
  deliveryLabel?: string;
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

function invoiceCustomerLookup(inv: StoredInvoice) {
  return {
    email: inv.customerEmail?.trim().toLowerCase(),
    username: inv.customerUsername?.trim().toLowerCase(),
  };
}

function addUniquePhones(target: string[], seen: Set<string>, ...sources: (string | undefined)[]) {
  for (const src of sources) {
    const trimmed = src?.trim();
    if (!trimmed) continue;
    const display = formatJordanPhoneDisplay(trimmed) || trimmed;
    const key = display.replace(/\D/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    target.push(display);
  }
}

function addPhonesFromFreeText(target: string[], seen: Set<string>, ...chunks: (string | undefined)[]) {
  for (const chunk of chunks) {
    for (const phone of extractJordanPhonesFromText(chunk ?? '')) {
      const key = phone.replace(/\D/g, '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      target.push(phone);
    }
  }
}

function cleanAddressPart(part: string | undefined): string {
  return stripJordanPhonesFromText(part?.trim() ?? '');
}

/** كل أرقام التوصيل للعرض في لوحة الطلبات */
export function getInvoiceCustomerPhones(inv: StoredInvoice): string[] {
  const phones: string[] = [];
  const seen = new Set<string>();

  addUniquePhones(phones, seen, inv.customerPhone);

  const username = inv.customerUsername?.trim();
  if (username) {
    addUniquePhones(phones, seen, getCustomerAccount(username)?.user?.phone);
  }

  const addrs = readCustomerAddresses(invoiceCustomerLookup(inv));
  const primary = addrs.find((a) => a.isPrimary) ?? addrs[0];
  if (primary) {
    addUniquePhones(phones, seen, primary.phone);
    if (primary.extraPhones?.length) {
      addUniquePhones(phones, seen, ...primary.extraPhones);
    }
  }

  addPhonesFromFreeText(
    phones,
    seen,
    inv.deliveryAddress,
    inv.deliveryLabel,
    inv.deliveryCity,
    primary?.details,
    primary?.label,
  );

  return phones;
}

/** هاتف العميل (الأول) — للبحث والعرض المختصر */
export function getInvoiceCustomerPhone(inv: StoredInvoice): string {
  return getInvoiceCustomerPhones(inv)[0] ?? '';
}

/** موقع التوصيل للعرض في لوحة الطلبات — بدون أرقام هاتف */
export function getInvoiceDeliveryLocation(inv: StoredInvoice, lang: 'en' | 'ar' = 'ar'): string {
  const sep = lang === 'ar' ? ' · ' : ' · ';

  const detail = cleanAddressPart(inv.deliveryAddress);
  const city = cleanAddressPart(inv.deliveryCity);
  const label = cleanAddressPart(inv.deliveryLabel);

  if (detail || city || label) {
    const parts = [label, city, detail].filter(Boolean);
    return stripJordanPhonesFromText(parts.join(sep));
  }

  const addrs = readCustomerAddresses(invoiceCustomerLookup(inv));
  const primary = addrs.find((a) => a.isPrimary) ?? addrs[0];
  if (!primary) return '';

  const parts = [
    cleanAddressPart(primary.label),
    cleanAddressPart(primary.city),
    cleanAddressPart(primary.details),
  ].filter(Boolean);

  return stripJordanPhonesFromText(parts.join(sep));
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

/** عرض العدّ التنازلي (24 ساعة كحد أقصى — بالساعات لا بالأيام) */
export function formatAdminOrdersArchiveRemaining(ms: number, lang: 'en' | 'ar'): string {
  const hours = Math.max(1, Math.min(24, Math.ceil(ms / (60 * 60 * 1000))));
  return lang === 'ar' ? `${hours} ساعة` : `${hours}h`;
}

export function getInvoices(): StoredInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    let needsPersist = false;
    const list = arr.map((inv: StoredInvoice & { paymentMethod?: string }) => {
      let paymentMethod = inv.paymentMethod as InvoicePaymentMethod | 'whatsapp' | undefined;
      if (paymentMethod === 'whatsapp') paymentMethod = 'bank_transfer';
      const status = normalizeInvoiceStatus(inv.status);
      const normalized: StoredInvoice = {
        ...inv,
        paymentMethod: paymentMethod as InvoicePaymentMethod | undefined,
        customerUsername: inv.customerUsername ? norm(inv.customerUsername) : undefined,
        status,
      };
      if (status !== 'delivered' && normalized.deliveredAt != null) {
        delete normalized.deliveredAt;
        needsPersist = true;
      }
      return normalized;
    });
    if (needsPersist) setInvoices(list);
    return list;
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

export function updateInvoiceStatus(invoiceId: string, status: OrderTrackStatus | InvoiceStatus) {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    const arr: StoredInvoice[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return;

    const i = arr.findIndex((x) => x?.id === invoiceId);
    if (i === -1) return;

    const prev = normalizeInvoiceStatus(arr[i].status);
    const next = normalizeInvoiceStatus(status);
    if (prev === next) return;

    const updated: StoredInvoice = { ...arr[i], status: next };

    if (next === 'delivered') {
      /** العدّ يبدأ من لحظة الضغط على «تم التوصيل» */
      updated.deliveredAt = Date.now();
    } else {
      delete updated.deliveredAt;
    }

    arr[i] = updated;
    localStorage.setItem(INVOICES_KEY, JSON.stringify(arr));
    notifyCustomerOrderStatusUpdate(updated, prev);
  } catch {}
}
