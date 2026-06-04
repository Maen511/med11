import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminInvoiceDetailsDialog from '@/components/admin/AdminInvoiceDetailsDialog';
import InvoicesDateFilterBar from '@/components/admin/InvoicesDateFilterBar';
import OrdersFilterToolbar from '@/components/OrdersFilterToolbar';
import {
  filterDeliveredInvoices,
  formatInvoiceItemsSummary,
  getInvoiceCustomerDisplayName,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  type StoredInvoice,
} from '@/lib/invoices';
import {
  defaultInvoiceDateFilter,
  getDistinctInvoiceYears,
  groupInvoicesBy,
  invoiceDateFilterActive,
  invoiceDateSearchTokens,
  matchesInvoiceDateFilter,
  type InvoiceDateFilterState,
  type InvoiceGroupBy,
} from '@/lib/invoiceDateFilter';
import { filterAndSortOrders } from '@/lib/orderFilter';
import { formatDateTime, formatNumber } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';
import { FileText, Receipt } from 'lucide-react';

type Props = {
  language: 'en' | 'ar';
  invoices: StoredInvoice[];
};

const AdminInvoicesPanel = ({ language, invoices }: Props) => {
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';
  const [detailInvoice, setDetailInvoice] = useState<StoredInvoice | null>(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<InvoiceDateFilterState>(defaultInvoiceDateFilter);
  const [groupBy, setGroupBy] = useState<InvoiceGroupBy>('month');

  const deliveredInvoices = useMemo(() => filterDeliveredInvoices(invoices), [invoices]);

  const sorted = useMemo(
    () => [...deliveredInvoices].sort((a, b) => b.createdAt - a.createdAt),
    [deliveredInvoices],
  );

  const years = useMemo(() => getDistinctInvoiceYears(sorted), [sorted]);

  const dateFiltered = useMemo(
    () => sorted.filter((inv) => matchesInvoiceDateFilter(inv, dateFilter)),
    [sorted, dateFilter],
  );

  const filtered = useMemo(
    () =>
      filterAndSortOrders(dateFiltered, {
        query: search,
        status: 'all',
        payment: 'all',
        sort: 'newest',
        includeCustomerInSearch: true,
        extraSearchText: (inv) => invoiceDateSearchTokens(inv, lang),
        language,
      }),
    [dateFiltered, search, lang, language],
  );

  const groups = useMemo(
    () => groupInvoicesBy(filtered, groupBy, lang),
    [filtered, groupBy, lang],
  );

  const hasActiveFilters = search.trim().length > 0 || invoiceDateFilterActive(dateFilter);

  const clearFilters = () => {
    setSearch('');
    setDateFilter(defaultInvoiceDateFilter());
  };

  const clearDateFilter = () => {
    setDateFilter(defaultInvoiceDateFilter());
  };

  const totalRevenue = useMemo(() => sorted.reduce((s, inv) => s + inv.total, 0), [sorted]);
  const filteredRevenue = useMemo(() => filtered.reduce((s, inv) => s + inv.total, 0), [filtered]);

  const currency = isRtl ? 'د.أ' : 'JOD';

  const labels = isRtl
    ? {
        invoices: 'عدد الفواتير',
        totalSales: 'إجمالي المبيعات',
        filteredSales: 'مبيعات النتائج',
        ledger: 'سجل الفواتير',
        ledgerHint: 'اضغط على أي فاتورة لعرض التفاصيل — فلترة وتجميع حسب اليوم أو الشهر أو السنة.',
        empty: 'لا توجد فواتير مُسلَّمة بعد.',
        emptyHint: 'بعد تعيين «تم التوصيل» في الطلبات تظهر الفاتورة هنا.',
        noResults: 'لا توجد فواتير مطابقة',
        noResultsHint: 'جرّب تاريخاً أو بحثاً آخر.',
        clear: 'مسح الكل',
        customer: 'العميل',
        total: 'الإجمالي',
        time: 'التاريخ',
        searchPlaceholder: 'بحث باسم العميل أو المنتج أو السنة…',
        openInvoice: 'عرض تفاصيل الفاتورة',
        invoicesCount: 'فاتورة',
      }
    : {
        invoices: 'Invoices',
        totalSales: 'Total sales',
        filteredSales: 'Filtered sales',
        ledger: 'Invoice ledger',
        ledgerHint: 'Tap any invoice for details — filter and group by day, month, or year.',
        empty: 'No delivered invoices yet.',
        emptyHint: 'Mark an order as delivered in Orders to list it here.',
        noResults: 'No matching invoices',
        noResultsHint: 'Try another date or search.',
        clear: 'Clear all',
        customer: 'Customer',
        total: 'Total',
        time: 'Date',
        searchPlaceholder: 'Search customer, product, or year…',
        openInvoice: 'View invoice details',
        invoicesCount: 'invoice(s)',
      };

  const renderInvoiceRow = (inv: StoredInvoice) => {
    const status = normalizeInvoiceStatus(inv.status);
    const customerName = getInvoiceCustomerDisplayName(inv, lang);
    const orderSummary = formatInvoiceItemsSummary(inv, lang, 2);
    const timeLabel = formatDateTime(inv.createdAt, language, {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    return (
      <li key={inv.id}>
        <button
          type="button"
          className={cn(
            'flex w-full cursor-pointer gap-3 px-3 py-3 text-start transition-colors hover:bg-muted/25',
            'sm:grid sm:grid-cols-[minmax(0,1fr)_6.5rem_5.5rem] sm:items-center sm:gap-3 sm:px-4 sm:py-2.5',
          )}
          onClick={() => setDetailInvoice(inv)}
          aria-label={labels.openInvoice}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-foreground">{customerName}</span>
              <Badge
                variant="secondary"
                className={cn(
                  'shrink-0 px-1.5 py-0 text-[10px] font-normal',
                  invoiceStatusBadgeClass(status),
                )}
              >
                {invoiceStatusLabel(status, lang)}
              </Badge>
              {inv.discountCode ? (
                <Badge variant="outline" className="shrink-0 font-mono text-[10px] font-normal" dir="ltr">
                  {inv.discountCode}
                </Badge>
              ) : null}
            </div>
            <p className="line-clamp-1 text-xs text-muted-foreground">{orderSummary}</p>
            <p className="font-mono text-[10px] text-muted-foreground/80 sm:hidden" dir="ltr">
              #{inv.id}
            </p>
            <p className="text-[11px] text-muted-foreground sm:hidden">{timeLabel}</p>
          </div>

          <p className="hidden shrink-0 text-center text-xs tabular-nums text-muted-foreground sm:block">
            {timeLabel}
          </p>

          <p className="shrink-0 text-end text-sm font-semibold tabular-nums text-primary sm:text-base">
            {formatNumber(inv.total)} {currency}
          </p>
        </button>
      </li>
    );
  };

  if (sorted.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">{labels.empty}</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{labels.emptyHint}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="grid gap-2 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground sm:text-xs">{labels.invoices}</p>
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">{sorted.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm sm:col-span-2">
          <CardContent className="p-3 sm:p-4">
            <p className="text-[11px] text-muted-foreground sm:text-xs">{labels.totalSales}</p>
            <p className="text-xl font-semibold tabular-nums sm:text-2xl">
              {formatNumber(totalRevenue)} {currency}
            </p>
            {hasActiveFilters ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {labels.filteredSales}:{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {formatNumber(filteredRevenue)} {currency}
                </span>
                {' · '}
                {filtered.length} / {sorted.length}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <InvoicesDateFilterBar
        language={language}
        filter={dateFilter}
        onFilterChange={setDateFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        years={years}
        filteredCount={filtered.length}
        totalCount={sorted.length}
        onClear={clearDateFilter}
      />

      <OrdersFilterToolbar
        language={language}
        search={search}
        onSearchChange={setSearch}
        statusFilter="all"
        onStatusFilterChange={() => {}}
        filteredCount={filtered.length}
        totalCount={sorted.length}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        adminSearch
        hideStatusFilter
        searchPlaceholder={labels.searchPlaceholder}
        itemNoun={{ ar: 'فاتورة مُسلَّمة', en: 'delivered invoice(s)' }}
      />

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="space-y-0.5 border-b border-border/50 bg-muted/15 px-4 py-3 sm:px-5">
          <CardTitle className="text-base">{labels.ledger}</CardTitle>
          <p className="text-xs text-muted-foreground">{labels.ledgerHint}</p>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="font-medium">{labels.noResults}</p>
              <p className="mt-1 text-sm text-muted-foreground">{labels.noResultsHint}</p>
              <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                {labels.clear}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {groups.map((group) => {
                const groupTotal = group.items.reduce((s, inv) => s + inv.total, 0);
                return (
                  <section key={group.key}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-muted/20 px-4 py-2.5">
                      <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {formatNumber(group.items.length)} {labels.invoicesCount}
                        {' · '}
                        <span className="font-medium text-primary">
                          {formatNumber(groupTotal)} {currency}
                        </span>
                      </p>
                    </div>
                    <ul className="divide-y divide-border/50">{group.items.map(renderInvoiceRow)}</ul>
                  </section>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AdminInvoiceDetailsDialog
        open={detailInvoice != null}
        onOpenChange={(open) => {
          if (!open) setDetailInvoice(null);
        }}
        invoice={detailInvoice}
        language={language}
      />
    </div>
  );
};

export default AdminInvoicesPanel;
