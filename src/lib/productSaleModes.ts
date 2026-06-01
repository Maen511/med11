export type SaleMode = 'box' | 'unit';

export type ProductSaleInfo = {
  price: number;
  subtitle?: { en: string; ar: string };
  unitsPerBox?: number;
  pricePerUnit?: number;
  sellByBox?: boolean;
  sellByUnit?: boolean;
};

export function parseUnitsPerBoxFromPresentation(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const en = trimmed.match(/^(\d+)\s*(vials?|ampoules?|bottles?|boxes?|pcs?|pieces?)\b/i);
  if (en) return Number(en[1]);

  const ar = trimmed.match(/^(\d+)\s*(فيالات?|أمبولات?|علب|حبات?|قطع)\b/);
  if (ar) return Number(ar[1]);

  return undefined;
}

export function resolveUnitsPerBox(product: ProductSaleInfo): number {
  if (typeof product.unitsPerBox === 'number' && product.unitsPerBox > 0) {
    return Math.floor(product.unitsPerBox);
  }
  const fromSubtitle = parseUnitsPerBoxFromPresentation(
    product.subtitle?.en || product.subtitle?.ar || '',
  );
  return fromSubtitle && fromSubtitle > 0 ? fromSubtitle : 1;
}

export function hasExplicitUnitPrice(product: ProductSaleInfo): boolean {
  return typeof product.pricePerUnit === 'number' && product.pricePerUnit > 0;
}

export function canSellByUnit(product: ProductSaleInfo): boolean {
  if (product.sellByUnit === false) return false;
  if (product.sellByUnit === true) return true;
  if (hasExplicitUnitPrice(product)) return true;
  return resolveUnitsPerBox(product) > 1;
}

/** Persist flags when saving from admin (box price always required). */
export function resolveSaleFlagsFromPrices(input: {
  pricePerUnit?: number;
  unitsPerBox?: number;
}): { sellByBox: boolean; sellByUnit: boolean } {
  const units = input.unitsPerBox != null && input.unitsPerBox > 1 ? Math.floor(input.unitsPerBox) : 0;
  const dual =
    (typeof input.pricePerUnit === 'number' && input.pricePerUnit > 0) || units > 1;
  return { sellByBox: true, sellByUnit: dual };
}

export function getBoxPrice(product: ProductSaleInfo): number {
  return product.price;
}

export function getUnitPrice(product: ProductSaleInfo): number {
  if (typeof product.pricePerUnit === 'number' && product.pricePerUnit > 0) {
    return product.pricePerUnit;
  }
  const units = resolveUnitsPerBox(product);
  if (units <= 1) return product.price;
  return Math.round((product.price / units) * 100) / 100;
}

export function getPriceForMode(product: ProductSaleInfo, mode: SaleMode): number {
  return mode === 'unit' ? getUnitPrice(product) : getBoxPrice(product);
}

export function saleModeLabel(mode: SaleMode, language: 'en' | 'ar'): string {
  if (language === 'ar') return mode === 'box' ? 'بوكس' : 'حبة';
  return mode === 'box' ? 'Box' : 'Unit';
}

/** e.g. بالبوكس / بالحبة — for checkout and order lines */
export function saleModePurchaseLabel(mode: SaleMode, language: 'en' | 'ar'): string {
  if (language === 'ar') return mode === 'box' ? 'بالبوكس' : 'بالحبة';
  return mode === 'box' ? 'By box' : 'By unit';
}

export type LocalizedName = { en?: string; ar?: string } | string | null | undefined;

/** Normalize cart/order name payloads (object, legacy string, or partial). */
export function normalizeCartItemName(name: LocalizedName): { en: string; ar: string } {
  if (name == null) return { en: '', ar: '' };
  if (typeof name === 'string') {
    const s = name.trim();
    return { en: s, ar: s };
  }
  const en = (name.en ?? name.ar ?? '').trim();
  const ar = (name.ar ?? name.en ?? '').trim();
  return { en, ar };
}

