import { getInvoiceDeliveredAt, type StoredInvoice } from '@/lib/invoices';
import { formatDate, type FormatLang } from '@/lib/formatNumbers';

export type InvoiceDatePreset = 'all' | 'today' | 'month' | 'year';

export type InvoiceDateFilterState = {
  preset: InvoiceDatePreset;
  year: number | 'all';
  /** 1–12 */
  month: number | 'all';
  /** YYYY-MM-DD من حقل التاريخ */
  day: string;
};

export type InvoiceGroupBy = 'day' | 'month' | 'year';

export function invoiceLedgerTimestamp(inv: StoredInvoice): number {
  return getInvoiceDeliveredAt(inv) ?? inv.createdAt;
}

export function defaultInvoiceDateFilter(): InvoiceDateFilterState {
  return { preset: 'all', year: 'all', month: 'all', day: '' };
}

export function getDistinctInvoiceYears(invoices: StoredInvoice[]): number[] {
  const years = new Set<number>();
  for (const inv of invoices) {
    years.add(new Date(invoiceLedgerTimestamp(inv)).getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

function startOfLocalDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function matchesInvoiceDateFilter(
  inv: StoredInvoice,
  filter: InvoiceDateFilterState,
  now = Date.now(),
): boolean {
  const ts = invoiceLedgerTimestamp(inv);
  const d = new Date(ts);

  if (filter.day.trim()) {
    const pick = new Date(`${filter.day.trim()}T12:00:00`);
    if (Number.isNaN(pick.getTime())) return true;
    const start = startOfLocalDay(pick);
    return ts >= start && ts < start + 86_400_000;
  }

  if (filter.preset === 'today') {
    const start = startOfLocalDay(new Date(now));
    return ts >= start && ts < start + 86_400_000;
  }

  const year = filter.year === 'all' ? null : filter.year;
  const month = filter.month === 'all' ? null : filter.month;

  if (filter.preset === 'month' && year == null && month == null) {
    const nowD = new Date(now);
    return d.getFullYear() === nowD.getFullYear() && d.getMonth() === nowD.getMonth();
  }

  if (filter.preset === 'year' && year == null) {
    return d.getFullYear() === new Date(now).getFullYear();
  }

  if (year != null && d.getFullYear() !== year) return false;
  if (month != null && d.getMonth() + 1 !== month) return false;
  return true;
}

export function invoiceDateFilterActive(filter: InvoiceDateFilterState): boolean {
  return (
    filter.preset !== 'all' ||
    filter.year !== 'all' ||
    filter.month !== 'all' ||
    Boolean(filter.day.trim())
  );
}

export function groupInvoicesBy(
  invoices: StoredInvoice[],
  groupBy: InvoiceGroupBy,
  lang: FormatLang,
): { key: string; label: string; items: StoredInvoice[] }[] {
  const map = new Map<string, StoredInvoice[]>();
  const labels = new Map<string, string>();

  for (const inv of invoices) {
    const ts = invoiceLedgerTimestamp(inv);
    const dt = new Date(ts);
    let key: string;
    let label: string;

    if (groupBy === 'year') {
      key = String(dt.getFullYear());
      label = key;
    } else if (groupBy === 'month') {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      label = formatDate(ts, lang, { year: 'numeric', month: 'long' });
    } else {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      label = formatDate(ts, lang, {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (!map.has(key)) {
      map.set(key, []);
      labels.set(key, label);
    }
    map.get(key)!.push(inv);
  }

  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      key,
      label: labels.get(key)!,
      items,
    }));
}

/** نص التاريخ للبحث النصي */
export function invoiceDateSearchTokens(inv: StoredInvoice, lang: FormatLang): string {
  const ts = invoiceLedgerTimestamp(inv);
  const d = new Date(ts);
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1);
  const day = String(d.getDate());
  const formatted = formatDate(ts, lang, { year: 'numeric', month: 'long', day: 'numeric' });
  return `${y} ${m} ${day} ${formatted}`.toLowerCase();
}
