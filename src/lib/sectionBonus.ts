import { getProductById, getSectionIdForProduct } from '@/lib/products';
import { normalizeCartVariant, cartVariantKey, getPriceForMode, resolveCartLineVariant } from '@/lib/productSaleModes';
import { catalogImageRef, getRawCatalogProduct, persistableCartImage } from '@/lib/catalogImages';

export const SECTION_BONUS_KEY = 'med-section-bonus';
export const SECTION_BONUS_LAST_USED_KEY = 'med-section-bonus-last-used';
export const SECTION_BONUS_CHANGED = 'med-section-bonus-changed';

export type SectionBonusSaleMode = 'unit' | 'box';

export type SectionBonusTier = {
  buyQuantity: number;
  freeQuantity: number;
};

export type SectionBonusConfig = {
  enabled: boolean;
  sectionId: string | null;
  unitBonusEnabled: boolean;
  boxBonusEnabled: boolean;
  unitsPerBox: number;
  unitTiers: SectionBonusTier[];
  boxTiers: SectionBonusTier[];
  /** @deprecated — للترحيل فقط */
  saleMode?: SectionBonusSaleMode;
  /** @deprecated */
  buyQuantity: number;
  /** @deprecated */
  freeQuantity: number;
};

export const DEFAULT_BOX_TIERS: SectionBonusTier[] = [
  { buyQuantity: 3, freeQuantity: 1 },
  { buyQuantity: 6, freeQuantity: 3 },
];

export const DEFAULT_UNIT_TIERS: SectionBonusTier[] = [{ buyQuantity: 5, freeQuantity: 1 }];

export const DEFAULT_SECTION_BONUS: SectionBonusConfig = {
  enabled: false,
  sectionId: 'professional-vials',
  unitBonusEnabled: true,
  boxBonusEnabled: true,
  unitsPerBox: 5,
  buyQuantity: 5,
  freeQuantity: 1,
  unitTiers: [...DEFAULT_UNIT_TIERS],
  boxTiers: [...DEFAULT_BOX_TIERS],
};

export type CartBonusLine = {
  id: number;
  quantity: number;
  variantName?: string;
  isSectionBonusFree?: boolean;
  image?: string;
  name?: { en: string; ar: string };
  category?: string;
  price?: number;
};

function normalizeSaleMode(value: unknown): SectionBonusSaleMode {
  return value === 'box' ? 'box' : 'unit';
}

function normalizeTier(raw: unknown): SectionBonusTier | null {
  if (!raw || typeof raw !== 'object') return null;
  const buyQuantity = Math.floor(Number((raw as SectionBonusTier).buyQuantity));
  const freeQuantity = Math.floor(Number((raw as SectionBonusTier).freeQuantity));
  if (!Number.isFinite(buyQuantity) || buyQuantity < 1) return null;
  if (!Number.isFinite(freeQuantity) || freeQuantity < 1) return null;
  return { buyQuantity, freeQuantity };
}

function defaultTiersForMode(saleMode: SectionBonusSaleMode): SectionBonusTier[] {
  return saleMode === 'box' ? [...DEFAULT_BOX_TIERS] : [...DEFAULT_UNIT_TIERS];
}

export function normalizeBoxTiers(
  tiers: unknown,
  saleMode: SectionBonusSaleMode = 'unit',
): SectionBonusTier[] {
  const fallback = defaultTiersForMode(saleMode);
  if (!Array.isArray(tiers)) return fallback;
  const normalized = tiers
    .map(normalizeTier)
    .filter((t): t is SectionBonusTier => t !== null)
    .sort((a, b) => a.buyQuantity - b.buyQuantity);
  return normalized.length > 0 ? normalized : fallback;
}

