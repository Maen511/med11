import {
  type CatalogProduct,
  type CatalogSection,
  getCatalogSections,
  getAllCatalogProducts,
  setProductStock,
} from '@/lib/catalog';

export type InventoryRow = {
  sectionId: string;
  sectionTitle: { en: string; ar: string };
  product: CatalogProduct;
};

export type InventorySummary = {
  totalSkus: number;
  totalUnits: number;
  inStockSkus: number;
  lowStockSkus: number;
  outOfStockSkus: number;
};

const LOW_STOCK_THRESHOLD = 5;

export function getLowStockThreshold() {
  return LOW_STOCK_THRESHOLD;
}

export function getInventoryRows(sections?: CatalogSection[]): InventoryRow[] {
  const catalog = sections ?? getCatalogSections();
  return catalog.flatMap((section) =>
    section.products.map((product) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      product,
    }))
  );
}

export function getInventorySummary(sections?: CatalogSection[]): InventorySummary {
  const products = sections
    ? sections.flatMap((s) => s.products)
    : getAllCatalogProducts();

  let totalUnits = 0;
  let inStockSkus = 0;
  let lowStockSkus = 0;
  let outOfStockSkus = 0;

  products.forEach((p) => {
    const qty = Math.max(0, Math.floor(p.stockCount ?? 0));
    totalUnits += qty;
    if (qty === 0) outOfStockSkus += 1;
    else if (qty <= LOW_STOCK_THRESHOLD) lowStockSkus += 1;
    else inStockSkus += 1;
  });

  return {
    totalSkus: products.length,
    totalUnits,
    inStockSkus,
    lowStockSkus,
    outOfStockSkus,
  };
}

export type StockFilter = 'all' | 'in_stock' | 'low' | 'out';

export function matchesStockFilter(qty: number, filter: StockFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'out') return qty === 0;
  if (filter === 'low') return qty > 0 && qty <= LOW_STOCK_THRESHOLD;
  return qty > LOW_STOCK_THRESHOLD;
}

export function applyBulkStockUpdates(
  updates: Array<{ sectionId: string; productId: number; stockCount: number }>
) {
  updates.forEach(({ sectionId, productId, stockCount }) => {
    setProductStock(sectionId, productId, stockCount);
  });
}
