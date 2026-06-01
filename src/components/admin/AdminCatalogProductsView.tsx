import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DualSalePricePills } from '@/components/ProductSaleModeBadge';
import type { CatalogProduct } from '@/lib/catalog';
import { getLowStockThreshold } from '@/lib/inventory';

export type CatalogViewMode = 'cards' | 'table';

type Props = {
  products: CatalogProduct[];
  language: 'en' | 'ar';
  viewMode: CatalogViewMode;
  onEdit: (product: CatalogProduct) => void;
  onDelete: (product: CatalogProduct) => void;
};

function stockMeta(qty: number, isRtl: boolean) {
  const low = getLowStockThreshold();
  if (qty === 0) {
    return {
      label: isRtl ? 'نفد' : 'Out',
      className: 'border-destructive/30 bg-destructive/10 text-destructive',
    };
  }
  if (qty <= low) {
    return {
      label: isRtl ? `منخفض (${qty})` : `Low (${qty})`,
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100',
    };
  }
  return {
    label: isRtl ? `متوفر (${qty})` : `In stock (${qty})`,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
  };
}

function ProductActions({
  product,
  isRtl,
  onEdit,
  onDelete,
  compact,
}: {
  product: CatalogProduct;
  isRtl: boolean;
  onEdit: (p: CatalogProduct) => void;
  onDelete: (p: CatalogProduct) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex gap-1.5', compact ? 'shrink-0' : 'border-t border-border/50 pt-3')}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className={cn('h-8 gap-1.5 text-xs', !compact && 'flex-1')}
        onClick={() => onEdit(product)}
      >
        <Pencil className="h-3.5 w-3.5" />
        {isRtl ? 'تعديل' : 'Edit'}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn('h-8 gap-1.5 text-xs text-destructive hover:text-destructive', !compact && 'flex-1')}
        onClick={() => onDelete(product)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isRtl ? 'حذف' : 'Delete'}
      </Button>
    </div>
  );
}

function ProductCards({
  products,
  language,
  onEdit,
  onDelete,
}: Omit<Props, 'viewMode'>) {
  const isRtl = language === 'ar';

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => {
        const qty = p.stockCount ?? 0;
        const stock = stockMeta(qty, isRtl);
        return (
          <article
            key={p.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-primary/25 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-border/50 bg-muted/30">
              <img
                src={p.image}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <Badge className={cn('absolute start-2 top-2 text-[10px] shadow-sm', stock.className)}>
                {stock.label}
              </Badge>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="min-w-0 space-y-1.5">
                <p className="line-clamp-2 font-semibold leading-snug">{p.name[language]}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  #{p.id} · {p.price} {isRtl ? 'د.أ' : 'JOD'}
                </p>
                <DualSalePricePills product={p} language={language} />
              </div>
              <ProductActions product={p} isRtl={isRtl} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProductTable({
  products,
  language,
  onEdit,
  onDelete,
}: Omit<Props, 'viewMode'>) {
  const isRtl = language === 'ar';

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-start text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">{isRtl ? 'المنتج' : 'Product'}</th>
              <th className="hidden px-3 py-3 font-medium sm:table-cell">{isRtl ? 'الرقم' : 'ID'}</th>
              <th className="px-3 py-3 font-medium">{isRtl ? 'السعر' : 'Price'}</th>
              <th className="px-3 py-3 font-medium">{isRtl ? 'المخزون' : 'Stock'}</th>
              <th className="px-4 py-3 text-end font-medium">{isRtl ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {products.map((p) => {
              const qty = p.stockCount ?? 0;
              const stock = stockMeta(qty, isRtl);
              return (
                <tr key={p.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted/40">
                        <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 font-medium leading-snug text-foreground">{p.name[language]}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground sm:hidden" dir="ltr">
                          #{p.id}
                        </p>
                        <div className="mt-1 hidden sm:block">
                          <DualSalePricePills product={p} language={language} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-3 font-mono text-xs text-muted-foreground sm:table-cell" dir="ltr">
                    #{p.id}
                  </td>
                  <td className="px-3 py-3 tabular-nums font-medium whitespace-nowrap">
                    {p.price} {isRtl ? 'د.أ' : 'JOD'}
                  </td>
                  <td className="px-3 py-3">
                    <Badge variant="outline" className={cn('text-[10px] font-normal', stock.className)}>
                      {stock.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ProductActions
                      product={p}
                      isRtl={isRtl}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      compact
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const AdminCatalogProductsView = ({ products, language, viewMode, onEdit, onDelete }: Props) => {
  if (viewMode === 'table') {
    return <ProductTable products={products} language={language} onEdit={onEdit} onDelete={onDelete} />;
  }
  return <ProductCards products={products} language={language} onEdit={onEdit} onDelete={onDelete} />;
};

export default AdminCatalogProductsView;
