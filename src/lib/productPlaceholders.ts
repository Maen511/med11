/**
 * Stable placeholder images (Unsplash CDN) for default catalog products.
 * Same product id always maps to the same image.
 */
const SKINCARE_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1556228578-8c89e565adf5?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1596755094514-f87a617fcabd?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1570194069410-b23fc1df35c0?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1612817288484-112f3089dbe3?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1598440947619-2c35a9432115?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1522335789203-aabd1cc54fba?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1512496013021-f27eedd9e008?auto=format&fit=crop&w=800&h=800&q=80',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&h=800&q=80',
] as const;

export function getProductPlaceholderImage(productId: number): string {
  const i = Math.abs(Math.trunc(productId)) % SKINCARE_PLACEHOLDERS.length;
  return SKINCARE_PLACEHOLDERS[i];
}
