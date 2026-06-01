import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OrdersFilterToolbar from '@/components/OrdersFilterToolbar';
import {
  filterDeliveredInvoices,
  formatInvoiceItemsSummary,
  getInvoiceCustomerDisplayName,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  paymentMethodLabel,
  type StoredInvoice,
} from '@/lib/invoices';
import { filterAndSortOrders } from '@/lib/orderFilter';
import { formatDateTime } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, FileText, Receipt } from 'lucide-react';

type Props = {
  language: 'en' | 'ar';
  invoices: StoredInvoice[];
};

const AdminInvoicesPanel = ({ language, invoices }: Props) => {
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const deliveredInvoices = useMemo(() => filterDeliveredInvoices(invoices), [invoices]);

  const sorted = useMemo(
    () => [...deliveredInvoices].sort((a, b) => b.createdAt - a.createdAt),
    [deliveredInvoices],
  );

  const filtered = useMemo(
    () =>
      filterAndSortOrders(sorted, {
        query: search,
        status: 'all',
        payment: 'all',
        sort: 'newest',
        includeCustomerInSearch: true,
        language,
      }),
    [sorted, search, language],
  );

  const hasActiveFilters = search.trim().length > 0;

  const clearFilters = () => {
    setSearch('');
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
        ledgerHint: 'فواتير الطلبات المُسلَّمة فقط — الطلبات قيد التنفيذ في قسم «الطلبات».',
        empty: 'لا توجد فواتير مُسلَّمة بعد.',
        emptyHint: 'بعد تعيين «تم التوصيل» في الطلبات تظهر الفاتورة هنا.',
        noResults: 'لا توجد فواتير مطابقة',
        noResultsHint: 'جرّب بحثاً آخر.',
        clear: 'مسح الفلاتر',
        lineItems: 'البنود',
        subtotal: 'المجموع الفرعي',
        discount: 'الخصم',
        promo: 'كود الخصم',
        customer: 'العميل',
        payment: 'الدفع',
        total: 'الإجمالي',
        searchPlaceholder: 'بحث باسم العميل أو المنتج أو كود الخصم…',
        order: 'الطلب',
        time: 'الوقت',
        ref: 'مرجع',
        expand: 'عرض التفاصيل',
        collapse: 'إخفاء التفاصيل',
      }
    : {
        invoices: 'Invoices',
        totalSales: 'Total sales',
        filteredSales: 'Filtered sales',
        ledger: 'Invoice ledger',
        ledgerHint: 'Delivered orders only — active orders stay in Orders.',
        empty: 'No delivered invoices yet.',
        emptyHint: 'Mark an order as delivered in Orders to list it here.',
        noResults: 'No matching invoices',
        noResultsHint: 'Try a different search.',
        clear: 'Clear filters',
        lineItems: 'Line items',
        subtotal: 'Subtotal',
        discount: 'Discount',
        promo: 'Promo code',
        customer: 'Customer',
        payment: 'Payment',
        total: 'Total',
        searchPlaceholder: 'Search by customer, product, or promo code…',
        order: 'Order',
        time: 'Time',
        ref: 'Ref',
        expand: 'Show details',
        collapse: 'Hide details',
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
              {totalRevenue.toFixed(2)} {currency}
            </p>
            {hasActiveFilters ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {labels.filteredSales}:{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {filteredRevenue.toFixed(2)} {currency}
                </span>
                {' · '}
                {filtered.length} / {sorted.length}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

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

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-0.5 px-4 py-3 sm:px-5">
          <CardTitle className="text-base">{labels.ledger}</CardTitle>
          <p className="text-xs text-muted-foreground">{labels.ledgerHint}</p>
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="font-medium">{labels.noResults}</p>
              <p className="mt-1 text-sm text-muted-foreground">{labels.noResultsHint}</p>
              <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                {labels.clear}
              </Button>
            </div>
          ) : (
            <>
              <div
                className="hidden gap-3 rounded-lg bg-muted/30 px-3 py-2 text-[11px] font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_5.5rem]"
                aria-hidden
              >
                <span>{labels.customer}</span>
                <span className="text-center">{labels.time}</span>
                <span className="text-end">{labels.total}</span>
              </div>

              {filtered.map((inv) => {
                const open = expandedId === inv.id;
                const status = normalizeInvoiceStatus(inv.status);
                const customerName = getInvoiceCustomerDisplayName(inv, lang);
                const orderSummary = formatInvoiceItemsSummary(inv, lang);
                const timeLabel = formatDateTime(inv.createdAt, language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                });
                const hasDiscount =
                  (inv.discountAmount != null && inv.discountAmount > 0) || Boolean(inv.discountCode);

                return (
                  <article
                    key={inv.id}
                    className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm"
                  >
                    <button
                      type="button"
                      className="flex w-full gap-3 p-3 text-start transition-colors hover:bg-muted/20 sm:grid sm:grid-cols-[minmax(0,1fr)_7rem_5.5rem] sm:items-center sm:gap-3 sm:px-4"
                      onClick={() => setExpandedId(open ? null : inv.id)}
                      aria-expanded={open}
                      aria-label={open ? labels.collapse : labels.expand}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-foreground">{customerName}</span>
                          <Badge
                            variant="secondary"
                            className={cn('shrink-0 px-1.5 py-0 text-[10px] font-normal', invoiceStatusBadgeClass(status))}
                          >
                            {invoiceStatusLabel(status, lang)}
                          </Badge>
                          {inv.discountCode ? (
                            <Badge variant="outline" className="shrink-0 font-mono text-[10px] font-normal" dir="ltr">
                              {inv.discountCode}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{orderSummary}</p>
                        <p className="text-[11px] text-muted-foreground/80 sm:hidden">{timeLabel}</p>
                      </div>

                      <p className="hidden shrink-0 text-center text-xs tabular-nums text-muted-foreground sm:block">
                        {timeLabel}
                      </p>

                      <div className="flex shrink-0 flex-col items-end justify-center gap-0.5 sm:items-end">
                        <p className="text-base font-semibold tabular-nums leading-none">
                          {inv.total.toFixed(2)} <span className="text-xs font-medium text-muted-foreground">{currency}</span>
                        </p>
                        {open ? (
                          <ChevronUp className="mt-1 h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {open ? (
                      <div className="border-t border-border/50 bg-muted/10 px-3 py-3 sm:px-4">
                        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>
                            {labels.ref}: <span className="font-mono text-foreground/80">{inv.id}</span>
                          </span>
                          <span>
                            {labels.payment}: {paymentMethodLabel(inv.paymentMethod, lang)}
                          </span>
                          {inv.customerUsername ? (
                            <span dir="ltr">@{inv.customerUsername}</span>
                          ) : null}
                          {inv.customerEmail ? <span dir="ltr">{inv.customerEmail}</span> : null}
                        </div>
                        {(inv.subtotal != null || hasDiscount) && (
                          <dl className="mb-3 grid gap-1.5 rounded-lg border border-border/40 bg-background/60 p-2.5 text-sm sm:grid-cols-2">
                            {inv.subtotal != null ? (
                              <div className="flex justify-between gap-2 sm:block">
                                <dt className="text-xs text-muted-foreground">{labels.subtotal}</dt>
                                <dd className="tabular-nums font-medium">
                                  {inv.subtotal.toFixed(2)} {currency}
                                </dd>
                              </div>
                            ) : null}
                            {hasDiscount ? (
                              <div className="flex justify-between gap-2 sm:block">
                                <dt className="text-xs text-muted-foreground">{labels.discount}</dt>
                                <dd className="tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                                  {inv.discountAmount != null && inv.discountAmount > 0
                                    ? `−${inv.discountAmount.toFixed(2)} ${currency}`
                                    : '—'}
                                  {inv.discountCode ? (
                                    <span className="ms-1 font-mono text-xs text-muted-foreground" dir="ltr">
                                      ({inv.discountCode})
                                    </span>
                                  ) : null}
                                </dd>
                              </div>
                            ) : null}
                          </dl>
                        )}

                        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {labels.lineItems}
                        </p>
                        <ul className="space-y-1.5 text-sm">
                          {inv.items.map((it, idx) => (
                            <li
                              key={`${inv.id}-${idx}`}
                              className="flex justify-between gap-3 border-b border-border/30 pb-1.5 last:border-0"
                            >
                              <span className="min-w-0">
                                <span className="line-clamp-2">{it.name}</span>
                                {it.variant ? (
                                  <span className="text-xs text-muted-foreground">
                                    {' '}
                                    ({it.variant === 'box' ? (isRtl ? 'بوكس' : 'box') : isRtl ? 'حبة' : 'unit'})
                                  </span>
                                ) : null}
                                <span className="text-muted-foreground"> ×{it.qty}</span>
                              </span>
                              <span className="shrink-0 tabular-nums font-medium">
                                {(it.qty * it.price).toFixed(2)} {currency}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoicesPanel;
