import { findAdminByCredentials, isAdminUsernameTaken, listAllAdminAccounts } from '@/lib/adminAccounts';
import { getAdminEmail, getAdminUsername } from '@/lib/adminEnv';
import { resolveAdminPassword } from '@/lib/adminPasswordStore';

export { getAdminUsername, getAdminEmail } from '@/lib/adminEnv';

export function getAdminPassword(): string {
  return resolveAdminPassword();
}

function normalizeIdentifier(identifier: string): string {
  return identifier.trim();
}

function normalizePassword(password: string): string {
  return password.trim();
}

export function verifyAdminCredentials(identifier: string, password: string): boolean {
  const id = normalizeIdentifier(identifier);
  const pw = normalizePassword(password);
  if (!id || !pw) return false;
  return findAdminByCredentials(id, pw) !== null;
}

export function isReservedAdminUsername(username: string): boolean {
  return isAdminUsernameTaken(username);
}

export function getAllAdminUsernames(): string[] {
  return listAllAdminAccounts().map((a) => a.username);
}
