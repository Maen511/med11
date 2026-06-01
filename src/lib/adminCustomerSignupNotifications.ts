import { CUSTOMER_ACCOUNTS_KEY, listCustomerAccounts } from '@/lib/customerAccounts';

export const ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_KEY = 'med-admin-customer-signup-notifications';
export const ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_CHANGED = 'med-admin-customer-signup-notifications-changed';

const SEEN_CUSTOMER_IDS_KEY = 'med-admin-seen-customer-ids';

export type AdminCustomerSignupNotification = {
  userId: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: number;
  read: boolean;
};

export type NotifyAdminCustomerSignupInput = {
  userId: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: number;
};

function readAll(): AdminCustomerSignupNotification[] {
  try {
    const raw = localStorage.getItem(ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (n): n is AdminCustomerSignupNotification =>
        n &&
        typeof n === 'object' &&
        typeof n.userId === 'string' &&
        typeof n.createdAt === 'number',
    );
  } catch {
    return [];
  }
}

function write(list: AdminCustomerSignupNotification[]) {
  try {
    localStorage.setItem(ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {}
  window.dispatchEvent(new CustomEvent(ADMIN_CUSTOMER_SIGNUP_NOTIFICATIONS_CHANGED, { detail: { list } }));
}

function readSeenCustomerIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_CUSTOMER_IDS_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeSeenCustomerIds(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_CUSTOMER_IDS_KEY, JSON.stringify([...ids].slice(-500)));
  } catch {}
}

function markCustomerSeen(userId: string) {
  const seen = readSeenCustomerIds();
  if (seen.has(userId)) return;
  seen.add(userId);
  writeSeenCustomerIds(seen);
}

export function ensureSeenCustomersInitialized() {
  if (localStorage.getItem(SEEN_CUSTOMER_IDS_KEY) != null) return;
  const ids = listCustomerAccounts().map((row) => row.user.id).filter(Boolean);
  writeSeenCustomerIds(new Set(ids));
}

export function getAdminCustomerSignupNotifications(): AdminCustomerSignupNotification[] {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function getUnreadAdminCustomerSignupCount(): number {
  return readAll().filter((n) => !n.read).length;
}

export function notifyAdminNewCustomerSignup(input: NotifyAdminCustomerSignupInput): boolean {
  const userId = input.userId.trim();
  if (!userId) return false;

  markCustomerSeen(userId);

  const list = readAll();
  if (list.some((n) => n.userId === userId)) return false;

  const entry: AdminCustomerSignupNotification = {
    userId,
    username: input.username.trim(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    createdAt: input.createdAt ?? Date.now(),
    read: false,
  };

  write([entry, ...list]);
  window.dispatchEvent(
    new CustomEvent('med-admin-new-customer-signup', {
      detail: { notification: entry },
    }),
  );
  return true;
}

export function scanForNewCustomerSignups(): boolean {
  ensureSeenCustomersInitialized();
  const seen = readSeenCustomerIds();
  let added = false;

  for (const row of listCustomerAccounts()) {
    const id = row.user?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);

    if (
      notifyAdminNewCustomerSignup({
        userId: id,
        username: row.user.username ?? '',
        name: row.user.name ?? '',
        email: row.user.email ?? '',
        phone: row.user.phone,
        createdAt: Date.now(),
      })
    ) {
      added = true;
    }
  }

  writeSeenCustomerIds(seen);
  return added;
}

export function markAdminCustomerSignupNotificationRead(userId: string) {
  const list = readAll();
  let changed = false;
  const next = list.map((n) => {
    if (n.userId !== userId || n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  if (changed) write(next);
}

export function markAllAdminCustomerSignupNotificationsRead() {
  const list = readAll();
  if (!list.some((n) => !n.read)) return;
  write(list.map((n) => ({ ...n, read: true })));
}

export function dismissAdminCustomerSignupNotification(userId: string) {
  const list = readAll();
  const next = list.filter((n) => n.userId !== userId);
  if (next.length !== list.length) write(next);
}

export function dismissAllAdminCustomerSignupNotifications() {
  if (readAll().length === 0) return;
  write([]);
}

export function formatCustomerSignupNotificationBody(
  n: AdminCustomerSignupNotification,
  lang: 'en' | 'ar',
): string {
  const user = n.username ? `@${n.username}` : n.email;
  const phone = n.phone ? ` · ${n.phone}` : '';
  return lang === 'ar' ? `${user}${phone}` : `${user}${phone}`;
}

export { CUSTOMER_ACCOUNTS_KEY };
