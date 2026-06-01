import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getInvoicesForCustomer,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  type StoredInvoice,
} from '@/lib/invoices';
import { getProductById } from '@/lib/products';
import { getProductPlaceholderImage } from '@/lib/productPlaceholders';
import { CartProductImage } from '@/components/CartProductImage';
import { CheckCircle2, Clock, Truck, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BankTransferPaymentPanel } from '@/components/BankTransferPaymentPanel';
import { SaleModeVariantBadge } from '@/components/ProductSaleModeBadge';
import { resolveCartItemName } from '@/lib/productSaleModes';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { formatDateTime } from '@/lib/formatNumbers';
import OrdersFilterToolbar from '@/components/OrdersFilterToolbar';
import {
  filterAndSortOrders,
  ordersHaveActiveFilters,
  type OrderStatusFilter,
} from '@/lib/orderFilter';

const Orders = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');

  useEffect(() => {
    setInvoices(getInvoicesForCustomer(user?.email, user?.username));
  }, [user?.email, user?.username]);

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

  const hasActiveFilters = ordersHaveActiveFilters(search, statusFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const t =
    language === 'ar'
      ? {
          title: 'طلباتي',
          empty: 'لا توجد طلبات بعد.',
          noResults: 'لا توجد طلبات مطابقة',
          noResultsHint: 'جرّب كلمة بحث أخرى أو غيّر الفلاتر.',
          clearFilters: 'مسح الفلاتر',
          delivered: 'تم التوصيل',
          delivering: 'يتم التوصيل',
          pending: 'معلّق',
          total: 'الإجمالي',
          items: 'المنتجات',
          currency: 'د.أ',
        }
      : {
          title: 'My orders',
          empty: 'No orders yet.',
          noResults: 'No matching orders',
          noResultsHint: 'Try a different search term or adjust the filters.',
          clearFilters: 'Clear filters',
          delivered: 'Delivered',
          delivering: 'Out for delivery',
          pending: 'Pending',
          total: 'Total',
          items: 'Items',
          currency: 'JOD',
        };

  return (
    <div className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-3xl pb-4">
        <h1 className="mb-2 text-3xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {language === 'ar'
            ? 'ابحث وفلتر طلباتك حسب الحالة.'
            : 'Search and filter your orders by status.'}
        </p>

        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-12 text-center text-sm text-muted-foreground">
            {t.empty}
          </div>
        ) : (
          <>
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
              className="mb-6"
            />

            {filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-14 text-center">
                <p className="text-lg font-medium text-foreground">{t.noResults}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t.noResultsHint}</p>
                <Button type="button" variant="secondary" size="sm" className="mt-5" onClick={clearFilters}>
                  {t.clearFilters}
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredInvoices.map((inv) => {
                  const status = normalizeInvoiceStatus(inv.status);
                  const StatusIcon =
                    status === 'delivered'
                      ? CheckCircle2
                      : status === 'delivering'
                        ? Truck
                        : status === 'paid'
                          ? Wallet
                          : Clock;
                  return (
                    <Card key={inv.id} className="luxury-card overflow-hidden border shadow-sm">
                      <CardContent className="p-0">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold tracking-wide text-foreground">
                              #{inv.id}
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn('gap-1', invoiceStatusBadgeClass(status))}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              {invoiceStatusLabel(status, language === 'ar' ? 'ar' : 'en')}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(inv.createdAt, language, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </div>
                        </div>
                        {inv.paymentMethod === 'bank_transfer' ? (
                          <div className="border-b px-4 py-3">
                            <BankTransferPaymentPanel invoiceId={inv.id} language={language} />
                          </div>
                        ) : null}
                        <div className="border-b bg-muted/10 px-4 py-4">
                          <OrderStatusStepper status={status} language={language} readOnly />
                        </div>
                        <div className="bg-gradient-to-b from-muted/25 to-transparent px-2 py-2 sm:px-3">
                          <p className="mb-2 px-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {t.items}
                          </p>
                          <ul className="space-y-2">
                            {inv.items.map((it, idx) => {
                              const prod = getProductById(it.id);
                              const name = prod
                                ? prod.name[language]
                                : resolveCartItemName(
                                    typeof it.name === 'object' ? it.name : { en: String(it.name ?? ''), ar: String(it.name ?? '') },
                                    language,
                                  );
                              const image = prod?.image ?? getProductPlaceholderImage(it.id);
                              const lineTotal = it.qty * it.price;
                              return (
                                <li key={`${inv.id}-${idx}-${it.id}`}>
                                  <Link
                                    to={`/product/${it.id}`}
                                    className="group flex gap-3 rounded-xl border border-border/60 bg-card/90 p-2.5 shadow-sm transition hover:border-primary/35 hover:bg-card hover:shadow-md sm:gap-4 sm:p-3"
                                  >
                                    <div className="relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-muted shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                                      <CartProductImage
                                        productId={it.id}
                                        image={image}
                                        alt={name}
                                        className="h-16 w-16 object-cover transition duration-300 group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]"
                                      />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                                      <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary sm:text-base">
                                        {name}
                                      </span>
                                      {it.variant ? (
                                        <SaleModeVariantBadge
                                          variantName={it.variant}
                                          language={language}
                                          className="w-fit"
                                        />
                                      ) : null}
                                      <span className="text-xs text-muted-foreground">
                                        ×{it.qty} · {it.price} {t.currency}
                                      </span>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end justify-center text-end">
                                      <span className="text-sm font-bold tabular-nums text-foreground sm:text-base">
                                        {lineTotal} {t.currency}
                                      </span>
                                    </div>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3 text-sm font-semibold">
                          <span className="text-muted-foreground">{t.total}</span>
                          <span>
                            {inv.total} {t.currency}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
