import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AdminOrderDetailsDialog from '@/components/admin/AdminOrderDetailsDialog';
import OrdersFilterToolbar from '@/components/OrdersFilterToolbar';
import { useAdminOrderNotifications } from '@/hooks/useAdminOrderNotifications';
import {
  formatAdminOrderNotificationBody,
  resolveNotificationCustomerName,
} from '@/lib/adminOrderNotifications';
import {
  ORDER_TRACK_STEPS,
  adminOrdersArchiveRemainingMs,
  formatAdminOrdersArchiveRemaining,
  filterAdminActiveOrders,
  getInvoiceCustomerDisplayName,
  getInvoiceCustomerPhones,
  getInvoiceDeliveryLocation,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  updateInvoiceStatus,
  type OrderTrackStatus,
  type StoredInvoice,
} from '@/lib/invoices';
import {
  filterAndSortOrders,
  ordersHaveActiveFilters,
  type OrderStatusFilter,
} from '@/lib/orderFilter';
import { formatDateTime, formatNumber } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

const PAGE_SIZE = 12;

/** أعمدة الجدول: عميل | هاتف | عنوان | تاريخ | مجموع | حالة */
const ROW_GRID =
  'lg:grid lg:grid-cols-[minmax(5.5rem,0.82fr)_minmax(7.25rem,0.88fr)_minmax(0,1.22fr)_minmax(5.25rem,0.68fr)_minmax(4.25rem,0.48fr)_minmax(5.5rem,0.58fr)] lg:items-center lg:gap-x-3';

type Props = {
  language: 'en' | 'ar';
  invoices: StoredInvoice[];
  onRefresh: () => void;
};

