export function getAdminUsername(): string {
  const fromEnv = import.meta.env.VITE_ADMIN_USERNAME as string | undefined;
  return (fromEnv && fromEnv.trim()) || 'Sadmin';
}

export function getAdminEmail(): string {
  const fromEnv = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
  return (fromEnv && fromEnv.trim()) || 'admin@company.com';
}
