import type { AppUser } from '@/contexts/AuthContext';
import { codesMatch } from '@/lib/accessCode';
import { getMergedSections } from '@/lib/products';
import { reconcileGrantedSectionIds } from '@/lib/storeNav';

export const CUSTOMER_ACCOUNTS_KEY = 'med-customer-accounts-v2';

export type CustomerAccountSnapshot = {
  user: AppUser;
  catalogUnlocked: boolean;
  /** رمز دخول خاص بهذا العميل — يحدده الأدمن */
  accessCode: string;
  /** أقسام الكتالوج المسموح بها بعد إدخال الرمز */
  grantedSectionIds: string[];
  password: string;
};

function accountKeyForUsername(username: string): string {
  return username.trim().toLowerCase();
}

function normalizeSnapshot(row: CustomerAccountSnapshot): CustomerAccountSnapshot {
  const catalogUnlocked = Boolean(row.catalogUnlocked);
  const grantedSectionIds = reconcileGrantedSectionIds(
    Array.isArray(row.grantedSectionIds) ? row.grantedSectionIds : [],
    catalogUnlocked,
  );
  return {
    ...row,
    accessCode: (row.accessCode ?? '').trim().toUpperCase(),
    grantedSectionIds,
    catalogUnlocked,
  };
}

export function readCustomerAccountsMap(): Record<string, CustomerAccountSnapshot> {
  try {
    const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_KEY);
    if (!raw) return {};
    const map = JSON.parse(raw) as Record<string, CustomerAccountSnapshot>;
    if (!map || typeof map !== 'object') return {};
    const out: Record<string, CustomerAccountSnapshot> = {};
    for (const [key, row] of Object.entries(map)) {
      if (row?.user) out[key] = normalizeSnapshot(row);
    }
    return out;
  } catch {
    return {};
  }
}

export function writeCustomerAccountsMap(map: Record<string, CustomerAccountSnapshot>) {
  try {
    localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event('med-customer-accounts-changed'));
  } catch {}
}

function snapshotsEqual(a: CustomerAccountSnapshot, b: CustomerAccountSnapshot): boolean {
  return (
    a.password === b.password &&
    a.catalogUnlocked === b.catalogUnlocked &&
    a.accessCode === b.accessCode &&
    a.grantedSectionIds.length === b.grantedSectionIds.length &&
    a.grantedSectionIds.every((id, i) => id === b.grantedSectionIds[i]) &&
    a.user.id === b.user.id &&
    a.user.username === b.user.username &&
    a.user.email === b.user.email &&
    a.user.name === b.user.name &&
    a.user.phone === b.user.phone &&
    a.user.role === b.user.role
  );
}

export function writeCustomerAccountRow(accountKey: string, row: CustomerAccountSnapshot) {
  const map = readCustomerAccountsMap();
  const normalized = normalizeSnapshot(row);
  const prev = map[accountKey];
  if (prev && snapshotsEqual(prev, normalized)) return;
  map[accountKey] = normalized;
  writeCustomerAccountsMap(map);
}

export function listCustomerAccounts(): CustomerAccountSnapshot[] {
  return Object.values(readCustomerAccountsMap())
    .filter((row) => row.user?.role === 'user')
    .sort((a, b) => (b.user.username || '').localeCompare(a.user.username || '', undefined, { sensitivity: 'base' }));
}

export function getCustomerAccount(username: string): CustomerAccountSnapshot | null {
  const key = accountKeyForUsername(username);
  if (!key) return null;
  return readCustomerAccountsMap()[key] ?? null;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateAccessCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  const taken = new Set(
    listCustomerAccounts()
      .map((r) => r.accessCode)
      .filter(Boolean)
  );
  if (taken.has(code)) return generateAccessCode(length);
  return code;
}

/** كل أقسام الكتالوج (ثابتة + المُدارة من الأدمن) */
export function allCatalogSectionIds(): string[] {
  return getMergedSections().map((s) => s.id);
}

/** Keep full-access customers in sync when admin adds catalog sections */
export function syncFullAccessSectionGrants(): void {
  const allIds = allCatalogSectionIds();
  const map = readCustomerAccountsMap();
  for (const key of Object.keys(map)) {
    const row = map[key];
    if (!row?.catalogUnlocked || row.accessCode) continue;
    const missing = allIds.some((id) => !row.grantedSectionIds.includes(id));
    if (!missing) continue;
    writeCustomerAccountRow(key, { ...row, grantedSectionIds: [...allIds] });
  }
}

export function hasFullCatalogAccess(row: CustomerAccountSnapshot): boolean {
  if (!row.catalogUnlocked) return false;
  const all = allCatalogSectionIds();
  return all.length > 0 && all.every((id) => row.grantedSectionIds.includes(id));
}

