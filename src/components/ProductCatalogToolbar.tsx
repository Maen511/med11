import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
  search: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  onClear: () => void;
  hasActiveSearch: boolean;
  className?: string;
};

const ProductCatalogToolbar = ({
  language,
  search,
  onSearchChange,
  filteredCount,
  totalCount,
  onClear,
  hasActiveSearch,
  className,
}: Props) => {
  const isRtl = language === 'ar';

  return (
    <div
      className={cn(
        'mb-5 space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3 shadow-sm backdrop-blur-sm sm:mb-6 sm:p-4',
        className,
      )}
      dir="ltr"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isRtl ? 'ابحث بالاسم أو الوصف أو السعر أو الرقم…' : 'Search by name, description, price, or ID…'
            }
            dir={isRtl ? 'rtl' : 'ltr'}
            className="h-11 border-border/70 bg-background/90 ps-10 pe-10"
            aria-label={isRtl ? 'بحث المنتجات' : 'Search products'}
          />
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
              onClick={() => onSearchChange('')}
              aria-label={isRtl ? 'مسح البحث' : 'Clear search'}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        {hasActiveSearch ? (
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={onClear}>
            <X className="h-3.5 w-3.5" aria-hidden />
            {isRtl ? 'مسح البحث' : 'Clear search'}
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {hasActiveSearch
          ? isRtl
            ? `عرض ${filteredCount} من ${totalCount} منتج`
            : `Showing ${filteredCount} of ${totalCount} products`
          : isRtl
            ? `${totalCount} منتج في هذا القسم`
            : `${totalCount} product(s) in this section`}
      </p>
    </div>
  );
};

export default ProductCatalogToolbar;
