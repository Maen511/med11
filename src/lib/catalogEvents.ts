/** Fired whenever admin catalog data in localStorage changes */
export const CATALOG_CHANGED_EVENT = 'med-catalog-changed';

export function notifyCatalogChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CATALOG_CHANGED_EVENT));
}