function mergeConfig(partial: Partial<SectionBonusConfig> | null): SectionBonusConfig {
  const d = DEFAULT_SECTION_BONUS;
  if (!partial || typeof partial !== 'object') {
    return {
      ...d,
      unitTiers: [...d.unitTiers],
      boxTiers: [...d.boxTiers],
    };
  }
  const buyQuantity =
    typeof partial.buyQuantity === 'number' && partial.buyQuantity > 0
      ? Math.floor(partial.buyQuantity)
      : d.buyQuantity;
  const freeQuantity =
    typeof partial.freeQuantity === 'number' && partial.freeQuantity > 0
      ? Math.floor(partial.freeQuantity)
      : d.freeQuantity;
  const legacySaleMode = normalizeSaleMode(partial.saleMode);
  const unitsPerBox =
    typeof partial.unitsPerBox === 'number' && partial.unitsPerBox > 0
      ? Math.floor(partial.unitsPerBox)
      : d.unitsPerBox;

  const hasUnitTiers = Array.isArray(partial.unitTiers) && partial.unitTiers.length > 0;
  const hasBoxTiersField = partial.boxTiers != null;
  const legacyTiers = hasBoxTiersField ? partial.boxTiers : null;

  let unitTiers: SectionBonusTier[];
  let boxTiers: SectionBonusTier[];

  if (hasUnitTiers) {
    unitTiers = normalizeBoxTiers(partial.unitTiers, 'unit');
  } else if (legacyTiers != null && legacySaleMode === 'unit') {
    unitTiers = normalizeBoxTiers(legacyTiers, 'unit');
  } else if (buyQuantity && freeQuantity) {
    unitTiers = normalizeBoxTiers([{ buyQuantity, freeQuantity }], 'unit');
  } else {
    unitTiers = defaultTiersForMode('unit');
  }

  if (hasUnitTiers && hasBoxTiersField) {
    boxTiers = normalizeBoxTiers(partial.boxTiers, 'box');
  } else if (legacyTiers != null && legacySaleMode === 'box' && !hasUnitTiers) {
    boxTiers = normalizeBoxTiers(legacyTiers, 'box');
  } else if (legacyTiers != null && legacySaleMode === 'unit' && !hasUnitTiers) {
    boxTiers = defaultTiersForMode('box');
  } else if (hasBoxTiersField) {
    boxTiers = normalizeBoxTiers(partial.boxTiers, 'box');
  } else {
    boxTiers = defaultTiersForMode('box');
  }

  const unitBonusEnabled =
    typeof partial.unitBonusEnabled === 'boolean'
      ? partial.unitBonusEnabled
      : legacySaleMode !== 'box';
  const boxBonusEnabled =
    typeof partial.boxBonusEnabled === 'boolean'
      ? partial.boxBonusEnabled
      : legacySaleMode === 'box' || (hasUnitTiers && hasBoxTiersField);

  return {
    enabled: Boolean(partial.enabled),
    sectionId: typeof partial.sectionId === 'string' && partial.sectionId.trim() ? partial.sectionId.trim() : null,
    unitBonusEnabled,
    boxBonusEnabled,
    unitsPerBox,
    buyQuantity,
    freeQuantity,
    unitTiers,
    boxTiers,
  };
}

export function readSectionBonusConfig(): SectionBonusConfig {
  try {
    const raw = localStorage.getItem(SECTION_BONUS_KEY);
    if (!raw) {
      return {
        ...DEFAULT_SECTION_BONUS,
        unitTiers: [...DEFAULT_UNIT_TIERS],
        boxTiers: [...DEFAULT_BOX_TIERS],
      };
    }
    return mergeConfig(JSON.parse(raw) as Partial<SectionBonusConfig>);
  } catch {
    return {
      ...DEFAULT_SECTION_BONUS,
      unitTiers: [...DEFAULT_UNIT_TIERS],
      boxTiers: [...DEFAULT_BOX_TIERS],
    };
  }
}

export type SectionBonusLastUsed = {
  savedAt: string;
  config: SectionBonusConfig;
};

