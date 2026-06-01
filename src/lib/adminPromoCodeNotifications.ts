import { getInvoices } from '@/lib/invoices';
import { findInfluencerCodeByInput, normalizePromoCodeInput } from '@/lib/influencerCodes';

export const ADMIN_PROMO_USE_NOTIFICATIONS_KEY = 'med-admin-promo-use-notifications';
export const ADMIN_PROMO_USE_NOTIFICATIONS_CHANGED = 'med-admin-promo-use-notifications-changed';

const SEEN_PROMO_USES_KEY = 'med-admin-seen-promo-use-ids';

export type AdminPromoCodeUseNotification = {
  /** عادةً معرّف الفاتورة — فريد لكل استخدام */
  useId: string;
  code: string;
  influencerName: string;
  discountAmount: number;
  orderTotal: number;
  customerName?: string;
  customerUsername?: string;
  createdAt: number;
  read: boolean;
};

export type NotifyAdminPromoCodeUseInput = {
  useId: string;
  code: string;
  influencerName?: string;
  discountAmount: number;
  orderTotal: number;
  customerName?: string;
  customerUsername?: string;
  createdAt?: number;
};

function readAll(): AdminPromoCodeUseNotification[] {
  try {
    const raw = localStorage.getItem(ADMIN_PROMO_USE_NOTIFICATIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (n): n is AdminPromoCodeUseNotification =>
        n &&
        typeof n === 'object' &&
        typeof n.useId === 'string' &&
        typeof n.code === 'string' &&
        typeof n.createdAt === 'number',
    );
  } catch {
    return [];
  }
}

function write(list: AdminPromoCodeUseNotification[]) {
  try {
    localStorage.setItem(ADMIN_PROMO_USE_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {}
  window.dispatchEvent(new CustomEvent(ADMIN_PROMO_USE_NOTIFICATIONS_CHANGED, { detail: { list } }));
}

function readSeenUseIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_PROMO_USES_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeSeenUseIds(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_PROMO_USES_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {}
}

function markUseSeen(useId: string) {
  const seen = readSeenUseIds();
  if (seen.has(useId)) return;
  seen.add(useId);
  writeSeenUseIds(seen);
}

export function ensureSeenPromoUsesInitialized() {
  if (localStorage.getItem(SEEN_PROMO_USES_KEY) != null) return;
  const ids = getInvoices()
    .filter((inv) => Boolean(inv.discountCode?.trim()))
    .map((inv) => inv.id);
  writeSeenUseIds(new Set(ids));
}

export function getAdminPromoCodeUseNotifications(): AdminPromoCodeUseNotification[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getUnreadAdminPromoCodeUseCount(): number {
  return readAll().filter((n) => !n.read).length;
}

export function notifyAdminPromoCodeUse(input: NotifyAdminPromoCodeUseInput): boolean {
  const useId = input.useId.trim();
  const code = normalizePromoCodeInput(input.code);
  if (!useId || !code) return false;

  markUseSeen(useId);

  const list = readAll();
  if (list.some((n) => n.useId === useId)) return false;

  const stored = findInfluencerCodeByInput(code);
  const influencerName =
    input.influencerName?.trim() || stored?.influencerName || code;

  const entry: AdminPromoCodeUseNotification = {
    useId,
    code,
    influencerName,
    discountAmount: Math.max(0, input.discountAmount),
    orderTotal: Math.max(0, input.orderTotal),
    customerName: input.customerName?.trim() || undefined,
    customerUsername: input.customerUsername?.trim().toLowerCase() || undefined,
    createdAt: input.createdAt ?? Date.now(),
    read: false,
  };

  write([entry, ...list]);
  window.dispatchEvent(
    new CustomEvent('med-admin-promo-code-used', {
      detail: { notification: entry },
    }),
  );
  return true;
}

export function scanForNewPromoCodeUses(): boolean {
  ensureSeenPromoUsesInitialized();
  const seen = readSeenUseIds();
  let added = false;

  for (const inv of getInvoices()) {
    const code = inv.discountCode?.trim();
    if (!code) continue;
    if (seen.has(inv.id)) continue;
    seen.add(inv.id);

    if (
      notifyAdminPromoCodeUse({
        useId: inv.id,
        code,
        influencerName: inv.influencerName,
        discountAmount: inv.discountAmount ?? 0,
        orderTotal: inv.total,
        customerName: inv.customerName,
        customerUsername: inv.customerUsername,
        createdAt: inv.createdAt,
      })
    ) {
      added = true;
    }
  }

  writeSeenUseIds(seen);
  return added;
}

export function markAdminPromoCodeUseNotificationRead(useId: string) {
  const list = readAll();
  let changed = false;
  const next = list.map((n) => {
    if (n.useId !== useId || n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  if (changed) write(next);
}

export function markAllAdminPromoCodeUseNotificationsRead() {
  const list = readAll();
  if (!list.some((n) => !n.read)) return;
  write(list.map((n) => ({ ...n, read: true })));
}

export function dismissAdminPromoCodeUseNotification(useId: string) {
  const list = readAll();
  const next = list.filter((n) => n.useId !== useId);
  if (next.length !== list.length) write(next);
}

export function dismissAllAdminPromoCodeUseNotifications() {
  if (readAll().length === 0) return;
  write([]);
}

export function resolvePromoNotificationCustomerName(
  n: AdminPromoCodeUseNotification,
  lang: 'en' | 'ar',
): string {
  if (n.customerName?.trim()) return n.customerName.trim();
  if (n.customerUsername?.trim()) return n.customerUsername.trim();
  return lang === 'ar' ? 'عميل' : 'Customer';
}

export function formatPromoUseNotificationBody(
  n: AdminPromoCodeUseNotification,
  lang: 'en' | 'ar',
): string {
  const currency = lang === 'ar' ? 'د.أ' : 'JOD';
  const customer = resolvePromoNotificationCustomerName(n, lang);
  const discount =
    n.discountAmount > 0
      ? lang === 'ar'
        ? `خصم ${n.discountAmount.toFixed(2)} ${currency}`
        : `−${n.discountAmount.toFixed(2)} ${currency}`
      : '';
  const total = `${n.orderTotal.toFixed(2)} ${currency}`;
  return lang === 'ar'
    ? `${customer} · ${discount ? `${discount} · ` : ''}الإجمالي ${total}`
    : `${customer} · ${discount ? `${discount} · ` : ''}total ${total}`;
}
