import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAdminEmail,
  getAdminUsername,
  isReservedAdminUsername,
  verifyAdminCredentials,
} from '@/lib/adminAuth';
import { findAdminByCredentials } from '@/lib/adminAccounts';
import {
  changeCustomerPassword,
  getCustomerAccount,
  readCustomerAccountsMap,
  writeCustomerAccountRow,
  verifyCustomerAccessCode,
  type ChangeCustomerPasswordResult,
  type CustomerAccountSnapshot,
} from '@/lib/customerAccounts';
import { notifyAdminNewCustomerSignup } from '@/lib/adminCustomerSignupNotifications';
import { seedAddressesFromUserProfileIfEmpty } from '@/lib/customerAddresses';
import { reconcileGrantedSectionIds } from '@/lib/storeNav';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';

export type UserAddress = { id: string; label?: string; line: string };

export type AppUser = {
  id: string;
  /** معرف الدخول (فريد على الجهاز) */
  username: string;
  name: string;
  email: string;
  phone: string;
  addresses: UserAddress[];
  role: 'admin' | 'user';
};

type Session = {
  user: AppUser;
  catalogUnlocked: boolean;
  grantedSectionIds: string[];
};

const SESSION_KEY = 'med-session';
const LEGACY_USER_KEY = 'med-user';

const SYNTHETIC_EMAIL_SUFFIX = '@user.local';

export function syntheticEmailForUsername(usernameLower: string): string {
  return `${usernameLower}${SYNTHETIC_EMAIL_SUFFIX}`;
}

function accountKeyForUsername(username: string): string {
  return username.trim().toLowerCase();
}

function accessFromRow(row: CustomerAccountSnapshot | undefined) {
  return {
    catalogUnlocked: Boolean(row?.catalogUnlocked),
    grantedSectionIds: Array.isArray(row?.grantedSectionIds) ? [...row.grantedSectionIds] : [],
  };
}

function normalizeSessionUser(u: AppUser): AppUser {
  const role = u.role === 'admin' ? 'admin' : 'user';
  if (role === 'admin') {
    return {
      ...u,
      role: 'admin',
      username: (u.username || 'admin').trim() || 'admin',
      addresses: Array.isArray(u.addresses) ? u.addresses : [],
    };
  }
  let username = (u.username || '').trim();
  if (!username && u.email?.includes('@')) {
    username = u.email.split('@')[0] || '';
  }
  if (!username) username = `user-${(u.id || 'x').slice(-6)}`;
  const email =
    u.email?.trim() ||
    syntheticEmailForUsername(accountKeyForUsername(username));
  const name = (u.name || '').trim() || username;
  return {
    ...u,
    role: 'user',
    username,
    email: email.toLowerCase(),
    name,
    phone: (u.phone || '').trim(),
    addresses: Array.isArray(u.addresses) ? u.addresses : [],
  };
}

