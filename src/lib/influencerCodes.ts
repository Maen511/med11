import { getSectionIdForProduct } from '@/lib/products';

export const INFLUENCER_CODES_KEY = 'med-influencer-codes';
export const INFLUENCER_CODES_CHANGED = 'med-influencer-codes-changed';

export type InfluencerDiscountType = 'percent' | 'fixed';
export type InfluencerSectionScope = 'all' | 'section';

export type InfluencerCode = {
  id: string;
  /** Uppercase alphanumeric + hyphen/underscore */
  code: string;
  influencerName: string;
  discountType: InfluencerDiscountType;
  /** Percent: 1–100. Fixed: amount in JOD. */
  discountValue: number;
  enabled: boolean;
  createdAt: number;
  expiresAt?: number | null;
  maxUses?: number | null;
  usedCount: number;
  /** all = entire cart eligible base; section = only products in sectionId */
  sectionScope: InfluencerSectionScope;
  sectionId: string | null;
};

export type InfluencerCodeValidationError =
  | 'not_found'
  | 'disabled'
  | 'expired'
  | 'max_uses'
  | 'empty_cart'
  | 'no_section_items';

export type PromoCartLine = {
  id: number;
  price: number;
  quantity: number;
};

export type AppliedInfluencerCode = {
  code: InfluencerCode;
  /** Full cart subtotal before discount */
  subtotal: number;
  /** Subtotal of lines the code applies to */
  eligibleSubtotal: number;
  discountAmount: number;
  total: number;
};

function readRaw(): InfluencerCode[] {
  try {
    const raw = localStorage.getItem(INFLUENCER_CODES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeStoredCode).filter(Boolean) as InfluencerCode[] : [];
  } catch {
    return [];
  }
}

function writeRaw(codes: InfluencerCode[]): void {
  localStorage.setItem(INFLUENCER_CODES_KEY, JSON.stringify(codes));
  window.dispatchEvent(new Event(INFLUENCER_CODES_CHANGED));
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function normalizePromoCodeInput(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

function normalizeDiscountType(value: unknown): InfluencerDiscountType {
  return value === 'fixed' ? 'fixed' : 'percent';
}

function normalizeSectionScope(value: unknown): InfluencerSectionScope {
  return value === 'section' ? 'section' : 'all';
}

export function cartLinesSubtotal(lines: PromoCartLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));
}

export function influencerCodeAppliesToProduct(code: InfluencerCode, productId: number): boolean {
  if (code.sectionScope !== 'section' || !code.sectionId) return true;
  return getSectionIdForProduct(productId) === code.sectionId;
}

export function eligibleSubtotalForInfluencerCode(
  lines: PromoCartLine[],
  code: InfluencerCode,
): number {
  return roundMoney(
    lines
      .filter((line) => influencerCodeAppliesToProduct(code, line.id))
      .reduce((sum, line) => sum + line.price * line.quantity, 0),
  );
}

/** Stable id for legacy rows saved without `id` (must not change between reads). */
function stableCodeId(code: string, rawId: unknown): string {
  const id = typeof rawId === 'string' ? rawId.trim() : '';
  if (id.length > 0) return id;
  return `promo-${code}`;
}

function normalizeStoredCode(raw: unknown): InfluencerCode | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as InfluencerCode;
  const code = normalizePromoCodeInput(String(r.code ?? ''));
  if (!code) return null;
  const discountType = normalizeDiscountType(r.discountType);
  let discountValue = Number(r.discountValue);
  if (!Number.isFinite(discountValue) || discountValue <= 0) return null;
  if (discountType === 'percent') discountValue = Math.min(100, Math.max(1, discountValue));
  else discountValue = roundMoney(discountValue);

  return {
    id: stableCodeId(code, r.id),
    code,
    influencerName: String(r.influencerName ?? '').trim() || code,
    discountType,
    discountValue,
    enabled: r.enabled !== false,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    expiresAt: typeof r.expiresAt === 'number' ? r.expiresAt : r.expiresAt === null ? null : undefined,
    maxUses:
      typeof r.maxUses === 'number' && r.maxUses > 0
        ? Math.floor(r.maxUses)
        : r.maxUses === null
          ? null
          : undefined,
    usedCount: Math.max(0, Math.floor(Number(r.usedCount) || 0)),
    ...(() => {
      const scope = normalizeSectionScope((r as InfluencerCode).sectionScope);
      const sid =
        typeof (r as InfluencerCode).sectionId === 'string'
          ? (r as InfluencerCode).sectionId!.trim()
          : '';
      if (scope === 'section' && sid) {
        return { sectionScope: 'section' as const, sectionId: sid };
      }
      return { sectionScope: 'all' as const, sectionId: null };
    })(),
  };
}

