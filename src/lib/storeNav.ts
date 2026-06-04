import { getMergedSections, getSectionIdForProduct } from '@/lib/products';

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

type CartSectionLine = { id: number; quantity: number };

/** قسم المتجر الأكثر شراءً في السلة (قبل تفريغها) */
export function resolveSectionIdFromCartItems(
  cartItems: readonly CartSectionLine[],
  grantedSectionIds: readonly string[],
  opts?: { isAdmin?: boolean; catalogUnlocked?: boolean },
): string | null {
  const counts = new Map<string, number>();
  for (const item of cartItems) {
    const sid = getSectionIdForProduct(item.id);
    if (!sid) continue;
    counts.set(sid, (counts.get(sid) ?? 0) + Math.max(1, item.quantity));
  }

  const reconciled = reconcileGrantedSectionIds(
    [...grantedSectionIds],
    Boolean(opts?.catalogUnlocked || opts?.isAdmin),
  );
  const allowed = new Set(reconciled);

  let bestId: string | null = null;
  let bestScore = 0;
  for (const [sid, score] of counts) {
    if (score > bestScore && (opts?.isAdmin || allowed.has(sid))) {
      bestScore = score;
      bestId = sid;
    }
  }
  if (bestId) return bestId;

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [sid] of sorted) {
    if (allowed.has(sid)) return sid;
  }

  return resolveStoreSectionId(reconciled, opts);
}

export function storeProductsPathFromCart(
  cartItems: readonly CartSectionLine[],
  grantedSectionIds: readonly string[],
  opts?: { isAdmin?: boolean; catalogUnlocked?: boolean },
): string {
  const id = resolveSectionIdFromCartItems(cartItems, grantedSectionIds, opts);
  return id ? `/products/${id}` : storeProductsPath(grantedSectionIds, opts);
}

const LAST_ORDER_STORE_PATH_KEY = 'med-last-order-store-path';

export function saveLastOrderStorePath(path: string) {
  if (!path || path === '/checkout') return;
  try {
    sessionStorage.setItem(LAST_ORDER_STORE_PATH_KEY, path);
  } catch {}
}

export function readLastOrderStorePath(): string | null {
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_STORE_PATH_KEY);
    return raw && raw !== '/checkout' ? raw : null;
  } catch {
    return null;
  }
}