function migrateLegacyUser(): void {
  try {
    if (localStorage.getItem(SESSION_KEY)) return;
    const raw = localStorage.getItem(LEGACY_USER_KEY);
    if (!raw) return;
    const u = JSON.parse(raw) as {
      id?: string;
      email?: string;
      name?: string;
      phone?: string;
      role?: string;
      addresses?: UserAddress[];
    };
    const email = u.email || '';
    const username = email.includes('@') ? email.split('@')[0] || 'user' : email || 'user';
    const user: AppUser = {
      id: u.id || `u-${Date.now()}`,
      username,
      email: email || syntheticEmailForUsername(accountKeyForUsername(username)),
      name: u.name || username,
      phone: u.phone || '',
      addresses: Array.isArray(u.addresses) ? u.addresses : [],
      role: u.role === 'admin' ? 'admin' : 'user',
    };
    const catalogUnlocked = user.role === 'admin';
    const session: Session = {
      user: normalizeSessionUser(user),
      catalogUnlocked,
      grantedSectionIds: [],
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {}
}

function readSession(): Session | null {
  migrateLegacyUser();
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    if (!s?.user) return null;
    s.user = normalizeSessionUser(s.user);
    if (s.user.role === 'admin') {
      if (!s.user.email || !s.user.name) return null;
    } else {
      if (!s.user.username || !s.user.name) return null;
    }
    if (typeof s.catalogUnlocked !== 'boolean') s.catalogUnlocked = s.user.role === 'admin';
    if (!Array.isArray(s.grantedSectionIds)) s.grantedSectionIds = [];
    if (s.user.role !== 'admin') {
      s.grantedSectionIds = reconcileGrantedSectionIds(s.grantedSectionIds, s.catalogUnlocked);
    }
    return s;
  } catch {
    return null;
  }
}

export type CustomerRegistration = {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
};

export type RegisterCustomerResult = 'ok' | 'username_taken' | 'email_taken' | 'invalid';

interface AuthContextType {
  user: AppUser | null;
  isLoggedIn: boolean;
  canAccessCatalog: boolean;
  hasPendingCatalogCode: boolean;
  isAdmin: boolean;
  grantedSectionIds: string[];
  canAccessSection: (sectionId: string) => boolean;
  registerCustomer: (data: CustomerRegistration) => RegisterCustomerResult;
  loginCustomer: (username: string, password: string) => boolean;
  verifyCatalogCode: (code: string) => boolean;
  adminLogin: (identifier: string, password: string) => boolean;
  changeCustomerPassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) => ChangeCustomerPasswordResult;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const syncSessionFromAccountStore = useCallback((username: string) => {
    const key = accountKeyForUsername(username);
    const row = readCustomerAccountsMap()[key];
    if (!row?.user) return;
    setSession((prev) => {
      if (!prev || prev.user.role === 'admin') return prev;
      if (accountKeyForUsername(prev.user.username) !== key) return prev;
      const access = accessFromRow(row);
      const sameUser =
        prev.user.id === row.user.id &&
        prev.user.username === row.user.username &&
        prev.user.email === row.user.email &&
        prev.user.name === row.user.name &&
        prev.user.phone === row.user.phone;
      const sameAccess =
        prev.catalogUnlocked === access.catalogUnlocked &&
        prev.grantedSectionIds.length === access.grantedSectionIds.length &&
        prev.grantedSectionIds.every((id, i) => id === access.grantedSectionIds[i]);
      if (sameUser && sameAccess) return prev;
      return {
        user: row.user,
        catalogUnlocked: access.catalogUnlocked,
        grantedSectionIds: access.grantedSectionIds,
      };
    });
  }, []);

  useEffect(() => {
    if (session) {
      try {
        const { user, catalogUnlocked, grantedSectionIds } = session;
        const persistUser = user.role === 'admin' ? user : normalizeSessionUser(user);
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ user: persistUser, catalogUnlocked, grantedSectionIds })
        );
      } catch {}
    } else {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {}
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user || session.user.role === 'admin') return;
    const key = accountKeyForUsername(session.user.username);
    const map = readCustomerAccountsMap();
    const prev = map[key];
    writeCustomerAccountRow(key, {
      user: session.user,
      catalogUnlocked: session.catalogUnlocked,
      grantedSectionIds: session.grantedSectionIds,
      accessCode: prev?.accessCode ?? '',
      password: prev?.password ?? '',
    });
  }, [session]);

  useEffect(() => {
    const onAccountsChanged = () => {
      if (session?.user?.role !== 'user') return;
      if (!getCustomerAccount(session.user.username)) {
        setSession(null);
        return;
      }
      syncSessionFromAccountStore(session.user.username);
    };
    window.addEventListener('med-customer-accounts-changed', onAccountsChanged);
    return () => window.removeEventListener('med-customer-accounts-changed', onAccountsChanged);
  }, [session?.user?.username, session?.user?.role, syncSessionFromAccountStore]);

  useEffect(() => {
    const onCatalogChanged = () => {
      if (!session?.user || session.user.role === 'admin') return;
      const next = reconcileGrantedSectionIds(session.grantedSectionIds, session.catalogUnlocked);
      if (
        next.length === session.grantedSectionIds.length &&
        next.every((id, i) => id === session.grantedSectionIds[i])
      ) {
        return;
      }
      setSession((prev) => (prev ? { ...prev, grantedSectionIds: next } : null));
    };
    window.addEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged);
    return () => window.removeEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged);
  }, [session]);

  const user = session?.user ?? null;
  const catalogUnlocked = session?.catalogUnlocked ?? false;
  const grantedSectionIds = session?.grantedSectionIds ?? [];
  const isAdmin = user?.role === 'admin';
  const isLoggedIn = Boolean(user);
  const canAccessCatalog = Boolean(
    user && (isAdmin || (catalogUnlocked && grantedSectionIds.length > 0))
  );
  const hasPendingCatalogCode = Boolean(
    user && !isAdmin && !catalogUnlocked
  );

  const canAccessSection = useCallback(
    (sectionId: string) => {
      if (isAdmin) return true;
      if (!catalogUnlocked) return false;
      return grantedSectionIds.includes(sectionId);
    },
    [isAdmin, catalogUnlocked, grantedSectionIds]
  );

  const registerCustomer = useCallback((data: CustomerRegistration): RegisterCustomerResult => {
    const usernameRaw = data.username.trim();
    const key = accountKeyForUsername(usernameRaw);
    const emailLower = data.email.trim().toLowerCase();
    const name = data.name.trim();
    const phone = data.phone.trim();
    if (!key || !data.password || !emailLower || !name || !phone) return 'invalid';
    const map = readCustomerAccountsMap();
    if (map[key]) return 'username_taken';
    const emailTaken = Object.values(map).some((row) => row.user?.email?.toLowerCase() === emailLower);
    if (emailTaken) return 'email_taken';
    const id = `user-${Date.now()}`;
    const nextUser: AppUser = {
      id,
      username: usernameRaw,
      name,
      email: emailLower,
      phone,
      addresses: [],
      role: 'user',
    };
    const row: CustomerAccountSnapshot = {
      user: nextUser,
      catalogUnlocked: false,
      accessCode: '',
      grantedSectionIds: [],
      password: data.password,
    };
    writeCustomerAccountRow(key, row);
    notifyAdminNewCustomerSignup({
      userId: id,
      username: usernameRaw,
      name,
      email: emailLower,
      phone,
      createdAt: Date.now(),
    });
    setSession({ user: nextUser, catalogUnlocked: false, grantedSectionIds: [] });
    seedAddressesFromUserProfileIfEmpty(nextUser);
    return 'ok';
  }, []);

  const loginCustomer = useCallback((username: string, password: string): boolean => {
    if (isReservedAdminUsername(username)) return false;
    const key = accountKeyForUsername(username);
    if (!key || !password) return false;
    const map = readCustomerAccountsMap();
    const row = map[key];
    if (!row?.user || row.user.role !== 'user') return false;
    if (row.password !== password) return false;
    const access = accessFromRow(row);
    setSession({
      user: row.user,
      catalogUnlocked: access.catalogUnlocked,
      grantedSectionIds: access.grantedSectionIds,
    });
    seedAddressesFromUserProfileIfEmpty(row.user);
    return true;
  }, []);

  const verifyCatalogCode = useCallback(
    (code: string) => {
      const username = session?.user?.username;
      if (!username || session?.user.role === 'admin') return false;

      const row = readCustomerAccountsMap()[accountKeyForUsername(username)];
      if (!row?.accessCode) return false;

      const ok = verifyCustomerAccessCode(username, code);
      setSession((prev) => {
        if (!prev || prev.user.role === 'admin') return prev;
        if (ok) {
          return {
            ...prev,
            catalogUnlocked: true,
            grantedSectionIds: [...row.grantedSectionIds],
          };
        }
        return { ...prev, catalogUnlocked: false };
      });

      if (ok) {
        writeCustomerAccountRow(accountKeyForUsername(username), {
          ...row,
          catalogUnlocked: true,
        });
      } else if (row.catalogUnlocked) {
        writeCustomerAccountRow(accountKeyForUsername(username), {
          ...row,
          catalogUnlocked: false,
        });
      }

      return ok;
    },
    [session?.user?.username, session?.user?.role]
  );

  const adminLogin = useCallback((identifier: string, password: string): boolean => {
    const matched = findAdminByCredentials(identifier, password);
    if (!matched) return false;
    const adminUser: AppUser = {
      id: matched.id,
      username: matched.username,
      email: matched.email || getAdminEmail(),
      name: matched.name || 'Admin',
      phone: '',
      addresses: [],
      role: 'admin',
    };
    const next: Session = { user: adminUser, catalogUnlocked: true, grantedSectionIds: [] };
    setSession(next);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {}
    return true;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem('med-cart');
    } catch {}
  }, []);

  const changeCustomerPasswordForUser = useCallback(
    (currentPassword: string, newPassword: string, confirmPassword: string): ChangeCustomerPasswordResult => {
      const username = session?.user?.username;
      if (!username || session?.user?.role !== 'user') {
        return { ok: false, code: 'not_found' };
      }
      return changeCustomerPassword(username, currentPassword, newPassword, confirmPassword);
    },
    [session?.user?.username, session?.user?.role],
  );

  const contextValue = useMemo(
    () => ({
      user,
      isLoggedIn,
      canAccessCatalog,
      hasPendingCatalogCode,
      isAdmin,
      grantedSectionIds,
      canAccessSection,
      registerCustomer,
      loginCustomer,
      verifyCatalogCode,
      adminLogin,
      changeCustomerPassword: changeCustomerPasswordForUser,
      logout,
    }),
    [
      user,
      isLoggedIn,
      canAccessCatalog,
      hasPendingCatalogCode,
      isAdmin,
      grantedSectionIds,
      canAccessSection,
      registerCustomer,
      loginCustomer,
      verifyCatalogCode,
      adminLogin,
      changeCustomerPasswordForUser,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