export function readInfluencerCodes(): InfluencerCode[] {
  const codes = readRaw().sort((a, b) => b.createdAt - a.createdAt);
  try {
    const raw = localStorage.getItem(INFLUENCER_CODES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const needsMigrate =
      Array.isArray(parsed) &&
      parsed.some(
        (row) =>
          !row ||
          typeof row !== 'object' ||
          !String((row as InfluencerCode).id ?? '').trim(),
      );
    if (needsMigrate) {
      localStorage.setItem(INFLUENCER_CODES_KEY, JSON.stringify(codes));
    }
  } catch {
    /* ignore */
  }
  return codes;
}

export function saveInfluencerCodes(codes: InfluencerCode[]): void {
  writeRaw(codes.map((c) => normalizeStoredCode(c)).filter(Boolean) as InfluencerCode[]);
}

export function findInfluencerCodeByInput(input: string): InfluencerCode | undefined {
  const normalized = normalizePromoCodeInput(input);
  if (!normalized) return undefined;
  return readInfluencerCodes().find((c) => c.code === normalized);
}

export function computeDiscountAmount(subtotal: number, code: InfluencerCode): number {
  if (subtotal <= 0) return 0;
  if (code.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, code.discountValue));
    return roundMoney(subtotal * (pct / 100));
  }
  return roundMoney(Math.min(subtotal, Math.max(0, code.discountValue)));
}

export function validateInfluencerCode(
  input: string,
  lines: PromoCartLine[],
): { ok: true; code: InfluencerCode } | { ok: false; error: InfluencerCodeValidationError } {
  const cartSubtotal = cartLinesSubtotal(lines);
  if (cartSubtotal <= 0) return { ok: false, error: 'empty_cart' };
  const normalized = normalizePromoCodeInput(input);
  if (!normalized) return { ok: false, error: 'not_found' };
  const code = findInfluencerCodeByInput(normalized);
  if (!code) return { ok: false, error: 'not_found' };
  if (!code.enabled) return { ok: false, error: 'disabled' };
  if (typeof code.expiresAt === 'number' && Date.now() > code.expiresAt) {
    return { ok: false, error: 'expired' };
  }
  if (typeof code.maxUses === 'number' && code.usedCount >= code.maxUses) {
    return { ok: false, error: 'max_uses' };
  }
  const eligible = eligibleSubtotalForInfluencerCode(lines, code);
  if (code.sectionScope === 'section' && eligible <= 0) {
    return { ok: false, error: 'no_section_items' };
  }
  return { ok: true, code };
}

export function applyInfluencerCode(input: string, lines: PromoCartLine[]): AppliedInfluencerCode | null {
  const result = tryApplyInfluencerCode(input, lines);
  return result.ok ? result.applied : null;
}

export function tryApplyInfluencerCode(
  input: string,
  lines: PromoCartLine[],
):
  | { ok: true; applied: AppliedInfluencerCode }
  | { ok: false; error: InfluencerCodeValidationError } {
  const validation = validateInfluencerCode(input, lines);
  if (validation.ok === false) {
    return { ok: false, error: validation.error };
  }
  const cartSubtotal = cartLinesSubtotal(lines);
  const eligibleSubtotal = eligibleSubtotalForInfluencerCode(lines, validation.code);
  const discountAmount = computeDiscountAmount(eligibleSubtotal, validation.code);
  const total = roundMoney(Math.max(0, cartSubtotal - discountAmount));
  return {
    ok: true,
    applied: {
      code: validation.code,
      subtotal: cartSubtotal,
      eligibleSubtotal,
      discountAmount,
      total,
    },
  };
}

export function recordInfluencerCodeUse(codeInput: string): void {
  const normalized = normalizePromoCodeInput(codeInput);
  if (!normalized) return;
  const codes = readRaw();
  const idx = codes.findIndex((c) => c.code === normalized);
  if (idx < 0) return;
  codes[idx] = { ...codes[idx], usedCount: codes[idx].usedCount + 1 };
  writeRaw(codes);
}

