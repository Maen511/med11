import { getAdminEmail, getAdminUsername } from '@/lib/adminEnv';
import { resolveAdminPassword, setStoredAdminPassword } from '@/lib/adminPasswordStore';

export const ADMIN_ACCOUNTS_KEY = 'med-admin-accounts';
export const ADMIN_ACCOUNTS_CHANGED = 'med-admin-accounts-changed';

export type AdminAccountRecord = {
  id: string;
  username: string;
  email: string;
  name: string;
  password: string;
  createdAt: number;
};

export const PRIMARY_ADMIN_ID = 'primary';

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function normalizeIdentifier(identifier: string): string {
  return identifier.trim();
}

function notifyChanged() {
  window.dispatchEvent(new Event(ADMIN_ACCOUNTS_CHANGED));
}

export function getPrimaryAdminRecord(): AdminAccountRecord {
  return {
    id: PRIMARY_ADMIN_ID,
    username: getAdminUsername(),
    email: getAdminEmail(),
    name: 'Admin',
    password: resolveAdminPassword(),
    createdAt: 0,
  };
}

export function readAdditionalAdminAccounts(): AdminAccountRecord[] {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as AdminAccountRecord[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((a) => a?.id && a?.username && a?.password)
      .map((a) => ({
        id: String(a.id),
        username: a.username.trim(),
        email: (a.email ?? '').trim(),
        name: (a.name ?? a.username).trim() || a.username.trim(),
        password: a.password,
        createdAt: typeof a.createdAt === 'number' ? a.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function writeAdditionalAdminAccounts(list: AdminAccountRecord[]) {
  try {
    localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(list));
    notifyChanged();
  } catch {}
}

export function listAllAdminAccounts(): AdminAccountRecord[] {
  return [getPrimaryAdminRecord(), ...readAdditionalAdminAccounts()];
}

export function findAdminByCredentials(identifier: string, password: string): AdminAccountRecord | null {
  const id = normalizeIdentifier(identifier);
  const pw = password.trim();
  if (!id || !pw) return null;

  const idLower = id.toLowerCase();
  for (const admin of listAllAdminAccounts()) {
    const userMatch = idLower === admin.username.trim().toLowerCase();
    const emailMatch = admin.email && id.includes('@') && idLower === admin.email.toLowerCase();
    if ((userMatch || emailMatch) && pw === admin.password) {
      return admin;
    }
  }
  return null;
}

export function isAdminUsernameTaken(username: string): boolean {
  const key = normalizeUsername(username);
  if (!key) return true;
  return listAllAdminAccounts().some((a) => normalizeUsername(a.username) === key);
}

export function isAdminEmailTaken(email: string, exceptUsername?: string): boolean {
  const e = email.trim().toLowerCase();
  if (!e) return false;
  const except = exceptUsername ? normalizeUsername(exceptUsername) : '';
  return listAllAdminAccounts().some((a) => {
    if (except && normalizeUsername(a.username) === except) return false;
    return a.email.trim().toLowerCase() === e;
  });
}

export type AddAdminAccountResult =
  | { ok: true }
  | {
      ok: false;
      code: 'username_required' | 'username_taken' | 'email_taken' | 'password_short' | 'password_mismatch';
    };

export function addAdminAccount(input: {
  username: string;
  email?: string;
  name?: string;
  password: string;
  confirmPassword: string;
}): AddAdminAccountResult {
  const username = input.username.trim();
  const email = (input.email ?? '').trim();
  const name = (input.name ?? username).trim() || username;
  const password = input.password.trim();
  const confirm = input.confirmPassword.trim();

  if (!username) return { ok: false, code: 'username_required' };
  if (isAdminUsernameTaken(username)) return { ok: false, code: 'username_taken' };
  if (email && isAdminEmailTaken(email)) return { ok: false, code: 'email_taken' };
  if (password.length < 4) return { ok: false, code: 'password_short' };
  if (password !== confirm) return { ok: false, code: 'password_mismatch' };

  const record: AdminAccountRecord = {
    id: `admin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    username,
    email,
    name,
    password,
    createdAt: Date.now(),
  };

  writeAdditionalAdminAccounts([...readAdditionalAdminAccounts(), record]);
  return { ok: true };
}

export function removeAdminAccount(id: string): boolean {
  if (id === PRIMARY_ADMIN_ID) return false;
  const next = readAdditionalAdminAccounts().filter((a) => a.id !== id);
  if (next.length === readAdditionalAdminAccounts().length) return false;
  writeAdditionalAdminAccounts(next);
  return true;
}

export function getAdminPasswordForAccount(admin: AdminAccountRecord): string {
  return admin.id === PRIMARY_ADMIN_ID ? resolveAdminPassword() : admin.password;
}

export type ChangeAdminPasswordResult =
  | { ok: true }
  | { ok: false; code: 'wrong_current' | 'too_short' | 'mismatch' | 'same' | 'not_found' };

export function changeAdminPasswordForAccount(
  adminId: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): ChangeAdminPasswordResult {
  const current = currentPassword.trim();
  const next = newPassword.trim();
  const confirm = confirmPassword.trim();

  const admin =
    adminId === PRIMARY_ADMIN_ID
      ? getPrimaryAdminRecord()
      : readAdditionalAdminAccounts().find((a) => a.id === adminId) ?? null;

  if (!admin) return { ok: false, code: 'not_found' };

  const effectivePassword = getAdminPasswordForAccount(admin);
  if (current !== effectivePassword) return { ok: false, code: 'wrong_current' };
  if (next.length < 4) return { ok: false, code: 'too_short' };
  if (next !== confirm) return { ok: false, code: 'mismatch' };
  if (next === current) return { ok: false, code: 'same' };

  if (admin.id === PRIMARY_ADMIN_ID) {
    setStoredAdminPassword(next);
    return { ok: true };
  }

  const list = readAdditionalAdminAccounts().map((a) =>
    a.id === admin.id ? { ...a, password: next } : a,
  );
  writeAdditionalAdminAccounts(list);
  return { ok: true };
}

/** يحدّد المسؤول الحالي من الجلسة (اسم المستخدم) */
export function resolveAdminAccountForSession(username: string): AdminAccountRecord | null {
  const key = normalizeUsername(username);
  return listAllAdminAccounts().find((a) => normalizeUsername(a.username) === key) ?? null;
}

export function changeAdminPasswordForSession(
  username: string,
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): ChangeAdminPasswordResult {
  const admin = resolveAdminAccountForSession(username);
  if (!admin) return { ok: false, code: 'not_found' };
  return changeAdminPasswordForAccount(admin.id, currentPassword, newPassword, confirmPassword);
}
