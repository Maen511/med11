/** Jordan mobile: +962 7 + 7 subscriber digits */
export const JORDAN_PHONE_LOCAL_LENGTH = 7;

export function sanitizeJordanLocalDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, JORDAN_PHONE_LOCAL_LENGTH);
}

export function buildJordanPhone(localDigits: string): string {
  const d = sanitizeJordanLocalDigits(localDigits);
  return `+9627${d}`;
}

export function isValidJordanLocalPhone(localDigits: string): boolean {
  return sanitizeJordanLocalDigits(localDigits).length === JORDAN_PHONE_LOCAL_LENGTH;
}

/** Local 7 digits after +962 7 from stored account/address phone */
export function jordanPhoneToLocalDigits(stored: string): string {
  const digits = stored.replace(/\D/g, '');
  if (digits.startsWith('9627') && digits.length >= 11) return digits.slice(4, 11);
  if (digits.startsWith('07') && digits.length >= 9) return digits.slice(2, 9);
  if (digits.startsWith('7') && digits.length >= 8) return digits.slice(1, 8);
  return sanitizeJordanLocalDigits(digits).slice(0, JORDAN_PHONE_LOCAL_LENGTH);
}

/** Display stored value (+9627… or legacy 07…) for UI */
export function formatJordanPhoneDisplay(stored: string): string {
  const s = stored.trim();
  if (!s) return '';
  const digits = s.replace(/\D/g, '');
  if (digits.startsWith('9627') && digits.length >= 10) {
    return `+962 7${digits.slice(4)}`;
  }
  if (digits.startsWith('07') && digits.length >= 9) {
    return `+962 7${digits.slice(2)}`;
  }
  if (digits.startsWith('7') && digits.length >= 8) {
    return `+962 ${digits}`;
  }
  return s;
}
