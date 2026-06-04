import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CustomerOrderDetailsDialog from '@/components/CustomerOrderDetailsDialog';
import OrdersFilterToolbar from '@/components/OrdersFilterToolbar';
import {
  getInvoicesForCustomer,
  INVOICES_STORAGE_KEY,
  ORDER_TRACK_STEPS,
  formatInvoiceItemsSummary,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  type OrderTrackStatus,
  type StoredInvoice,
} from '@/lib/invoices';
import { CUSTOMER_ORDER_NOTIFICATIONS_CHANGED } from '@/lib/customerOrderNotifications';
import { CATALOG_IMAGES_HYDRATED_EVENT, prefetchCartProductImages } from '@/lib/catalogImages';
import {
  filterAndSortOrders,
  ordersHaveActiveFilters,
  type OrderStatusFilter,
} from '@/lib/orderFilter';
import { formatDateTime, formatNumber } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

/** رقم الطلب | التاريخ | المنتجات | المجموع | الحالة */
const ROW_GRID =
  'lg:grid lg:grid-cols-[minmax(4.5rem,0.72fr)_minmax(5.25rem,0.78fr)_minmax(0,1.35fr)_minmax(4.25rem,0.52fr)_minmax(5.25rem,0.58fr)] lg:items-center lg:gap-x-3';