/** Display name for a cart line in the active language. */
export function resolveCartItemName(name: LocalizedName, language: 'en' | 'ar'): string {
  const normalized = normalizeCartItemName(name);
  const primary = language === 'ar' ? normalized.ar : normalized.en;
  if (primary) return primary;
  const fallback = normalized.en || normalized.ar;
  if (fallback) return fallback;
  return language === 'ar' ? 'منتج' : 'Product';
}

export function formatDualSaleHint(product: ProductSaleInfo, language: 'en' | 'ar'): string {
  if (!canSellByUnit(product)) {
    return language === 'ar' ? 'بالبوكس فقط' : 'Box only';
  }
  const box = getBoxPrice(product);
  const unit = getUnitPrice(product);
  if (language === 'ar') {
    return `بوكس ${box} د.أ · حبة ${unit} د.أ`;
  }
  return `Box ${box} JOD · Unit ${unit} JOD`;
}

export function sectionHasDualSaleProducts(products: ProductSaleInfo[]): boolean {
  return products.some((p) => canSellByUnit(p));
}

export function normalizeCartVariant(variantName?: string | null): SaleMode {
  const raw = variantName?.trim();
  if (!raw) return 'box';
  if (raw === 'unit' || raw === 'box') return raw;
  const lower = raw.toLowerCase();
  if (lower === 'unit' || lower === 'units') return 'unit';
  if (lower === 'box' || lower === 'boxes') return 'box';
  if (raw === 'حبة' || raw === 'حبات' || raw === 'بالحبة') return 'unit';
  if (raw === 'بوكس' || raw === 'بالبوكس' || raw === 'علبة' || raw === 'علب') return 'box';
  return 'box';
}

/** يحدّد حبة/بوكس من variantName أو من السعر المخزّن عند غياب/خطأ التسمية */
export function resolveCartLineVariant(
  line: { variantName?: string; price?: number; isSectionBonusFree?: boolean },
  product?: ProductSaleInfo | null,
): SaleMode {
  const raw = line.variantName?.trim();
  if (raw === 'unit' || raw === 'box') return raw;

  if (raw) {
    const lower = raw.toLowerCase();
    const known =
      lower === 'unit' ||
      lower === 'units' ||
      lower === 'box' ||
      lower === 'boxes' ||
      raw === 'حبة' ||
      raw === 'حبات' ||
      raw === 'بالحبة' ||
      raw === 'بوكس' ||
      raw === 'بالبوكس' ||
      raw === 'علبة' ||
      raw === 'علب';
    if (known) return normalizeCartVariant(raw);
  }

  if (product && typeof line.price === 'number' && line.price > 0 && !line.isSectionBonusFree) {
    const unitP = getUnitPrice(product);
    const boxP = getBoxPrice(product);
    const matchesUnit = Math.abs(line.price - unitP) < 0.02;
    const matchesBox = Math.abs(line.price - boxP) < 0.02;
    if (matchesUnit && !matchesBox) return 'unit';
    if (matchesBox && !matchesUnit) return 'box';
  }

  return normalizeCartVariant(line.variantName);
}

export function cartVariantKey(mode: SaleMode): string {
  return mode;
}

export function resolveCartLinePrice(
  product: ProductSaleInfo,
  mode: SaleMode,
  isSectionBonusFree?: boolean,
): number {
  if (isSectionBonusFree) return 0;
  return getPriceForMode(product, mode);
}

export function cartLinesMatch(
  a: { id: number; variantName?: string; isSectionBonusFree?: boolean },
  b: { id: number; variantName?: string; isSectionBonusFree?: boolean },
): boolean {
  return (
    a.id === b.id &&
    normalizeCartVariant(a.variantName) === normalizeCartVariant(b.variantName) &&
    Boolean(a.isSectionBonusFree) === Boolean(b.isSectionBonusFree)
  );
}

export function cartLineId(item: { id: number; variantName?: string; isSectionBonusFree?: boolean }): string {
  const bonus = item.isSectionBonusFree ? ':bonus' : '';
  return `${item.id}:${normalizeCartVariant(item.variantName)}${bonus}`;
}
