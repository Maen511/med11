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

const JORDAN_PHONE_EMBEDDED_PATTERNS = [
  /\+?962[\s-]?7\d{2}[\s-]?\d{3}[\s-]?\d{3,4}/g,
  /\+?9627\d{8}/g,
  /(?<!\d)07\d{8}/g,
  /(?<!\d)7\d{8}(?!\d)/g,
] as const;

function phoneKey(stored: string): string {
  return jordanPhoneToLocalDigits(stored);
}

/** أرقام أردنية مدمجة في نص حر (عنوان، تسمية، إلخ) */
export function extractJordanPhonesFromText(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const keys = new Set<string>();
  const out: string[] = [];

  for (const pattern of JORDAN_PHONE_EMBEDDED_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    for (const match of trimmed.matchAll(re)) {
      const raw = match[0];
      const local = jordanPhoneToLocalDigits(raw);
      if (!isValidJordanLocalPhone(local)) continue;
      const key = local;
      if (keys.has(key)) continue;
      keys.add(key);
      out.push(formatJordanPhoneDisplay(buildJordanPhone(local)));
    }
  }

  return out;
}

/** إزالة أرقام الهاتف من نص العنوان */
export function stripJordanPhonesFromText(text: string): string {
  let rest = text;
  for (const pattern of JORDAN_PHONE_EMBEDDED_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    rest = rest.replace(re, '');
  }
  return rest
    .replace(/[,\s·\-—|]+$/g, '')
    .replace(/^[,\s·\-—|]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
