import { getMergedSections } from '@/lib/products';

/** أقسام الكتالوج الحالية (بعد دمج localStorage + الافتراضي) */
export function validCatalogSectionIds(): string[] {
  return getMergedSections().map((s) => s.id);
}

/**
 * يزيل معرفات الأقسام القديمة بعد ترحيل الكتالوج.
 * إذا كان الوصول مفعّلاً لكن كل المعرفات قديمة، يُمنح أول قسم متاح حتى لا يُحجب المتجر.
 */
export function reconcileGrantedSectionIds(
  grantedSectionIds: string[],
  catalogUnlocked: boolean,
): string[] {
  const valid = validCatalogSectionIds();
  if (valid.length === 0) return grantedSectionIds;

  const validSet = new Set(valid);
  const filtered = grantedSectionIds.filter((id) => validSet.has(id));
  if (filtered.length > 0) return filtered;

  if (catalogUnlocked) return [...valid];
  return [];
}

/** أول قسم صالح للمتجر (للأدمن أو العميل) */
export function resolveStoreSectionId(
  grantedSectionIds: readonly string[],
  opts?: { isAdmin?: boolean; catalogUnlocked?: boolean },
): string | null {
  const merged = getMergedSections();
  if (merged.length === 0) return null;

  const validSet = new Set(merged.map((s) => s.id));

  if (opts?.isAdmin) return merged[0].id;

  for (const id of grantedSectionIds) {
    if (validSet.has(id)) return id;
  }

  if (opts?.catalogUnlocked) return merged[0].id;

  return null;
}

export function storeProductsPath(
  grantedSectionIds: readonly string[],
  opts?: { isAdmin?: boolean; catalogUnlocked?: boolean },
): string {
  const id = resolveStoreSectionId(grantedSectionIds, opts);
  return id ? `/products/${id}` : '/';
}