const Orders = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';

  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<StoredInvoice | null>(null);

  useEffect(() => {
    setInvoices(getInvoicesForCustomer(user?.email, user?.username));
  }, [user?.email, user?.username]);

  useEffect(() => {
    const ids = invoices.flatMap((inv) => inv.items.map((it) => it.id));
    if (ids.length === 0) return;
    void prefetchCartProductImages(ids);
  }, [invoices]);

  useEffect(() => {
    const refresh = () => setInvoices(getInvoicesForCustomer(user?.email, user?.username));
    window.addEventListener(CATALOG_IMAGES_HYDRATED_EVENT, refresh);
    window.addEventListener(CUSTOMER_ORDER_NOTIFICATIONS_CHANGED, refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key === INVOICES_STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CATALOG_IMAGES_HYDRATED_EVENT, refresh);
      window.removeEventListener(CUSTOMER_ORDER_NOTIFICATIONS_CHANGED, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [user?.email, user?.username]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!detailOrder) return;
    const fresh = invoices.find((i) => i.id === detailOrder.id);
    if (fresh) setDetailOrder(fresh);
  }, [invoices, detailOrder?.id]);

  const filteredInvoices = useMemo(
    () =>
      filterAndSortOrders(invoices, {
        query: search,
        status: statusFilter,
        payment: 'all',
        sort: 'newest',
        language,
      }),
    [invoices, search, statusFilter, language],
  );

  const counts = useMemo(() => {
    const c: Record<OrderTrackStatus, number> = { pending: 0, delivering: 0, delivered: 0 };
    invoices.forEach((inv) => {
      c[normalizeInvoiceStatus(inv.status)] += 1;
    });
    return c;
  }, [invoices]);

  const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, safePage]);

  const hasActiveFilters = ordersHaveActiveFilters(search, statusFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const toggleStatusFilter = (s: OrderStatusFilter) => {
    setStatusFilter((prev) => (prev === s ? 'all' : s));
  };

  const t = isRtl
    ? {
        title: 'طلباتي',
        empty: 'لا توجد طلبات بعد.',
        list: 'قائمة الطلبات',
        listHint: 'اضغط على الطلب لعرض التفاصيل والمنتجات.',
        noResults: 'لا توجد طلبات مطابقة',
        noResultsHint: 'جرّب بحثاً أو فلتراً آخر.',
        clearFilters: 'مسح الفلاتر',
        all: 'الكل',
        ref: 'رقم الطلب',
        when: 'التاريخ',
        products: 'المنتجات',
        total: 'المجموع',
        status: 'الحالة',
        currency: 'د.أ',
        openOrder: 'عرض تفاصيل الطلب',
        page: 'صفحة',
        prev: 'السابق',
        next: 'التالي',
        itemCount: 'منتج',
      }
    : {
        title: 'My orders',
        empty: 'No orders yet.',
        list: 'Order list',
        listHint: 'Tap an order to view items and delivery progress.',
        noResults: 'No matching orders',
        noResultsHint: 'Try a different search or filter.',
        clearFilters: 'Clear filters',
        all: 'All',
        ref: 'Order #',
        when: 'Date',
        products: 'Items',
        total: 'Total',
        status: 'Status',
        currency: 'JOD',
        openOrder: 'View order details',
        page: 'Page',
        prev: 'Previous',
        next: 'Next',
        itemCount: 'item(s)',
      };

  const fieldLabel = 'text-[10px] font-medium uppercase tracking-wide text-muted-foreground';

  return (
    <div className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-5xl pb-6">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>

        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-14 text-center text-sm text-muted-foreground">
            {t.empty}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'rounded-xl border border-border/60 bg-card p-2.5 text-start shadow-sm transition-colors hover:bg-muted/30',
                  statusFilter === 'all' && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
                )}
              >
                <p className="text-[10px] text-muted-foreground sm:text-xs">{t.all}</p>
                <p className="text-lg font-semibold tabular-nums sm:text-xl">{invoices.length}</p>
              </button>
              {ORDER_TRACK_STEPS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatusFilter(s)}
                  className={cn(
                    'rounded-xl border border-border/60 bg-card p-2.5 text-start shadow-sm transition-colors hover:bg-muted/30',
                    statusFilter === s && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20',
                  )}
                >
                  <p className="truncate text-[10px] text-muted-foreground sm:text-xs">
                    {invoiceStatusLabel(s, lang)}
                  </p>
                  <p className="text-lg font-semibold tabular-nums sm:text-xl">{counts[s]}</p>
                </button>
              ))}
            </div>

            <OrdersFilterToolbar
              language={language}
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              filteredCount={filteredInvoices.length}
              totalCount={invoices.length}
              hasActiveFilters={hasActiveFilters}
              onClear={clearFilters}
              hideStatusFilter
            />

            <Card className="overflow-hidden border-border/60 shadow-sm">
              <CardHeader className="space-y-0.5 border-b border-border/50 bg-muted/15 px-4 py-3 sm:px-5">
                <CardTitle className="text-base">{t.list}</CardTitle>
                <p className="text-xs text-muted-foreground">{t.listHint}</p>
              </CardHeader>

              <CardContent className="p-0">
                {filteredInvoices.length === 0 ? (
                  <div className="flex flex-col items-center px-6 py-12 text-center">
                    <p className="font-medium">{t.noResults}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t.noResultsHint}</p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      {t.clearFilters}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      className={cn(
                        'hidden border-b border-border/50 bg-muted/25 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid',
                        ROW_GRID,
                      )}
                      aria-hidden
                    >
                      <span className="lg:col-start-1">{t.ref}</span>
                      <span className="lg:col-start-2">{t.when}</span>
                      <span className="lg:col-start-3">{t.products}</span>
                      <span className="lg:col-start-4">{t.total}</span>
                      <span className="lg:col-start-5">{t.status}</span>
                    </div>

                    <ul className="divide-y divide-border/50">
                      {paginated.map((inv) => {
                        const status = normalizeInvoiceStatus(inv.status);
                        const summary = formatInvoiceItemsSummary(inv, lang, 2);
                        const dateLabel = formatDateTime(inv.createdAt, language, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        });

                        return (
                          <li key={inv.id} className="bg-card">
                            <div
                              role="button"
                              tabIndex={0}
                              className={cn(
                                'gap-3 px-3 py-3 sm:px-4 lg:px-4 lg:py-2.5',
                                'cursor-pointer transition-colors hover:bg-muted/25',
                                ROW_GRID,
                              )}
                              onClick={() => setDetailOrder(inv)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setDetailOrder(inv);
                                }
                              }}
                              aria-label={t.openOrder}
                            >
                              <div className="min-w-0 lg:col-start-1">
                                <span className={cn(fieldLabel, 'lg:hidden')}>{t.ref}</span>
                                <p className="font-mono text-sm font-semibold tabular-nums" dir="ltr">
                                  #{inv.id}
                                </p>
                              </div>

                              <div className="min-w-0 lg:col-start-2">
                                <span className={cn(fieldLabel, 'lg:hidden')}>{t.when}</span>
                                <p className="whitespace-nowrap text-xs tabular-nums text-foreground sm:text-sm">
                                  {dateLabel}
                                </p>
                              </div>

                              <div className="min-w-0 lg:col-start-3">
                                <span className={cn(fieldLabel, 'lg:hidden')}>{t.products}</span>
                                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm sm:text-foreground/90">
                                  {summary}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {formatNumber(inv.items.length)} {t.itemCount}
                                </p>
                              </div>

                              <div className="lg:col-start-4">
                                <span className={cn(fieldLabel, 'lg:hidden')}>{t.total}</span>
                                <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-primary">
                                  {formatNumber(inv.total)} {t.currency}
                                </p>
                              </div>

                              <div className="lg:col-start-5">
                                <span className={cn('mb-1 block', fieldLabel, 'lg:hidden')}>{t.status}</span>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    'whitespace-nowrap text-[10px] font-normal',
                                    invoiceStatusBadgeClass(status),
                                  )}
                                >
                                  {invoiceStatusLabel(status, lang)}
                                </Badge>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {pageCount > 1 ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-muted/15 px-4 py-3">
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {t.page} {formatNumber(safePage)} / {formatNumber(pageCount)}
                          {' · '}
                          {formatNumber(filteredInvoices.length)}{' '}
                          {isRtl ? 'طلب' : 'orders'}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={safePage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            aria-label={t.prev}
                          >
                            {isRtl ? (
                              <ChevronRight className="h-4 w-4" />
                            ) : (
                              <ChevronLeft className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={safePage >= pageCount}
                            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                            aria-label={t.next}
                          >
                            {isRtl ? (
                              <ChevronLeft className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <CustomerOrderDetailsDialog
        open={detailOrder != null}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
        invoice={detailOrder}
        language={language}
      />
    </div>
  );
};

export default Orders;
