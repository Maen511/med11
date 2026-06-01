const ADMIN_PASSWORD_KEY = 'med-admin-password';

function getEnvAdminPassword(): string {
  const fromEnv = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;
  if (fromEnv !== undefined && fromEnv !== null && String(fromEnv).length > 0) {
    return String(fromEnv);
  }
  return '111';
}

export function getStoredAdminPassword(): string | null {
  try {
    const raw = localStorage.getItem(ADMIN_PASSWORD_KEY);
    if (!raw || !raw.trim()) return null;
    return raw;
  } catch {
    return null;
  }
}

export function resolveAdminPassword(): string {
  return getStoredAdminPassword() ?? getEnvAdminPassword();
}

export function setStoredAdminPassword(password: string) {
  try {
    localStorage.setItem(ADMIN_PASSWORD_KEY, password.trim());
  } catch {}
}
