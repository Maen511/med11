/** Jordan mobile: +962 + 9 digits (7XXXXXXXX) */
export const JORDAN_PHONE_LOCAL_LENGTH = 9;

export function sanitizeJordanLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('962')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, JORDAN_PHONE_LOCAL_LENGTH);
}

export function buildJordanPhone(localDigits: string): string {
  const d = sanitizeJordanLocalDigits(localDigits);
  return `+962${d}`;
}

export function isValidJordanLocalPhone(localDigits: string): boolean {
  const d = sanitizeJordanLocalDigits(localDigits);
  return d.length === JORDAN_PHONE_LOCAL_LENGTH && /^7\d{8}$/.test(d);
}

/** Local 9 digits (7XXXXXXXX) from stored account/address phone */
export function jordanPhoneToLocalDigits(stored: string): string {
  const digits = stored.replace(/\D/g, '');
  if (digits.startsWith('962') && digits.length >= 12) return digits.slice(3, 12);
  if (digits.startsWith('07') && digits.length >= 10) return digits.slice(1, 10);
  if (digits.startsWith('7') && digits.length >= 9) return digits.slice(0, 9);
  return sanitizeJordanLocalDigits(digits);
}

/** Display stored value for UI */
export function formatJordanPhoneDisplay(stored: string): string {
  const s = stored.trim();
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (digits.startsWith('962') && digits.length >= 12) {
    return `+962 ${digits.slice(3, 12)}`;
  }
  if (digits.startsWith('07') && digits.length >= 10) {
    return `+962 ${digits.slice(1, 10)}`;
  }
  if (digits.startsWith('7') && digits.length >= 9) {
    return `+962 ${digits.slice(0, 9)}`;
  }
  return s;
}
