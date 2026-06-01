import type { AppUser } from '@/contexts/AuthContext';

export type CustomerDeliveryAddress = {
  id: string;
  label: string;
  details: string;
  city?: string;
  fullName?: string;
  country?: string;
  phone?: string;
  extraPhones?: string[];
  street?: string;
  building?: string;
  landmark?: string;
  instructions?: string;
  isPrimary?: boolean;
  isGift?: boolean;
  recipientName?: string;
  giftNote?: string;
};

export const CUSTOMER_ADDRESSES_CHANGED = 'med-customer-addresses-changed';

export function getCustomerAddressesKey(user: { email?: string; username?: string } | null | undefined): string {
  const email = user?.email?.trim().toLowerCase();
  if (email) return `med-addresses:${email}`;
  const username = user?.username?.trim().toLowerCase();
  if (username) return `med-addresses:user:${username}`;
  return 'med-addresses:guest';
}

export function getCustomerSelectedAddressKey(
  user: { email?: string; username?: string } | null | undefined,
): string {
  const base = getCustomerAddressesKey(user);
  return base.replace('med-addresses:', 'med-selected-address:');
}

export function readCustomerAddresses(
  user: { email?: string; username?: string } | null | undefined,
): CustomerDeliveryAddress[] {
  try {
    const raw = localStorage.getItem(getCustomerAddressesKey(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomerDeliveryAddress[]) : [];
  } catch {
    return [];
  }
}

export function writeCustomerAddresses(
  user: { email?: string; username?: string } | null | undefined,
  addresses: CustomerDeliveryAddress[],
): boolean {
  const key = getCustomerAddressesKey(user);
  try {
    localStorage.setItem(key, JSON.stringify(addresses));
    window.dispatchEvent(new CustomEvent(CUSTOMER_ADDRESSES_CHANGED, { detail: { key } }));
    return true;
  } catch {
    return false;
  }
}

export function readSelectedAddressId(user: { email?: string; username?: string } | null | undefined): string {
  try {
    return localStorage.getItem(getCustomerSelectedAddressKey(user)) || '';
  } catch {
    return '';
  }
}

export function writeSelectedAddressId(
  user: { email?: string; username?: string } | null | undefined,
  id: string | null,
): void {
  const key = getCustomerSelectedAddressKey(user);
  try {
    if (id) localStorage.setItem(key, id);
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Legacy: seed checkout storage from profile only when nothing saved yet — never wipe existing rows. */
export function seedAddressesFromUserProfileIfEmpty(user: AppUser): void {
  const key = getCustomerAddressesKey(user);
  try {
    const existing = readCustomerAddresses(user);
    if (existing.length > 0) return;
    if (!user.addresses?.length) return;

    const mapped: CustomerDeliveryAddress[] = user.addresses.map((a, i) => ({
      id: a.id,
      label: a.label || (i === 0 ? 'Default' : `Address ${i + 1}`),
      details: a.line,
    }));
    if (mapped.length === 0) return;

    localStorage.setItem(key, JSON.stringify(mapped));
    writeSelectedAddressId(user, mapped[0].id);
  } catch {
    /* ignore */
  }
}
