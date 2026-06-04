import {
  getInvoiceCustomerPhones,
  getInvoiceDeliveryLocation,
  normalizeInvoiceStatus,
  paymentMethodLabel,
  type InvoicePaymentMethod,
  type OrderTrackStatus,
  type StoredInvoice,
} from '@/lib/invoices';

export type OrderStatusFilter = 'all' | OrderTrackStatus;

export type OrderPaymentFilter = 'all' | InvoicePaymentMethod;

export type OrderSort = 'newest' | 'oldest' | 'total_desc' | 'total_asc';

export function filterAndSortOrders(
  invoices: StoredInvoice[],
  opts: {
    query: string;
    status: OrderStatusFilter;
    payment: OrderPaymentFilter;
    sort: OrderSort;
    /** بحث في بيانات العميل (لوحة الأدمن) */
    includeCustomerInSearch?: boolean;
    /** نص إضافي للبحث (مثلاً تواريخ الفاتورة) */
    extraSearchText?: (inv: StoredInvoice) => string;
    language?: 'en' | 'ar';
  },
): StoredInvoice[] {
  const q = opts.query.trim().toLowerCase();
  const lang = opts.language ?? 'en';

  let list = invoices.filter((inv) => {
    const status = normalizeInvoiceStatus(inv.status);
    if (opts.status !== 'all' && status !== opts.status) return false;

    const method = inv.paymentMethod ?? 'cod';
    if (opts.payment !== 'all' && method !== opts.payment) return false;

    if (!q) return true;

    const haystack = [
      inv.id,
      String(inv.total),
      inv.subtotal != null ? String(inv.subtotal) : '',
      inv.discountAmount != null ? String(inv.discountAmount) : '',
      inv.discountCode ?? '',
      inv.influencerName ?? '',
      ...inv.items.map((it) => it.name),
      ...inv.items.map((it) => String(it.id)),
      opts.includeCustomerInSearch ? inv.customerEmail : '',
      opts.includeCustomerInSearch ? inv.customerUsername : '',
      opts.includeCustomerInSearch ? inv.customerName : '',
      opts.includeCustomerInSearch ? inv.customerPhone : '',
      opts.includeCustomerInSearch ? inv.deliveryAddress : '',
      opts.includeCustomerInSearch ? inv.deliveryCity : '',
      opts.includeCustomerInSearch ? inv.deliveryLabel : '',
      opts.includeCustomerInSearch ? getInvoiceCustomerPhones(inv).join(' ') : '',
      opts.includeCustomerInSearch ? getInvoiceDeliveryLocation(inv, lang) : '',
      paymentMethodLabel(method, lang),
      opts.extraSearchText?.(inv) ?? '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  list = [...list].sort((a, b) => {
    switch (opts.sort) {
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'total_desc':
        return b.total - a.total;
      case 'total_asc':
        return a.total - b.total;
      case 'newest':
      default:
        return b.createdAt - a.createdAt;
    }
  });

  return list;
}

export function ordersHaveActiveFilters(query: string, status: OrderStatusFilter): boolean {
  return query.trim() !== '' || status !== 'all';
}
