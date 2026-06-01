import { useMemo } from 'react';
import {
  Banknote,
  Eye,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  Truck,
  Wallet,
} from 'lucide-react';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { getProductViews, type CatalogSection } from '@/lib/catalog';
import {
  getInvoices,
  normalizeInvoiceStatus,
  type StoredInvoice,
} from '@/lib/invoices';
import { listCustomerAccounts } from '@/lib/customerAccounts';
import { formatDate, formatJod } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
  sections: CatalogSection[];
  productSkuCount: number;
  sectionCount: number;
};

type BestSellerRow = {
  id: number;
  name: string;
  qty: number;
  revenue: number;
};

function buildCatalogIndex(sections: CatalogSection[]) {
  const ids = new Set<number>();
  const names = new Map<number, { en: string; ar: string }>();
  for (const section of sections) {
    for (const product of section.products) {
      ids.add(product.id);
      names.set(product.id, product.name);
    }
  }
  return { ids, names };
}

/** طلبات تحتوي على منتجات موجودة حالياً في الكتالوج فقط */
function filterStoreInvoices(invoices: StoredInvoice[], catalogIds: Set<number>) {
  return invoices.filter((inv) => inv.items.some((item) => catalogIds.has(item.id)));
}

function invoiceRevenueFromCatalog(inv: StoredInvoice, catalogIds: Set<number>) {
  return inv.items
    .filter((item) => catalogIds.has(item.id))
    .reduce((sum, item) => sum + item.qty * item.price, 0);
}

