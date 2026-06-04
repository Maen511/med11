import { Calendar, X } from 'lucide-react';
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
import {
  type InvoiceDateFilterState,
  type InvoiceDatePreset,
  type InvoiceGroupBy,
  invoiceDateFilterActive,
} from '@/lib/invoiceDateFilter';
import { formatNumber } from '@/lib/formatNumbers';

type Props = {
  language: 'en' | 'ar';
  filter: InvoiceDateFilterState;
  onFilterChange: (next: InvoiceDateFilterState) => void;
  groupBy: InvoiceGroupBy;
  onGroupByChange: (value: InvoiceGroupBy) => void;
  years: number[];
  filteredCount: number;
  totalCount: number;
  onClear: () => void;
  className?: string;
};

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

const InvoicesDateFilterBar = ({
  language,
  filter,
  onFilterChange,
  groupBy,
  onGroupByChange,
  years,
  filteredCount,
  totalCount,
  onClear,
  className,
}: Props) => {
  const isRtl = language === 'ar';
  const hasActive = invoiceDateFilterActive(filter);

  const t = isRtl
    ? {
        period: 'الفترة',
        all: 'الكل',
        today: 'اليوم',
        thisMonth: 'هذا الشهر',
        thisYear: 'هذه السنة',
        year: 'السنة',
        month: 'الشهر',
        day: 'يوم محدّد',
        allYears: 'كل السنوات',
        allMonths: 'كل الشهور',
        groupBy: 'تجميع العرض',
        byDay: 'حسب اليوم',
        byMonth: 'حسب الشهر',
        byYear: 'حسب السنة',
        clear: 'مسح فلتر التاريخ',
        showing: `عرض ${filteredCount} من ${totalCount} فاتورة`,
        pickDay: 'اختر يوماً',
      }
    : {
        period: 'Period',
        all: 'All',
        today: 'Today',
        thisMonth: 'This month',
        thisYear: 'This year',
        year: 'Year',
        month: 'Month',
        day: 'Specific day',
        allYears: 'All years',
        allMonths: 'All months',
        groupBy: 'Group by',
        byDay: 'By day',
        byMonth: 'By month',
        byYear: 'By year',
        clear: 'Clear date filter',
        showing: `Showing ${filteredCount} of ${totalCount} invoice(s)`,
        pickDay: 'Pick a day',
      };

  const monthLabel = (m: number) => {
    const d = new Date(2024, m - 1, 15);
    return d.toLocaleDateString(isRtl ? 'ar-JO' : 'en-GB', {
      month: 'long',
      numberingSystem: 'latn',
    });
  };

  const setPreset = (preset: InvoiceDatePreset) => {
    if (preset === 'all') {
      onFilterChange({ preset: 'all', year: 'all', month: 'all', day: '' });
      return;
    }
    if (preset === 'today') {
      const now = new Date();
      const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      onFilterChange({ preset: 'today', year: 'all', month: 'all', day: iso });
      return;
    }
    if (preset === 'month') {
      const now = new Date();
      onFilterChange({
        preset: 'month',
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: '',
      });
      return;
    }
    const now = new Date();
    onFilterChange({ preset: 'year', year: now.getFullYear(), month: 'all', day: '' });
  };

  const presets: { id: InvoiceDatePreset; label: string }[] = [
    { id: 'all', label: t.all },
    { id: 'today', label: t.today },
    { id: 'month', label: t.thisMonth },
    { id: 'year', label: t.thisYear },
  ];

  return (
    <div
      className={cn(
        'space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 shadow-sm sm:p-5',
        className,
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="text-xs font-medium text-muted-foreground">{t.period}</span>
        {presets.map(({ id, label }) => {
          const active =
            id === 'all'
              ? !hasActive
              : filter.preset === id &&
                (id !== 'today' || Boolean(filter.day)) &&
                (id !== 'month' || (filter.year !== 'all' && filter.month !== 'all')) &&
                (id !== 'year' || (filter.year !== 'all' && filter.month === 'all'));
          return (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={active ? 'default' : 'outline'}
              className="h-8"
              onClick={() => setPreset(id)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t.year}</Label>
          <Select
            value={filter.year === 'all' ? 'all' : String(filter.year)}
            onValueChange={(v) =>
              onFilterChange({
                ...filter,
                preset: 'all',
                year: v === 'all' ? 'all' : Number(v),
                day: '',
              })
            }
          >
            <SelectTrigger className="h-10 bg-background/90">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="all">{t.allYears}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {formatNumber(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t.month}</Label>
          <Select
            value={filter.month === 'all' ? 'all' : String(filter.month)}
            onValueChange={(v) =>
              onFilterChange({
                ...filter,
                preset: 'all',
                month: v === 'all' ? 'all' : Number(v),
                day: '',
              })
            }
          >
            <SelectTrigger className="h-10 bg-background/90">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="all">{t.allMonths}</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {monthLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inv-filter-day" className="text-xs text-muted-foreground">
            {t.day}
          </Label>
          <Input
            id="inv-filter-day"
            type="date"
            value={filter.day}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                preset: 'all',
                day: e.target.value,
              })
            }
            className="h-10 bg-background/90"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t.groupBy}</Label>
          <Select value={groupBy} onValueChange={(v) => onGroupByChange(v as InvoiceGroupBy)}>
            <SelectTrigger className="h-10 bg-background/90">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[200]">
              <SelectItem value="day">{t.byDay}</SelectItem>
              <SelectItem value="month">{t.byMonth}</SelectItem>
              <SelectItem value="year">{t.byYear}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{t.showing}</p>
        {hasActive ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={onClear}>
            <X className="h-3.5 w-3.5" />
            {t.clear}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default InvoicesDateFilterBar;
