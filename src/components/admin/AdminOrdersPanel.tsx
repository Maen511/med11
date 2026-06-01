import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import OrdersFilterToolbar from '@/components/OrdersFilterToolbar';
import {
  ORDER_TRACK_STEPS,
  adminOrdersArchiveRemainingMs,
  filterAdminActiveOrders,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  updateInvoiceStatus,
  type InvoiceStatus,
  type StoredInvoice,
} from '@/lib/invoices';
import {
  filterAndSortOrders,
  ordersHaveActiveFilters,
  type OrderStatusFilter,
} from '@/lib/orderFilter';
import { formatDateTime } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const hasActiveFilters = ordersHaveActiveFilters(search, statusFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const counts = useMemo(() => {
    const c: Record<InvoiceStatus, number> = { pending: 0, paid: 0, delivering: 0, delivered: 0 };
    active.forEach((inv) => {
      const s = normalizeInvoiceStatus(inv.status);
      c[s] += 1;
    });
    return c;
  }, [active]);

  const handleStatus = (invoiceId: string, status: InvoiceStatus) => {
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

  const formatArchiveRemaining = (ms: number) => {
    const hours = Math.ceil(ms / (60 * 60 * 1000));
    if (hours >= 24) {
      const days = Math.ceil(hours / 24);
      return isRtl ? `${days} يوم` : `${days}d`;
    }
    return isRtl ? `${hours} س` : `${hours}h`;
  };

  if (sorted.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {isRtl ? 'لا توجد طلبات للتتبع.' : 'No orders to track yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (active.length === 0) {
    return (
      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">
            {isRtl ? 'لا توجد طلبات نشطة للتتبع' : 'No active orders to track'}
          </p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {isRtl
              ? 'الطلبات المُسلَّمة تختفي من هنا بعد 24 ساعة — راجعها في قسم «الفواتير».'
              : 'Delivered orders leave this list after 24 hours — see Invoices for history.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ORDER_TRACK_STEPS.map((s) => (
          <Card key={s} className="border-border/60 shadow-sm">
            <CardContent className="p-2.5 sm:p-3">
              <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">
                {invoiceStatusLabel(s, lang)}
              </p>
              <p className="text-lg font-semibold tabular-nums sm:text-xl">{counts[s]}</p>
            </CardContent>
          </Card>
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
      />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-0.5 px-4 py-3 sm:px-5">
          <CardTitle className="text-base">{isRtl ? 'تتبع الطلبات' : 'Order tracking'}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {isRtl
              ? 'اضغط على المراحل لتحديث الحالة. الطلبات المُسلَّمة تُزال من القائمة بعد 24 ساعة (تبقى في الفواتير).'
              : 'Click a stage to update status. Delivered orders drop off this list after 24 hours (still in Invoices).'}
          </p>
        </CardHeader>
        <CardContent className="space-y-2.5 px-3 pb-3 sm:px-4 sm:pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
              <p className="font-medium">{isRtl ? 'لا توجد نتائج مطابقة' : 'No matching orders'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRtl ? 'جرّب بحثاً أو فلتراً آخر.' : 'Try a different search or filter.'}
              </p>
              <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                {isRtl ? 'مسح الفلاتر' : 'Clear filters'}
              </Button>
            </div>
          ) : (
            filtered.map((inv) => {
              const status = normalizeInvoiceStatus(inv.status);
              const archiveRemaining = adminOrdersArchiveRemainingMs(inv, now);
              return (
                <article
                  key={inv.id}
                  className="rounded-lg border border-border/60 bg-card p-3 shadow-sm"
                >
                  <div className="mb-2.5 flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-sm font-semibold">#{inv.id}</span>
                        <Badge
                          variant="secondary"
                          className={cn('px-1.5 py-0 text-[10px] font-normal', invoiceStatusBadgeClass(status))}
                        >
                          {invoiceStatusLabel(status, lang)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {inv.customerUsername ? `@${inv.customerUsername}` : inv.customerEmail || '—'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDateTime(inv.createdAt, language, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                        {' · '}
                        {inv.items.length} {isRtl ? 'منتج' : 'item(s)'}
                        {' · '}
                        <span className="font-medium text-foreground">
                          {inv.total} {isRtl ? 'د.أ' : 'JOD'}
                        </span>
                      </p>
                      {archiveRemaining != null ? (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          {isRtl
                            ? `يُزال من القائمة خلال ${formatArchiveRemaining(archiveRemaining)}`
                            : `Removed from list in ${formatArchiveRemaining(archiveRemaining)}`}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <OrderStatusStepper
                    status={status}
                    language={language}
                    compact
                    onStatusChange={(next) => handleStatus(inv.id, next)}
                  />
                </article>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrdersPanel;
