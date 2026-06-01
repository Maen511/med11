import { JORDAN_CITIES } from '@/lib/storeLocale';
import {
  buildJordanPhone,
  isValidJordanLocalPhone,
  JORDAN_PHONE_LOCAL_LENGTH,
  sanitizeJordanLocalDigits,
} from '@/lib/jordanPhone';
import {
  readCustomerAddresses,
  writeCustomerAddresses,
  writeSelectedAddressId,
  type CustomerDeliveryAddress,
} from '@/lib/customerAddresses';
import type { AppUser } from '@/contexts/AuthContext';

export const ADDRESS_COUNTRY_OPTIONS = [
  {
    id: 'jo',
    name: { en: 'Jordan', ar: 'الأردن' },
    cities: JORDAN_CITIES,
  },
] as const;

export type AddressFormInput = {
  countryId: string;
  extraPhoneLocal1: string;
  extraPhoneLocal2: string;
  street: string;
  building: string;
  city: string;
  landmark: string;
  instructions: string;
  isPrimary: boolean;
  isGift: boolean;
  recipientName: string;
  giftNote: string;
};

export function createEmptyAddressFormInput(countryId = 'jo', defaultPrimary = false): AddressFormInput {
  return {
    countryId,
    extraPhoneLocal1: '',
    extraPhoneLocal2: '',
    street: '',
    building: '',
    city: '',
    landmark: '',
    instructions: '',
    isPrimary: defaultPrimary,
    isGift: false,
    recipientName: '',
    giftNote: '',
  };
}

export function getAddressCountryById(id: string | undefined) {
  return ADDRESS_COUNTRY_OPTIONS.find((c) => c.id === id) || ADDRESS_COUNTRY_OPTIONS[0];
}

function parseExtraPhones(
  form: AddressFormInput,
  accountPhone: string,
): { ok: true; phones: string[] } | { ok: false; reason: 'invalid_extra_phone' | 'duplicate_extra' } {
  const built: string[] = [];
  const fields = [
    { digits: sanitizeJordanLocalDigits(form.extraPhoneLocal1), index: 1 },
    { digits: sanitizeJordanLocalDigits(form.extraPhoneLocal2), index: 2 },
  ];

  for (const { digits } of fields) {
    if (!digits) continue;
    if (!isValidJordanLocalPhone(digits)) {
      return { ok: false, reason: 'invalid_extra_phone' };
    }
    const e164 = buildJordanPhone(digits);
    if (e164 === accountPhone) {
      return { ok: false, reason: 'duplicate_extra' };
    }
    if (built.includes(e164)) {
      return { ok: false, reason: 'duplicate_extra' };
    }
    built.push(e164);
  }
  return { ok: true, phones: built };
}

export type SaveAddressResult =
  | { ok: true; addressId: string }
  | {
      ok: false;
      reason:
        | 'no_user'
        | 'no_name'
        | 'no_phone'
        | 'invalid_extra_phone'
        | 'duplicate_extra'
        | 'missing_fields'
        | 'storage_failed';
    };

export function saveNewCustomerAddress(
  user: AppUser | null | undefined,
  form: AddressFormInput,
  language: 'en' | 'ar',
  options?: { forcePrimary?: boolean },
): SaveAddressResult {
  if (!user) return { ok: false, reason: 'no_user' };

  const accountName = (user.name || '').trim();
  const accountPhone = (user.phone || '').trim();
  if (!accountName) return { ok: false, reason: 'no_name' };
  if (!accountPhone) return { ok: false, reason: 'no_phone' };

  const extraResult = parseExtraPhones(form, accountPhone);
  if (extraResult.ok === false) {
    return { ok: false, reason: extraResult.reason };
  }

  if (!form.street.trim() || !form.city) return { ok: false, reason: 'missing_fields' };

  const existing = readCustomerAddresses(user);
  const label = `${form.building || form.street}${form.city ? `, ${form.city}` : ''}`.trim();
  const details = [form.street, form.building, form.landmark].filter(Boolean).join(' — ');

  const record: CustomerDeliveryAddress = {
    id: `addr-${Date.now().toString(36)}`,
    label,
    city: form.city || undefined,
    details,
    fullName: accountName,
    country: getAddressCountryById(form.countryId).name[language],
    phone: accountPhone,
    extraPhones: extraResult.phones.length > 0 ? extraResult.phones : undefined,
    street: form.street,
    building: form.building,
    landmark: form.landmark || undefined,
    instructions: form.instructions || undefined,
    isPrimary: false,
    isGift: form.isGift || undefined,
    recipientName: form.isGift ? form.recipientName || undefined : undefined,
    giftNote: form.isGift ? form.giftNote || undefined : undefined,
  };

  const shouldBePrimary = options?.forcePrimary ?? (form.isPrimary || existing.length === 0);
  const next = [
    { ...record, isPrimary: shouldBePrimary },
    ...existing.map((a) => ({ ...a, isPrimary: shouldBePrimary ? false : a.isPrimary })),
  ];

  if (!writeCustomerAddresses(user, next)) return { ok: false, reason: 'storage_failed' };

  if (shouldBePrimary) {
    writeSelectedAddressId(user, record.id);
  }

  return { ok: true, addressId: record.id };
}

export function saveAddressErrorMessage(
  reason: Exclude<SaveAddressResult, { ok: true }>['reason'],
  language: 'en' | 'ar',
): string {
  const isRtl = language === 'ar';
  switch (reason) {
    case 'no_user':
      return isRtl ? 'سجّل الدخول أولاً.' : 'Please sign in first.';
    case 'no_name':
      return isRtl ? 'أكمل اسمك في الملف الشخصي.' : 'Complete your name in profile.';
    case 'no_phone':
      return isRtl ? 'أضف رقم هاتفك في حسابك.' : 'Add your phone on your account.';
    case 'invalid_extra_phone':
      return isRtl
        ? `أدخل ${JORDAN_PHONE_LOCAL_LENGTH} أرقام كاملة للرقم الإضافي أو اترك الحقل فارغاً.`
        : `Enter all ${JORDAN_PHONE_LOCAL_LENGTH} digits for extra numbers or leave blank.`;
    case 'duplicate_extra':
      return isRtl ? 'رقم إضافي مكرر أو يطابق رقم حسابك.' : 'Duplicate extra number or same as account phone.';
    case 'missing_fields':
      return isRtl ? 'أدخل الشارع والمدينة.' : 'Enter street and city.';
    case 'storage_failed':
      return isRtl ? 'تعذّر حفظ العنوان.' : 'Could not save address.';
    default:
      return isRtl ? 'حدث خطأ.' : 'Something went wrong.';
  }
}
