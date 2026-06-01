/**
 * BIOSKIN product photos in `public/` (replaces generic Unsplash placeholders).
 * Add `/public/products/bsk-{code}.png` to override a single SKU.
 */
export const BIOSKIN_PRODUCT_IMAGE_DEFAULT = '/products/bsk1.png';

/** Product-specific hero shots already in the repo */
const BY_CODE: Record<string, string> = {
  BSK1: '/products/bsk1.png',
  BSK7: '/section-2.png',
};

export function getBioskinProductImage(productCode: string): string {
  const code = productCode.trim().toUpperCase();
  return BY_CODE[code] ?? BIOSKIN_PRODUCT_IMAGE_DEFAULT;
}
