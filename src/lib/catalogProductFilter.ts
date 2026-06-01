import { canSellByUnit, type ProductSaleInfo } from '@/lib/productSaleModes';

export type StoreStockFilter = 'all' | 'in_stock' | 'out_of_stock';

export type StoreSaleFilter = 'all' | 'box' | 'unit';

export type StoreCatalogProduct = ProductSaleInfo & {
  id: number;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  inStock?: boolean;
};

export function filterStoreCatalogProducts<T extends StoreCatalogProduct>(
  products: T[],
  opts: { query: string; stock: StoreStockFilter; sale: StoreSaleFilter },
): T[] {
  const q = opts.query.trim().toLowerCase();

  return products.filter((p) => {
    const inStock = p.inStock !== false;

    if (opts.stock === 'in_stock' && !inStock) return false;
    if (opts.stock === 'out_of_stock' && inStock) return false;

    if (opts.sale === 'box' && p.sellByBox === false) return false;
    if (opts.sale === 'unit' && !canSellByUnit(p)) return false;

    if (!q) return true;

    return (
      p.name.en.toLowerCase().includes(q) ||
      p.name.ar.toLowerCase().includes(q) ||
      p.description.en.toLowerCase().includes(q) ||
      p.description.ar.toLowerCase().includes(q) ||
      String(p.id).includes(q) ||
      String(p.price).includes(q) ||
      (p.pricePerUnit != null && String(p.pricePerUnit).includes(q))
    );
  });
}

export function storeCatalogHasActiveFilters(
  query: string,
  stock: StoreStockFilter,
  sale: StoreSaleFilter,
): boolean {
  return query.trim() !== '' || stock !== 'all' || sale !== 'all';
}
