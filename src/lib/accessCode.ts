/** مفتاح localStorage يحدّده الأدمن من لوحة التحكم */
export const STORE_ACCESS_CODE_KEY = 'med-store-access-code';

function normalizeCode(s: string) {
  return s.trim().toUpperCase();
}

/** الرمز المتوقّع: من التخزين المحلي ثم VITE_CATALOG_ACCESS_CODE ثم افتراضي `333` */
export function getExpectedAccessCode(): string {
  try {
    const fromLs = localStorage.getItem(STORE_ACCESS_CODE_KEY)?.trim();
    if (fromLs) return normalizeCode(fromLs);
  } catch {}
  const env = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_CATALOG_ACCESS_CODE : undefined;
  if (typeof env === 'string' && env.trim()) return normalizeCode(env.trim());
  return '333';
}

export function setStoreAccessCode(code: string) {
  const normalized = normalizeCode(code);
  try {
    localStorage.setItem(STORE_ACCESS_CODE_KEY, normalized);
  } catch {}
}

export function codesMatch(entered: string, expected: string) {
  return normalizeCode(entered) === normalizeCode(expected);
}
