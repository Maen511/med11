import { useMemo, useState } from 'react';
import { Search, Save, RotateCcw, Package, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { CatalogSection } from '@/lib/catalog';
import {
  applyBulkStockUpdates,
  getInventoryRows,
  getInventorySummary,
  getLowStockThreshold,
  matchesStockFilter,
  type StockFilter,
} from '@/lib/inventory';
import AdminStatCard from '@/components/admin/AdminStatCard';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
  sections: CatalogSection[];
  onReload: () => void;
};

const AdminInventoryPanel = ({ language, sections, onReload }: Props) => {
  const isRtl = language === 'ar';
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [draft, setDraft] = useState<Record<string, number>>({});

  const summary = useMemo(() => getInventorySummary(sections), [sections]);
  const rows = useMemo(() => getInventoryRows(sections), [sections]);
  const threshold = getLowStockThreshold();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (sectionFilter !== 'all' && row.sectionId !== sectionFilter) return false;
      const qty = draft[`${row.sectionId}:${row.product.id}`] ?? row.product.stockCount ?? 0;
      if (!matchesStockFilter(qty, stockFilter)) return false;
      if (!q) return true;
      const nameEn = row.product.name.en.toLowerCase();
      const nameAr = row.product.name.ar.toLowerCase();
      return (
        nameEn.includes(q) ||
        nameAr.includes(q) ||
        String(row.product.id).includes(q) ||
        row.sectionId.toLowerCase().includes(q)
      );
    });
  }, [rows, search, sectionFilter, stockFilter, draft]);

  const dirtyCount = Object.keys(draft).length;

  const getQty = (sectionId: string, productId: number, fallback: number) =>
    draft[`${sectionId}:${productId}`] ?? fallback;

  const setQty = (sectionId: string, productId: number, value: number) => {
    setDraft((prev) => ({ ...prev, [`${sectionId}:${productId}`]: Math.max(0, Math.floor(value)) }));
  };

  const resetDraft = () => setDraft({});

  const saveAll = () => {
    const updates = Object.entries(draft).map(([key, stockCount]) => {
      const [sectionId, id] = key.split(':');
      return { sectionId, productId: Number(id), stockCount };
    });
    if (updates.length === 0) return;
    applyBulkStockUpdates(updates);
    setDraft({});
    onReload();
    toast.success(isRtl ? 'تم حفظ المخزون' : 'Inventory saved');
  };

  const stockBadge = (qty: number) => {
    if (qty === 0) {
      return (
        <Badge variant="destructive" className="font-medium">
          {isRtl ? 'نفد' : 'Out of stock'}
        </Badge>
      );
    }
    if (qty <= threshold) {
      return (
        <Badge className="border-amber-500/30 bg-amber-500/15 font-medium text-amber-900 dark:text-amber-200">
          {isRtl ? `منخفض (${qty})` : `Low (${qty})`}
        </Badge>
      );
    }
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/15 font-medium text-emerald-900 dark:text-emerald-200">
        {isRtl ? `متوفر (${qty})` : `In stock (${qty})`}
      </Badge>
    );
  };

  const filterButtons: { id: StockFilter; labelEn: string; labelAr: string }[] = [
    { id: 'all', labelEn: 'All', labelAr: 'الكل' },
    { id: 'in_stock', labelEn: 'Healthy', labelAr: 'جيد' },
    { id: 'low', labelEn: 'Low stock', labelAr: 'منخفض' },
    { id: 'out', labelEn: 'Out of stock', labelAr: 'نفد' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label={isRtl ? 'إجمالي الوحدات' : 'Total units'}
          value={summary.totalUnits}
          hint={isRtl ? `${summary.totalSkus} صنف` : `${summary.totalSkus} SKUs`}
          icon={Package}
        />
        <AdminStatCard
          label={isRtl ? 'متوفر' : 'In stock'}
          value={summary.inStockSkus}
          icon={CheckCircle2}
          tone="success"
        />
        <AdminStatCard
          label={isRtl ? 'مخزون منخفض' : 'Low stock'}
          value={summary.lowStockSkus}
          hint={isRtl ? `≤ ${threshold} وحدات` : `≤ ${threshold} units`}
          icon={AlertTriangle}
          tone="warning"
        />
        <AdminStatCard
          label={isRtl ? 'نفد' : 'Out of stock'}
          value={summary.outOfStockSkus}
          icon={XCircle}
          tone="danger"
        />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/50 bg-muted/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">{isRtl ? 'إدارة المخزون' : 'Inventory control'}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRtl
                ? 'حدّث الكميات، راقب التنبيهات، واحفظ التغييرات دفعة واحدة.'
                : 'Update quantities, monitor alerts, and save changes in bulk.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={resetDraft} disabled={dirtyCount === 0}>
              <RotateCcw className="h-4 w-4" />
              {isRtl ? 'تراجع' : 'Reset'}
            </Button>
            <Button size="sm" onClick={saveAll} disabled={dirtyCount === 0}>
              <Save className="h-4 w-4" />
              {isRtl ? `حفظ (${dirtyCount})` : `Save (${dirtyCount})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={isRtl ? 'بحث بالاسم أو الرقم…' : 'Search by name or SKU…'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="all">{isRtl ? 'كل الأقسام' : 'All sections'}</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title[language]} ({s.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterButtons.map((f) => (
              <Button
                key={f.id}
                type="button"
                size="sm"
                variant={stockFilter === f.id ? 'default' : 'outline'}
                onClick={() => setStockFilter(f.id)}
              >
                {isRtl ? f.labelAr : f.labelEn}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[min(520px,60vh)] rounded-xl border border-border/60">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
                <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{isRtl ? 'المنتج' : 'Product'}</th>
                  <th className="px-4 py-3 font-medium">{isRtl ? 'القسم' : 'Section'}</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 font-medium">{isRtl ? 'الكمية' : 'Quantity'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                      {isRtl ? 'لا توجد نتائج.' : 'No items match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const baseQty = row.product.stockCount ?? 0;
                    const qty = getQty(row.sectionId, row.product.id, baseQty);
                    const dirty = draft[`${row.sectionId}:${row.product.id}`] !== undefined;
                    return (
                      <tr
                        key={`${row.sectionId}-${row.product.id}`}
                        className={cn('border-b border-border/40 transition-colors', dirty && 'bg-primary/5')}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={row.product.image}
                              alt=""
                              className="h-11 w-11 rounded-lg border object-cover"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{row.product.name[language]}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {row.product.price} {isRtl ? 'د.أ' : 'JOD'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.sectionTitle[language]}</td>
                        <td className="px-4 py-3 font-mono text-xs">#{row.product.id}</td>
                        <td className="px-4 py-3">{stockBadge(qty)}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            className="h-9 w-24 tabular-nums"
                            value={qty}
                            onChange={(e) => setQty(row.sectionId, row.product.id, Number(e.target.value))}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventoryPanel;