/** منح وصول كامل بدون رمز — يفعّل عند تسجيل الدخول */
export function grantFullCustomerAccess(username: string): CustomerAccountSnapshot | null {
  const key = accountKeyForUsername(username);
  if (!key) return null;
  const map = readCustomerAccountsMap();
  const row = map[key];
  if (!row?.user) return null;

  const next: CustomerAccountSnapshot = {
    ...row,
    catalogUnlocked: true,
    grantedSectionIds: allCatalogSectionIds(),
    accessCode: '',
  };

  writeCustomerAccountRow(key, next);

  return next;
}

export function updateCustomerAccess(
  username: string,
  patch: {
    accessCode?: string;
    grantedSectionIds?: string[];
    resetUnlock?: boolean;
    catalogUnlocked?: boolean;
  }
): CustomerAccountSnapshot | null {
  const key = accountKeyForUsername(username);
  if (!key) return null;
  const map = readCustomerAccountsMap();
  const row = map[key];
  if (!row?.user) return null;

  const prevCode = row.accessCode;
  const nextCode =
    patch.accessCode !== undefined ? patch.accessCode.trim().toUpperCase() : row.accessCode;
  const codeChanged = patch.accessCode !== undefined && !codesMatch(nextCode, prevCode);

  let catalogUnlocked = row.catalogUnlocked;
  if (patch.catalogUnlocked !== undefined) {
    catalogUnlocked = patch.catalogUnlocked;
  } else if (patch.resetUnlock || codeChanged) {
    catalogUnlocked = false;
  }

  const next: CustomerAccountSnapshot = {
    ...row,
    accessCode: nextCode,
    grantedSectionIds:
      patch.grantedSectionIds !== undefined ? [...patch.grantedSectionIds] : row.grantedSectionIds,
    catalogUnlocked,
  };

  writeCustomerAccountRow(key, next);

  return next;
}

export function verifyCustomerAccessCode(username: string, entered: string): boolean {
  const row = getCustomerAccount(username);
  if (!row?.accessCode) return false;
  return codesMatch(entered, row.accessCode);
}

export type ChangeCustomerPasswordResult =
  | { ok: true }
  | { ok: false; code: 'wrong_current' | 'too_short' | 'mismatch' | 'same' | 'not_found' };

export type AdminSetCustomerPasswordResult =
  | { ok: true }
  | { ok: false; code: 'too_short' | 'mismatch' | 'not_found' };

export function changeCustomerPassword(
  username: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): ChangeCustomerPasswordResult {
  const key = accountKeyForUsername(username);
  if (!key) return { ok: false, code: 'not_found' };

  const map = readCustomerAccountsMap();
  const row = map[key];
  if (!row?.user || row.user.role !== 'user') return { ok: false, code: 'not_found' };

  const current = currentPassword.trim();
  const next = newPassword.trim();
  const confirm = confirmPassword.trim();

  if (current !== row.password) return { ok: false, code: 'wrong_current' };
  if (next.length < 4) return { ok: false, code: 'too_short' };
  if (next !== confirm) return { ok: false, code: 'mismatch' };
  if (next === current) return { ok: false, code: 'same' };

  writeCustomerAccountRow(key, { ...row, password: next });
  return { ok: true };
}

/** الأدمن يعيّن كلمة مرور جديدة للعميل (بدون كلمة المرور الحالية) */
export function adminSetCustomerPassword(
  username: string,
  newPassword: string,
  confirmPassword: string,
): AdminSetCustomerPasswordResult {
  const key = accountKeyForUsername(username);
  if (!key) return { ok: false, code: 'not_found' };

  const map = readCustomerAccountsMap();
  const row = map[key];
  if (!row?.user || row.user.role !== 'user') return { ok: false, code: 'not_found' };

  const next = newPassword.trim();
  const confirm = confirmPassword.trim();

  if (next.length < 4) return { ok: false, code: 'too_short' };
  if (next !== confirm) return { ok: false, code: 'mismatch' };

  writeCustomerAccountRow(key, { ...row, password: next });
  return { ok: true };
}

/** حذف حساب العميل نهائياً من المتجر */
export function deleteCustomerAccount(username: string): boolean {
  const key = accountKeyForUsername(username);
  if (!key) return false;
  const map = readCustomerAccountsMap();
  const row = map[key];
  if (!row?.user || row.user.role !== 'user') return false;

  delete map[key];
  writeCustomerAccountsMap(map);

  try {
    const email = row.user.email?.toLowerCase();
    if (email) {
      localStorage.removeItem(`med-selected-address:${email}`);
    }
  } catch {}

  return true;
}