const AdminOrdersPanel = ({ language, invoices, onRefresh }: Props) => {
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [page, setPage] = useState(1);
  const [detailOrder, setDetailOrder] = useState<StoredInvoice | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const {
    notifications: orderNotifications,
    unreadCount: ordersUnread,
    markRead: markOrderNotificationRead,
    markAllRead: markAllOrderNotificationsRead,
  } = useAdminOrderNotifications();

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (!detailOrder) return;
    const fresh = invoices.find((i) => i.id === detailOrder.id);
    if (fresh) setDetailOrder(fresh);
  }, [invoices, detailOrder?.id]);

  const sorted = useMemo(
    () => [...invoices].sort((a, b) => b.createdAt - a.createdAt),
    [invoices],
  );

  const active = useMemo(() => filterAdminActiveOrders(sorted, now), [sorted, now]);

  const filtered = useMemo(
    () =>
      filterAndSortOrders(active, {
        query: search,
        status: statusFilter,
        payment: 'all',
        sort: 'newest',
        includeCustomerInSearch: true,
        language,
      }),
    [active, search, statusFilter, language],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const hasActiveFilters = ordersHaveActiveFilters(search, statusFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const counts = useMemo(() => {
    const c: Record<OrderTrackStatus, number> = { pending: 0, delivering: 0, delivered: 0 };
    active.forEach((inv) => {
      const s = normalizeInvoiceStatus(inv.status);
      c[s] += 1;
    });
    return c;
  }, [active]);

  const openOrderDetails = (inv: StoredInvoice) => {
    queueMicrotask(() => {
      setDetailOrder(inv);
      markOrderNotificationRead(inv.id);
    });
  };

  const handleStatus = (invoiceId: string, status: OrderTrackStatus) => {
    updateInvoiceStatus(invoiceId, status);
    onRefresh();
    const deliveredNote =
      status === 'delivered'
        ? isRtl
          ? ' سيختفي من القائمة بعد 24 ساعة.'
          : ' It will leave this list after 24 hours.'
        : '';
    toast.success(
      isRtl
        ? `تم تحديث الطلب #${invoiceId} — ${invoiceStatusLabel(status, 'ar')}.${deliveredNote}`
        : `Order #${invoiceId} → ${invoiceStatusLabel(status, 'en')}.${deliveredNote}`,
    );
  };

  const t = isRtl
    ? {
        empty: 'لا توجد طلبات للتتبع.',
        emptyActive: 'لا توجد طلبات نشطة للتتبع',
        emptyActiveHint: 'الطلبات المُسلَّمة تختفي من هنا بعد 24 ساعة — راجعها في قسم «الفواتير».',
        list: 'قائمة الطلبات',
        listHint: 'اضغط على الطلب لفتح التفاصيل وتحديث الحالة من مسار الطلب.',
        noResults: 'لا توجد نتائج مطابقة',
        noResultsHint: 'جرّب بحثاً أو فلتراً آخر.',
        clear: 'مسح الفلاتر',
        all: 'الكل',
        products: 'المنتجات',
        customer: 'العميل',
        phone: 'الهاتف',
        location: 'الموقع',
        when: 'التاريخ',
        noPhone: '—',
        noLocation: '—',
        ref: 'مرجع',
        total: 'المجموع',
        status: 'الحالة',
        items: 'منتج',
        openOrder: 'عرض تفاصيل الطلب',
        page: 'صفحة',
        prev: 'السابق',
        next: 'التالي',
        archiveIn: 'يُزال خلال',
        alertsTitle: 'طلبات جديدة',
        alertsMarkRead: 'تعليم الكل كمقروء',
        alertsRecent: 'اضغط على إشعار لفتح تفاصيل الطلب',
        orderedBy: 'طلب من',
      }
    : {
        empty: 'No orders to track yet.',
        emptyActive: 'No active orders to track',
        emptyActiveHint: 'Delivered orders leave this list after 24 hours — see Invoices for history.',
        list: 'Orders list',
        listHint: 'Tap an order to open details and update status from the progress path.',
        noResults: 'No matching orders',
        noResultsHint: 'Try a different search or filter.',
        clear: 'Clear filters',
        all: 'All',
        products: 'Products',
        customer: 'Customer',
        phone: 'Phone',
        location: 'Address',
        when: 'Date',
        noPhone: '—',
        noLocation: '—',
        ref: 'Ref',
        total: 'Total',
        status: 'Status',
        items: 'item(s)',
        openOrder: 'View order details',
        page: 'Page',
        prev: 'Previous',
        next: 'Next',
        archiveIn: 'Archive in',
        alertsTitle: 'New orders',
        alertsMarkRead: 'Mark all read',
        alertsRecent: 'Tap a notification to open order details',
        orderedBy: 'Ordered by',
      };

  const recentUnreadOrders = useMemo(
    () => orderNotifications.filter((n) => !n.read).slice(0, 8),
    [orderNotifications],
  );

  const openOrderFromNotification = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (inv) openOrderDetails(inv);
    else markOrderNotificationRead(invoiceId);
  };

  const toggleStatusFilter = (s: OrderStatusFilter) => {
    setStatusFilter((current) => (current === s ? 'all' : s));
  };

  if (sorted.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        </CardContent>
      </Card>
    );
  }

  if (active.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">{t.emptyActive}</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">{t.emptyActiveHint}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {ordersUnread > 0 ? (
        <Card className="border-red-500/30 bg-red-500/5 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-red-600 dark:text-red-400" />
              {t.alertsTitle}
              <Badge variant="secondary" className="bg-red-500/15 text-red-900 dark:text-red-100">
                {ordersUnread}
              </Badge>
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => markAllOrderNotificationsRead()}>
              {t.alertsMarkRead}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p className="text-xs text-muted-foreground">{t.alertsRecent}</p>
            <ul className="space-y-2">
              {recentUnreadOrders.map((n) => {
                const inv = invoices.find((i) => i.id === n.invoiceId);
                const customer = resolveNotificationCustomerName(n, inv, lang);
                return (
                  <li key={n.invoiceId}>
                    <button
                      type="button"
                      className="flex w-full flex-wrap items-start justify-between gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-start text-sm transition-colors hover:bg-muted/40"
                      onClick={() => openOrderFromNotification(n.invoiceId)}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {t.orderedBy} {customer}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatAdminOrderNotificationBody(n, lang)}
                        </p>
                      </div>
                      <p className="shrink-0 text-[11px] text-muted-foreground">
                        {formatDateTime(n.createdAt, language, {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

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
          <p className="text-lg font-semibold tabular-nums sm:text-xl">{active.length}</p>
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
        filteredCount={filtered.length}
        totalCount={active.length}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
        adminSearch
        hideStatusFilter
      />

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="space-y-0.5 border-b border-border/50 bg-muted/15 px-4 py-3 sm:px-5">
          <CardTitle className="text-base">{t.list}</CardTitle>
          <p className="text-xs text-muted-foreground">{t.listHint}</p>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <p className="font-medium">{t.noResults}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.noResultsHint}</p>
              <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                {t.clear}
              </Button>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'hidden border-b border-border/50 bg-muted/25 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
                  ROW_GRID,
                )}
                aria-hidden
              >
                <span className="lg:col-start-1">{t.customer}</span>
                <span className="lg:col-start-2 lg:text-start">{t.phone}</span>
                <span className="lg:col-start-3">{t.location}</span>
                <span className="lg:col-start-4">{t.when}</span>
                <span className="lg:col-start-5">{t.total}</span>
                <span className="lg:col-start-6">{t.status}</span>
              </div>

              <ul className="divide-y divide-border/50">
                {paginated.map((inv) => {
                  const status = normalizeInvoiceStatus(inv.status);
                  const archiveRemaining = adminOrdersArchiveRemainingMs(inv, now);
                  const customerName = getInvoiceCustomerDisplayName(inv, lang);
                  const customerPhones = getInvoiceCustomerPhones(inv);
                  const deliveryLocation = getInvoiceDeliveryLocation(inv, lang);
                  const dateLabel = formatDateTime(inv.createdAt, language, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });

                  const fieldLabel = 'text-[10px] font-medium uppercase tracking-wide text-muted-foreground';

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
                        onClick={() => openOrderDetails(inv)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openOrderDetails(inv);
                          }
                        }}
                        aria-label={t.openOrder}
                      >
                        {/* عميل */}
                        <div className="min-w-0 lg:col-start-1">
                          <span className={cn(fieldLabel, 'lg:hidden')}>{t.customer}</span>
                          <p className="truncate text-sm font-semibold text-foreground">{customerName}</p>
                        </div>

                        {/* هاتف — محاذاة مع عنوان العمود (RTL: بداية العمود = تحت «الهاتف») */}
                        <div className="min-w-0 lg:col-start-2 lg:text-start">
                          <span className={cn(fieldLabel, 'lg:hidden')}>{t.phone}</span>
                          {customerPhones.length > 0 ? (
                            <ul className="space-y-0.5">
                              {customerPhones.map((phone) => (
                                <li key={phone}>
                                  <bdi
                                    dir="ltr"
                                    className="inline-block text-sm font-medium tabular-nums text-foreground"
                                  >
                                    {phone}
                                  </bdi>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground">{t.noPhone}</p>
                          )}
                        </div>

                        {/* عنوان */}
                        <div className="min-w-0 lg:col-start-3">
                          <span className={cn(fieldLabel, 'lg:hidden')}>{t.location}</span>
                          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground lg:text-sm lg:text-foreground/90">
                            {deliveryLocation || t.noLocation}
                          </p>
                        </div>

                        {/* تاريخ — بدون هاتف */}
                        <div className="min-w-0 lg:col-start-4">
                          <span className={cn(fieldLabel, 'lg:hidden')}>{t.when}</span>
                          <p className="whitespace-nowrap text-xs tabular-nums text-foreground lg:text-sm">
                            {dateLabel}
                          </p>
                          {archiveRemaining != null ? (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                              {t.archiveIn} {formatAdminOrdersArchiveRemaining(archiveRemaining, lang)}
                            </p>
                          ) : null}
                        </div>

                        {/* مجموع */}
                        <div className="lg:col-start-5">
                          <span className={cn(fieldLabel, 'lg:hidden')}>{t.total}</span>
                          <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-primary">
                            {formatNumber(inv.total)} {isRtl ? 'د.أ' : 'JOD'}
                          </p>
                        </div>

                        {/* حالة */}
                        <div className="lg:col-start-6">
                          <span className={cn('mb-1 block', fieldLabel, 'lg:hidden')}>{t.status}</span>
                          <Badge
                            variant="secondary"
                            className={cn('whitespace-nowrap text-[10px] font-normal', invoiceStatusBadgeClass(status))}
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
                    {formatNumber(filtered.length)} {isRtl ? 'طلب' : 'orders'}
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

      <AdminOrderDetailsDialog
        open={detailOrder != null}
        onOpenChange={(open) => {
          if (!open) setDetailOrder(null);
        }}
        invoice={detailOrder}
        language={language}
        now={now}
        onStatusChange={handleStatus}
      />
    </div>
  );
};

export default AdminOrdersPanel;
