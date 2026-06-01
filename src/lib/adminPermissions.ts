import { PRIMARY_ADMIN_ID, resolveAdminAccountForSession } from '@/lib/adminAccounts';

/** Only the primary (env) admin account may open Settings (password + manage other admins). */
export function canAccessAdminSettings(username: string | undefined | null): boolean {
  if (!username?.trim()) return false;
  const admin = resolveAdminAccountForSession(username);
  return admin?.id === PRIMARY_ADMIN_ID;
}