export function upsertInfluencerCode(
  patch: Omit<InfluencerCode, 'id' | 'createdAt' | 'usedCount'> & {
    id?: string;
    createdAt?: number;
    usedCount?: number;
  },
): InfluencerCode {
  const codeKey = normalizePromoCodeInput(patch.code);
  const patchId = patch.id?.trim() || undefined;

  const normalized = normalizeStoredCode({
    ...patch,
    code: codeKey,
    id: patchId ?? crypto.randomUUID(),
    createdAt: patch.createdAt ?? Date.now(),
    usedCount: patch.usedCount ?? 0,
  });
  if (!normalized) throw new Error('invalid_code');
  if (normalized.sectionScope === 'section' && !normalized.sectionId) {
    throw new Error('invalid_section');
  }

  const codes = readRaw();

  let idx = patchId ? codes.findIndex((c) => c.id === patchId) : -1;
  if (idx < 0) {
    idx = codes.findIndex((c) => c.code === normalized.code);
  }

  const duplicate = codes.findIndex(
    (c) => c.code === normalized.code && (idx < 0 || c.id !== codes[idx].id),
  );
  if (duplicate >= 0) throw new Error('duplicate_code');

  if (idx >= 0) {
    const prev = codes[idx];
    codes[idx] = {
      ...normalized,
      id: prev.id,
      usedCount: prev.usedCount,
      createdAt: prev.createdAt,
    };
  } else {
    codes.push(normalized);
  }
  writeRaw(codes);
  return idx >= 0 ? codes[idx] : normalized;
}

export function deleteInfluencerCode(id: string): void {
  writeRaw(readRaw().filter((c) => c.id !== id));
}

export function toggleInfluencerCodeEnabled(id: string, enabled: boolean): void {
  const codes = readRaw();
  const idx = codes.findIndex((c) => c.id === id);
  if (idx < 0) return;
  codes[idx] = { ...codes[idx], enabled };
  writeRaw(codes);
}

export function influencerCodeErrorMessage(
  error: InfluencerCodeValidationError,
  language: 'en' | 'ar',
): string {
  const messages: Record<InfluencerCodeValidationError, { en: string; ar: string }> = {
    not_found: { en: 'Invalid promo code', ar: 'كود الخصم غير صحيح' },
    disabled: { en: 'This code is not active', ar: 'هذا الكود غير مفعّل' },
    expired: { en: 'This code has expired', ar: 'انتهت صلاحية هذا الكود' },
    max_uses: { en: 'This code has reached its usage limit', ar: 'وصل هذا الكود للحد الأقصى للاستخدام' },
    empty_cart: { en: 'Add items to your cart first', ar: 'أضف منتجات للسلة أولاً' },
    no_section_items: {
      en: 'This code applies only to products from a specific section — add matching items',
      ar: 'هذا الكود للخصم على قسم معيّن — أضف منتجات من ذلك القسم',
    },
  };
  return messages[error][language];
}

export function discountTypeLabel(type: InfluencerDiscountType, language: 'en' | 'ar'): string {
  return type === 'percent'
    ? language === 'ar'
      ? 'نسبة مئوية'
      : 'Percentage'
    : language === 'ar'
      ? 'مبلغ ثابت'
      : 'Fixed amount';
}

export type InfluencerCodeListFilter = {
  query: string;
  status: 'all' | 'enabled' | 'disabled';
  discountType: 'all' | InfluencerDiscountType;
  expiry: 'all' | 'active' | 'expired';
  sectionId: 'all' | string;
};

export function formatInfluencerCodeSectionLabel(
  code: InfluencerCode,
  language: 'en' | 'ar',
  sectionTitle?: { en: string; ar: string } | null,
): string {
  if (code.sectionScope !== 'section' || !code.sectionId) {
    return language === 'ar' ? 'كل الأقسام' : 'All sections';
  }
  if (sectionTitle) {
    const label = sectionTitle[language]?.trim();
    if (label) return label;
  }
  return code.sectionId;
}

export function isInfluencerCodeExpired(code: InfluencerCode, at = Date.now()): boolean {
  return typeof code.expiresAt === 'number' && at > code.expiresAt;
}

export function filterInfluencerCodesForAdmin(
  codes: InfluencerCode[],
  filter: InfluencerCodeListFilter,
  at = Date.now(),
): InfluencerCode[] {
  const q = filter.query.trim().toLowerCase();
  return codes.filter((row) => {
    if (filter.status === 'enabled' && !row.enabled) return false;
    if (filter.status === 'disabled' && row.enabled) return false;
    if (filter.discountType !== 'all' && row.discountType !== filter.discountType) return false;
    const expired = isInfluencerCodeExpired(row, at);
    if (filter.expiry === 'active' && expired) return false;
    if (filter.expiry === 'expired' && !expired) return false;
    if (filter.sectionId !== 'all') {
      if (row.sectionScope !== 'section' || row.sectionId !== filter.sectionId) return false;
    }
    if (q) {
      const hay = `${row.code} ${row.influencerName}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function formatCodeDiscountLabel(code: InfluencerCode, language: 'en' | 'ar'): string {
  if (code.discountType === 'percent') {
    return language === 'ar' ? `${code.discountValue}%` : `${code.discountValue}% off`;
  }
  return language === 'ar' ? `${code.discountValue} د.أ` : `${code.discountValue} JOD`;
}