const AdminOverviewPanel = ({ language, sections, productSkuCount, sectionCount }: Props) => {
  const isRtl = language === 'ar';
  const allInvoices = getInvoices();
  const customerCount = listCustomerAccounts().length;

  const catalog = useMemo(() => buildCatalogIndex(sections), [sections]);
  const storeInvoices = useMemo(
    () => filterStoreInvoices(allInvoices, catalog.ids),
    [allInvoices, catalog.ids],
  );
  const hasSales = storeInvoices.length > 0;

  const t = useMemo(
    () =>
      isRtl
        ? {
            totalSales: 'إجمالي المبيعات',
            weekSales: 'مبيعات 7 أيام',
            pendingOrders: 'طلبات معلّقة',
            customers: 'العملاء',
            salesChart: 'المبيعات والطلبات (7 أيام)',
            bestSellers: 'الأكثر مبيعاً',
            topViewed: 'الأكثر مشاهدة',
            orderStatus: 'حالة الطلبات',
            pending: 'تم الطلب',
            paid: 'تم الدفع',
            delivering: 'في الطريق',
            delivered: 'تم التوصيل',
            units: 'قطعة',
            noSales: 'لا توجد مبيعات بعد.',
            noViews: 'لا توجد مشاهدات بعد.',
            noChart: 'لا توجد بيانات مبيعات لعرضها بعد.',
          }
        : {
            totalSales: 'Total sales',
            weekSales: 'Sales (7 days)',
            pendingOrders: 'Pending orders',
            customers: 'Customers',
            salesChart: 'Sales & orders (7 days)',
            bestSellers: 'Best sellers',
            topViewed: 'Most viewed',
            orderStatus: 'Order status',
            pending: 'Order placed',
            paid: 'Paid',
            delivering: 'On the way',
            delivered: 'Delivered',
            units: 'units',
            noSales: 'No sales yet.',
            noViews: 'No views yet.',
            noChart: 'No sales data to display yet.',
          },
    [isRtl],
  );

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 6);
    return d.getTime();
  }, []);

  const salesStats = useMemo(() => {
    const totalRevenue = storeInvoices.reduce(
      (sum, inv) => sum + invoiceRevenueFromCatalog(inv, catalog.ids),
      0,
    );
    const weekInvoices = storeInvoices.filter((inv) => inv.createdAt >= weekStart);
    const weekRevenue = weekInvoices.reduce(
      (sum, inv) => sum + invoiceRevenueFromCatalog(inv, catalog.ids),
      0,
    );
    let pending = 0;
    let paid = 0;
    let delivering = 0;
    let delivered = 0;
    for (const inv of storeInvoices) {
      const s = normalizeInvoiceStatus(inv.status);
      if (s === 'delivered') delivered += 1;
      else if (s === 'delivering') delivering += 1;
      else if (s === 'paid') paid += 1;
      else pending += 1;
    }
    return {
      totalRevenue,
      weekRevenue,
      weekOrders: weekInvoices.length,
      orderCount: storeInvoices.length,
      pending,
      paid,
      delivering,
      delivered,
      openOrders: pending + paid + delivering,
    };
  }, [storeInvoices, catalog.ids, weekStart]);

  const dailyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const start = d.getTime();
      const end = start + 86400000;
      const dayInvoices = storeInvoices.filter(
        (inv) => inv.createdAt >= start && inv.createdAt < end,
      );
      return {
        day: formatDate(d, language, { weekday: 'short' }),
        orders: dayInvoices.length,
        revenue: dayInvoices.reduce(
          (sum, inv) => sum + invoiceRevenueFromCatalog(inv, catalog.ids),
          0,
        ),
      };
    });
  }, [storeInvoices, catalog.ids, isRtl]);

  const bestSellers = useMemo((): BestSellerRow[] => {
    const qtyMap = new Map<number, { qty: number; revenue: number; name: string }>();
    for (const inv of storeInvoices) {
      for (const item of inv.items) {
        if (!catalog.ids.has(item.id)) continue;
        const names = catalog.names.get(item.id);
        if (!names) continue;
        const label = names[language];
        const prev = qtyMap.get(item.id) ?? { qty: 0, revenue: 0, name: label };
        prev.qty += item.qty;
        prev.revenue += item.qty * item.price;
        qtyMap.set(item.id, prev);
      }
    }
    return Array.from(qtyMap.entries())
      .map(([id, row]) => ({ id, name: row.name, qty: row.qty, revenue: row.revenue }))
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 8);
  }, [storeInvoices, catalog.ids, catalog.names, language]);

  const topViewed = useMemo(() => {
    return sections
      .flatMap((s) => s.products)
      .map((p) => ({ id: p.id, name: p.name[language], views: getProductViews(p.id) }))
      .filter((p) => p.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [sections, language]);

  const statusTiles = [
    { key: 'pending', label: t.pending, value: salesStats.pending, icon: Clock, tone: 'warning' as const },
    { key: 'paid', label: t.paid, value: salesStats.paid, icon: Wallet, tone: 'default' as const },
    { key: 'delivering', label: t.delivering, value: salesStats.delivering, icon: Truck, tone: 'default' as const },
    { key: 'delivered', label: t.delivered, value: salesStats.delivered, icon: CheckCircle2, tone: 'success' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={t.totalSales}
          value={formatJod(salesStats.totalRevenue, language)}
          hint={
            hasSales
              ? `${salesStats.orderCount} ${isRtl ? 'طلب' : 'orders'}`
              : isRtl
                ? 'لا طلبات بعد'
                : 'No orders yet'
          }
          icon={Banknote}
          tone={hasSales ? 'success' : 'default'}
        />
        <AdminStatCard
          label={t.weekSales}
          value={formatJod(salesStats.weekRevenue, language)}
          hint={
            hasSales
              ? `${salesStats.weekOrders} ${isRtl ? 'طلب هذا الأسبوع' : 'orders this week'}`
              : isRtl
                ? 'آخر 7 أيام'
                : 'Last 7 days'
          }
          icon={TrendingUp}
        />
        <AdminStatCard
          label={t.pendingOrders}
          value={salesStats.openOrders}
          icon={ShoppingBag}
          tone={salesStats.openOrders > 0 ? 'warning' : 'default'}
        />
        <AdminStatCard
          label={t.customers}
          value={customerCount}
          hint={`${productSkuCount} ${isRtl ? 'منتج' : 'products'} · ${sectionCount} ${isRtl ? 'أقسام' : 'sections'}`}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t.salesChart}</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasSales ? (
              <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                {t.noChart}
              </p>
            ) : (
              <ChartContainer
                config={{
                  orders: { label: isRtl ? 'طلبات' : 'Orders', color: 'hsl(var(--primary))' },
                  revenue: { label: isRtl ? 'مبيعات' : 'Revenue', color: 'hsl(var(--accent))' },
                }}
                className="h-[260px] w-full"
              >
                <BarChart data={dailyData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          if (name === 'revenue') return formatJod(Number(value), language);
                          return value;
                        }}
                      />
                    }
                  />
                  <Bar yAxisId="left" dataKey="orders" fill="var(--color-orders)" radius={4} />
                  <Bar yAxisId="right" dataKey="revenue" fill="var(--color-revenue)" radius={4} opacity={0.85} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t.orderStatus}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statusTiles.map(({ key, label, value, icon: Icon, tone }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/15 px-4 py-3"
              >
                <div className="flex items-center gap-2.5 text-sm font-medium">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {label}
                </div>
                <span
                  className={cn(
                    'text-lg font-semibold tabular-nums',
                    tone === 'success' && 'text-emerald-700 dark:text-emerald-300',
                    tone === 'warning' && 'text-amber-800 dark:text-amber-200',
                  )}
                >
                  {value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t.bestSellers}</CardTitle>
          </CardHeader>
          <CardContent>
            {bestSellers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t.noSales}</p>
            ) : (
              <ul className="space-y-2">
                {bestSellers.map((row, index) => (
                  <li
                    key={row.id}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-3 py-2.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.qty} {t.units} · {formatJod(row.revenue, language)}
                      </p>
                    </div>
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t.topViewed}</CardTitle>
          </CardHeader>
          <CardContent>
            {topViewed.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t.noViews}</p>
            ) : (
              <ul className="space-y-2">
                {topViewed.map((row, index) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/80 px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="truncate text-sm font-medium">{row.name}</span>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-sm tabular-nums text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" aria-hidden />
                      {row.views}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverviewPanel;
