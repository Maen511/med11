/** Routes where the cart UI is hidden entirely (e.g. dedicated checkout flow). */
const CART_HIDDEN_PATHS = new Set(['/checkout']);

export function isCartHiddenPath(pathname: string): boolean {
  return CART_HIDDEN_PATHS.has(pathname);
}