export function cloneSectionBonusConfig(config: SectionBonusConfig): SectionBonusConfig {
  const merged = mergeConfig(config);
  return {
    ...merged,
    unitTiers: merged.unitTiers.map((t) => ({ ...t })),
    boxTiers: merged.boxTiers.map((t) => ({ ...t })),
  };
}

function sectionBonusConfigSignature(config: SectionBonusConfig): string {
  const c = mergeConfig(config);
  return JSON.stringify({
    enabled: c.enabled,
    sectionId: c.sectionId,
    unitBonusEnabled: c.unitBonusEnabled,
    boxBonusEnabled: c.boxBonusEnabled,
    unitsPerBox: c.unitsPerBox,
    unitTiers: c.unitTiers,
    boxTiers: c.boxTiers,
  });
}

function saveLastUsedSectionBonus(config: SectionBonusConfig) {
  const entry: SectionBonusLastUsed = {
    savedAt: new Date().toISOString(),
    config: cloneSectionBonusConfig(config),
  };
  try {
    localStorage.setItem(SECTION_BONUS_LAST_USED_KEY, JSON.stringify(entry));
  } catch {}
}

export function readLastUsedSectionBonusConfig(): SectionBonusLastUsed | null {
  try {
    const raw = localStorage.getItem(SECTION_BONUS_LAST_USED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SectionBonusLastUsed;
    if (!parsed?.config) return null;
    return {
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      config: mergeConfig(parsed.config),
    };
  } catch {
    return null;
  }
}

export function restoreLastUsedSectionBonusConfig(): boolean {
  const last = readLastUsedSectionBonusConfig();
  if (!last) return false;
  return writeSectionBonusConfig({ ...cloneSectionBonusConfig(last.config), enabled: true });
}

export function writeLastUsedSectionBonusConfig(config: SectionBonusConfig): boolean {
  try {
    saveLastUsedSectionBonus(config);
    window.dispatchEvent(new CustomEvent(SECTION_BONUS_CHANGED));
    return true;
  } catch {
    return false;
  }
}

export function clearLastUsedSectionBonusConfig(): boolean {
  try {
    localStorage.removeItem(SECTION_BONUS_LAST_USED_KEY);
    window.dispatchEvent(new CustomEvent(SECTION_BONUS_CHANGED));
    return true;
  } catch {
    return false;
  }
}

export function writeSectionBonusConfig(config: SectionBonusConfig): boolean {
  try {
    const previous = readSectionBonusConfig();
    const next = mergeConfig(config);
    if (previous.enabled && sectionBonusConfigSignature(previous) !== sectionBonusConfigSignature(next)) {
      saveLastUsedSectionBonus(previous);
    }
    localStorage.setItem(SECTION_BONUS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(SECTION_BONUS_CHANGED));
    return true;
  } catch {
    return false;
  }
}

export function isUnitBonusActive(config: SectionBonusConfig): boolean {
  return Boolean(config.enabled && config.sectionId && config.unitBonusEnabled);
}

export function isBoxBonusActive(config: SectionBonusConfig): boolean {
  return Boolean(config.enabled && config.sectionId && config.boxBonusEnabled);
}

export function isAnySectionBonusActive(config: SectionBonusConfig = readSectionBonusConfig()): boolean {
  return isUnitBonusActive(config) || isBoxBonusActive(config);
}

export function getTiersForTrack(config: SectionBonusConfig, track: SectionBonusSaleMode): SectionBonusTier[] {
  return normalizeBoxTiers(track === 'box' ? config.boxTiers : config.unitTiers, track);
}

export function tierBundleSize(tier: SectionBonusTier): number {
  return tier.buyQuantity + tier.freeQuantity;
}

/** مجاني = عدد المجموعات الكاملة (مدفوع + مجاني) × حبات/بوكسات مجانية لكل مجموعة */
export function earnedFreeFromPaidBase(totalBase: number, tiers: SectionBonusTier[]): number {
  if (totalBase <= 0 || tiers.length === 0) return 0;
  return tiers.reduce(
    (sum, tier) => sum + Math.floor(totalBase / tierBundleSize(tier)) * tier.freeQuantity,
    0,
  );
}

/** إجمالي البوكسات (مدفوعة + مجانية) — أساس احتساب البونص */
function countTotalBoxesInSection(items: CartBonusLine[], sectionId: string): number {
  let total = 0;
  for (const item of items) {
    if (getSectionIdForProduct(item.id) !== sectionId) continue;
    if (normalizeCartVariant(item.variantName) !== 'box') continue;
    total += item.quantity;
  }
  return total;
}

/** إجمالي الحبات (variant=unit فقط) — أساس بونص الحبة، منفصل عن البوكس */
function countTotalUnitsOnlyInSection(
  items: CartBonusLine[],
  sectionId: string,
): number {
  let total = 0;
  for (const item of items) {
    if (getSectionIdForProduct(item.id) !== sectionId) continue;
    if (normalizeCartVariant(item.variantName) !== 'unit') continue;
    total += item.quantity;
  }
  return total;
}

export function countClaimedFreeRewardSlots(
  items: CartBonusLine[],
  sectionId: string,
  rewardMode: SectionBonusSaleMode,
): number {
  return items
    .filter(
      (i) =>
        i.isSectionBonusFree &&
        getSectionIdForProduct(i.id) === sectionId &&
        normalizeCartVariant(i.variantName) === rewardMode,
    )
    .reduce((n, i) => n + i.quantity, 0);
}

export function isSectionBonusActiveForSection(
  sectionId: string,
  config: SectionBonusConfig = readSectionBonusConfig(),
): boolean {
  return isAnySectionBonusActive(config) && config.sectionId === sectionId;
}

export function sectionBonusTierLabel(
  tier: SectionBonusTier,
  track: SectionBonusSaleMode,
  language: 'en' | 'ar',
): string {
  if (language === 'ar') {
    if (track === 'box') {
      const bundle = tierBundleSize(tier);
      return `اشترِ ${tier.buyQuantity} بوكس + ${tier.freeQuantity} مجاناً (${bundle} بوكس)`;
    }
    const bundle = tierBundleSize(tier);
    return `اشترِ ${tier.buyQuantity} حبات + ${tier.freeQuantity} مجاناً (${bundle} حبات)`;
  }

  if (track === 'box') {
    const bundle = tierBundleSize(tier);
    return `Buy ${tier.buyQuantity} boxes + ${tier.freeQuantity} free (${bundle} boxes total)`;
  }
  const bundle = tierBundleSize(tier);
  return `Buy ${tier.buyQuantity} units + ${tier.freeQuantity} free (${bundle} units total)`;
}

export function sectionBonusLabels(config: SectionBonusConfig, language: 'en' | 'ar'): string[] {
  if (!config.sectionId) return [];
  const labels: string[] = [];
  if (isUnitBonusActive(config)) {
    labels.push(...getTiersForTrack(config, 'unit').map((tier) => sectionBonusTierLabel(tier, 'unit', language)));
  }
  if (isBoxBonusActive(config)) {
    labels.push(...getTiersForTrack(config, 'box').map((tier) => sectionBonusTierLabel(tier, 'box', language)));
  }
  return labels;
}

export function getSectionBonusTickerMessages(
  config: SectionBonusConfig,
  language: 'en' | 'ar',
): string[] {
  return sectionBonusLabels(config, language);
}

export function sectionBonusFreeLineLabel(variantName: string | undefined, language: 'en' | 'ar'): string {
  const isBox = normalizeCartVariant(variantName) === 'box';
  if (language === 'ar') return isBox ? 'بوكس مجاني' : 'حبة مجانية';
  return isBox ? 'Free box' : 'Free unit';
}

function ensureLineImage<T extends CartBonusLine>(line: T): T {
  const image = persistableCartImage(
    line.id,
    line.image ?? getRawCatalogProduct(line.id)?.image ?? getProductById(line.id)?.image ?? catalogImageRef(line.id),
  );
  return { ...line, image };
}

function restorePaidLine<T extends CartBonusLine>(line: T): T {
  const product = getProductById(line.id);
  if (!product) {
    return ensureLineImage({ ...line, isSectionBonusFree: false, price: line.price ?? 0 });
  }
  const mode = resolveCartLineVariant(line, product);
  const price = getPriceForMode(product, mode);
  return ensureLineImage({
    ...line,
    isSectionBonusFree: false,
    price,
    variantName: cartVariantKey(mode),
  });
}

function collapseSectionBonusInSection<T extends CartBonusLine>(items: T[], sectionId: string): T[] {
  const other = items.filter((i) => getSectionIdForProduct(i.id) !== sectionId);
  const byKey = new Map<string, T>();

  for (const item of items) {
    if (getSectionIdForProduct(item.id) !== sectionId) continue;
    const key = `${item.id}:${normalizeCartVariant(item.variantName)}`;
    const normalized = restorePaidLine(item);
    const prev = byKey.get(key);
    if (prev) {
      byKey.set(key, ensureLineImage({ ...prev, quantity: prev.quantity + normalized.quantity }));
    } else {
      byKey.set(key, normalized);
    }
  }

  return [...other.map(ensureLineImage), ...byKey.values()];
}

/** يحوّل البونص المجاني إلى مدفوع ويوقف العرض عند تعطيل النظام. */
function deactivateSectionBonusInCart<T extends CartBonusLine>(
  items: T[],
  sectionId: string | null,
): T[] {
  if (sectionId) {
    return collapseSectionBonusInSection(items, sectionId);
  }

  const sectionIds = new Set<string>();
  for (const item of items) {
    if (!item.isSectionBonusFree) continue;
    const sid = getSectionIdForProduct(item.id);
    if (sid) sectionIds.add(sid);
  }

  let result = items;
  for (const sid of sectionIds) {
    result = collapseSectionBonusInSection(result, sid);
  }
  return result;
}

function stripTrackFreeBonus<T extends CartBonusLine>(
  items: T[],
  sectionId: string,
  track: SectionBonusSaleMode,
): T[] {
  const hasTrackFree = items.some(
    (i) =>
      getSectionIdForProduct(i.id) === sectionId &&
      i.isSectionBonusFree &&
      normalizeCartVariant(i.variantName) === track,
  );
  if (!hasTrackFree) return items;

  const converted = items.map((item) => {
    if (getSectionIdForProduct(item.id) !== sectionId) return item;
    if (!item.isSectionBonusFree || normalizeCartVariant(item.variantName) !== track) return item;
    return restorePaidLine(item);
  });

  return collapseSectionBonusInSection(converted, sectionId);
}

function allocateBoxBonus<T extends CartBonusLine>(
  items: T[],
  sectionId: string,
  config: SectionBonusConfig,
): T[] {
  const earned = earnedFreeFromPaidBase(
    countTotalBoxesInSection(items, sectionId),
    getTiersForTrack(config, 'box'),
  );
  const alreadyClaimed = countClaimedFreeRewardSlots(items, sectionId, 'box');
  let freeRemaining = Math.max(0, earned - alreadyClaimed);
  if (earned <= alreadyClaimed) {
    return items;
  }
  const other = items.filter((i) => getSectionIdForProduct(i.id) !== sectionId);
  const unitLines = items.filter(
    (i) => getSectionIdForProduct(i.id) === sectionId && normalizeCartVariant(i.variantName) === 'unit',
  );
  const boxLines = items.filter(
    (i) =>
      getSectionIdForProduct(i.id) === sectionId &&
      normalizeCartVariant(i.variantName) === 'box' &&
      !i.isSectionBonusFree,
  );

  const processed: T[] = [];
  for (const line of [...boxLines].reverse()) {
    if (freeRemaining <= 0) {
      processed.push(ensureLineImage(line));
      continue;
    }
    const convert = Math.min(line.quantity, freeRemaining);
    const paidQty = line.quantity - convert;
    if (paidQty > 0) processed.push(ensureLineImage({ ...line, quantity: paidQty, isSectionBonusFree: false }));
    if (convert > 0) {
      processed.push(
        ensureLineImage({
          ...line,
          quantity: convert,
          isSectionBonusFree: true,
          variantName: cartVariantKey('box'),
        }),
      );
    }
    freeRemaining -= convert;
  }

  return [...other.map(ensureLineImage), ...unitLines.map(ensureLineImage), ...processed.map(ensureLineImage)];
}

function allocateUnitBonus<T extends CartBonusLine>(
  items: T[],
  sectionId: string,
  config: SectionBonusConfig,
): T[] {
  const earned = earnedFreeFromPaidBase(
    countTotalUnitsOnlyInSection(items, sectionId),
    getTiersForTrack(config, 'unit'),
  );
  const alreadyClaimed = countClaimedFreeRewardSlots(items, sectionId, 'unit');
  let freeRemaining = Math.max(0, earned - alreadyClaimed);
  if (earned <= alreadyClaimed) {
    return items;
  }
  const other = items.filter((i) => getSectionIdForProduct(i.id) !== sectionId);
  const sectionItems = items.filter((i) => getSectionIdForProduct(i.id) === sectionId);

  const freeBoxLines = sectionItems.filter(
    (i) => i.isSectionBonusFree && normalizeCartVariant(i.variantName) === 'box',
  );
  const unitLines = sectionItems.filter(
    (i) => !i.isSectionBonusFree && normalizeCartVariant(i.variantName) === 'unit',
  );
  const boxLines = sectionItems.filter(
    (i) => !i.isSectionBonusFree && normalizeCartVariant(i.variantName) === 'box',
  );

  const processedUnits: T[] = [];
  for (const line of [...unitLines].reverse()) {
    if (freeRemaining <= 0) {
      processedUnits.push(ensureLineImage(line));
      continue;
    }
    const convert = Math.min(line.quantity, freeRemaining);
    const paidQty = line.quantity - convert;
    if (paidQty > 0) processedUnits.push(ensureLineImage({ ...line, quantity: paidQty, isSectionBonusFree: false }));
    if (convert > 0) {
      processedUnits.push(
        ensureLineImage({
          ...line,
          quantity: convert,
          isSectionBonusFree: true,
          variantName: cartVariantKey('unit'),
        }),
      );
    }
    freeRemaining -= convert;
  }

  return [...other.map(ensureLineImage), ...boxLines.map(ensureLineImage), ...processedUnits.map(ensureLineImage), ...freeBoxLines.map(ensureLineImage)];
}

/**
 * يحوّل جزءاً من الكمية المدفوعة إلى مجاني (5+1 → 5 مدفوعة + 1 مجانية)
 * بدلاً من إضافة حبة إضافية فوق المطلوب.
 */
export function reconcileSectionBonusLines<T extends CartBonusLine>(items: T[]): T[] {
  const config = readSectionBonusConfig();
  if (!isAnySectionBonusActive(config)) {
    return deactivateSectionBonusInCart(items, config.sectionId);
  }
  if (!config.sectionId) {
    return deactivateSectionBonusInCart(items, null);
  }
  const sectionId = config.sectionId;
  let working = collapseSectionBonusInSection(items, sectionId);

  if (!isUnitBonusActive(config)) {
    working = stripTrackFreeBonus(working, sectionId, 'unit');
  }
  if (!isBoxBonusActive(config)) {
    working = stripTrackFreeBonus(working, sectionId, 'box');
  }

  if (isBoxBonusActive(config)) {
    working = allocateBoxBonus(working, sectionId, config);
  }
  if (isUnitBonusActive(config)) {
    working = allocateUnitBonus(working, sectionId, config);
  }

  return working;
}
