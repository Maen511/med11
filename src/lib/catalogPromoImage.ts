import {
  deleteProductImageDataUrl,
  getProductImageDataUrl,
  putProductImageDataUrl,
} from '@/lib/productImageStore';

/** Reserved ID in product image store — not a catalog SKU. */
export const PROMO_IMAGE_PRODUCT_ID = 9_000_001;

export async function loadPromoImageDataUrl(): Promise<string | null> {
  return getProductImageDataUrl(PROMO_IMAGE_PRODUCT_ID);
}

export async function savePromoImageDataUrl(dataUrl: string): Promise<void> {
  await putProductImageDataUrl(PROMO_IMAGE_PRODUCT_ID, dataUrl);
}

export async function removePromoImageDataUrl(): Promise<void> {
  await deleteProductImageDataUrl(PROMO_IMAGE_PRODUCT_ID);
}
