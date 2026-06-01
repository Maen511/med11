import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ORDER_TRACK_STEPS, invoiceStatusLabel } from '@/lib/invoices';
import type { OrderStatusFilter } from '@/lib/orderFilter';

type Props = {
  language: 'en' | 'ar';
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: OrderStatusFilter;
  onStatusFilterChange: (value: OrderStatusFilter) => void;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onClear: () => void;
  adminSearch?: boolean;
  /** نص مخصّص لحقل البحث (مثلاً قسم الفواتير) */
  searchPlaceholder?: string;
  /** كلمة العدّ (طلب / فاتورة) */
  itemNoun?: { en: string; ar: string };
  /** إخفاء فلتر الحالة (مثلاً قسم الفواتير — مُسلَّمة فقط) */
  hideStatusFilter?: boolean;
  className?: string;
};

const OrdersFilterToolbar = ({
  language,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClear,
  adminSearch = false,
  searchPlaceholder: searchPlaceholderOverride,
  itemNoun,
  hideStatusFilter = false,
  className,
}: Props) => {
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';
  const nounAr = itemNoun?.ar ?? 'طلب';
  const nounEn = itemNoun?.en ?? 'order(s)';

  const labels = isRtl
    ? {
        status: 'حالة الطلب',
        all: 'الكل',
        searchAria: 'بحث الطلبات',
        clearSearch: 'مسح البحث',
        clearFilters: 'مسح الفلاتر',
        searchPlaceholder:
          searchPlaceholderOverride ??
          (adminSearch
            ? 'بحث برقم الطلب أو العميل أو المنتج…'
            : 'بحث برقم الطلب أو المنتج أو المبلغ…'),
        showing: `عرض ${filteredCount} من ${totalCount} ${nounAr}`,
        total: `${totalCount} ${nounAr}`,
      }
    : {
        status: 'Order status',
        all: 'All',
        searchAria: 'Search orders',
        clearSearch: 'Clear search',
        clearFilters: 'Clear filters',
        searchPlaceholder:
          searchPlaceholderOverride ??
          (adminSearch
            ? 'Search by order #, customer, or product…'
            : 'Search by order #, product, or amount…'),
        showing: `Showing ${filteredCount} of ${totalCount} ${nounEn}`,
        total: `${totalCount} ${nounEn}`,
      };

  return (
    <div
      className={cn(
        'space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 shadow-sm backdrop-blur-sm sm:p-5',
        className,
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="h-11 border-border/70 bg-background/90 ps-10 pe-10"
            aria-label={labels.searchAria}
          />
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
              onClick={() => onSearchChange('')}
              aria-label={labels.clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>

        {!hideStatusFilter ? (
          <div className="min-w-0 space-y-1.5 sm:w-52">
            <Label htmlFor="order-filter-status" className="text-xs font-medium text-muted-foreground">
              {labels.status}
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => onStatusFilterChange(v as OrderStatusFilter)}
            >
              <SelectTrigger id="order-filter-status" className="h-11 bg-background/90">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                <SelectItem value="all">{labels.all}</SelectItem>
                {ORDER_TRACK_STEPS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {invoiceStatusLabel(s, lang)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 sm:mb-0.5"
            onClick={onClear}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            {labels.clearFilters}
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {hasActiveFilters ? labels.showing : labels.total}
      </p>
    </div>
  );
};

export default OrdersFilterToolbar;
