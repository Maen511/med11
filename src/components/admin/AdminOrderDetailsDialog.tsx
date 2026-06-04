import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import {
  ADMIN_ORDER_STATUS_ACTIONS,
  adminOrdersArchiveRemainingMs,
  formatAdminOrdersArchiveRemaining,
  getInvoiceCustomerDisplayName,
  getInvoiceCustomerPhones,
  getInvoiceDeliveryLocation,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  paymentMethodLabel,
  type OrderTrackStatus,
  type StoredInvoice,
} from '@/lib/invoices';
import { formatDateTime, formatNumber } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: StoredInvoice | null;
  language: 'en' | 'ar';
  now?: number;
  onStatusChange?: (invoiceId: string, status: OrderTrackStatus) => void;
};

const DetailRow = ({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={cn('grid gap-0.5 sm:grid-cols-[7.5rem_1fr] sm:gap-3', className)}>
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className="min-w-0 text-sm text-foreground">{children}</dd>
  </div>
);

const AdminOrderDetailsDialog = ({
  open,
  onOpenChange,
  invoice,
  language,
  now = Date.now(),
  onStatusChange,
}: Props) => {
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';
  const currency = isRtl ? 'د.أ' : 'JOD';

  const t = isRtl
    ? {
        title: 'تفاصيل الطلب',
        ref: 'رقم الطلب',
        date: 'تاريخ الطلب',
        status: 'الحالة',
        customer: 'العميل',
        username: 'اسم المستخدم',
        email: 'البريد',
        phones: 'الهاتف',
        address: 'عنوان التوصيل',
        payment: 'طريقة الدفع',
        products: 'المنتجات',
        subtotal: 'المجموع الفرعي',
        discount: 'الخصم',
        total: 'الإجمالي',
        promo: 'كود الخصم',
        influencer: 'المؤثر',
        track: 'مسار الطلب',
        trackHint: 'اضغط على أي مرحلة في المسار لتصحيح حالة الطلب.',
        archiveIn: 'يُزال من القائمة خلال',
        box: 'بوكس',
        unit: 'حبة',
        noPhone: '—',
        noAddress: '—',
        close: 'إغلاق',
      }
    : {
        title: 'Order details',
        ref: 'Order #',
        date: 'Order date',
        status: 'Status',
        customer: 'Customer',
        username: 'Username',
        email: 'Email',
        phones: 'Phone',
        address: 'Delivery address',
        payment: 'Payment',
        products: 'Items',
        subtotal: 'Subtotal',
        discount: 'Discount',
        total: 'Total',
        promo: 'Promo code',
        influencer: 'Influencer',
        track: 'Order progress',
        trackHint: 'Tap any step to update or correct the order status.',
        archiveIn: 'Leaves list in',
        box: 'Box',
        unit: 'Unit',
        noPhone: '—',
        noAddress: '—',
        close: 'Close',
      };

  if (!invoice) return null;

  const status = normalizeInvoiceStatus(invoice.status);
  const customerName = getInvoiceCustomerDisplayName(invoice, lang);
  const phones = getInvoiceCustomerPhones(invoice);
  const location = getInvoiceDeliveryLocation(invoice, lang);
  const archiveRemaining = adminOrdersArchiveRemainingMs(invoice, now);
  const hasDiscount =
    (invoice.discountAmount != null && invoice.discountAmount > 0) || Boolean(invoice.discountCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,720px)] max-w-lg overflow-y-auto sm:max-w-xl"
        dir={isRtl ? 'rtl' : 'ltr'}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2 text-start sm:text-start">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg">{t.title}</DialogTitle>
            <Badge
              variant="secondary"
              className={cn('font-normal', invoiceStatusBadgeClass(status))}
            >
              {invoiceStatusLabel(status, lang)}
            </Badge>
          </div>
          <p className="font-mono text-sm text-muted-foreground" dir="ltr">
            #{invoice.id}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          <dl className="space-y-3 rounded-xl border border-border/50 bg-muted/15 p-4">
            <DetailRow label={t.date}>
              {formatDateTime(invoice.createdAt, language, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </DetailRow>
            <DetailRow label={t.customer}>{customerName}</DetailRow>
            {invoice.customerUsername ? (
              <DetailRow label={t.username}>
                <span dir="ltr">@{invoice.customerUsername}</span>
              </DetailRow>
            ) : null}
            {invoice.customerEmail ? (
              <DetailRow label={t.email}>
                <span dir="ltr" className="break-all">
                  {invoice.customerEmail}
                </span>
              </DetailRow>
            ) : null}
            <DetailRow label={t.phones}>
              {phones.length > 0 ? (
                <ul className="space-y-0.5">
                  {phones.map((phone) => (
                    <li key={phone}>
                      <bdi dir="ltr" className="inline-block font-medium tabular-nums">
                        {phone}
                      </bdi>
                    </li>
                  ))}
                </ul>
              ) : (
                t.noPhone
              )}
            </DetailRow>
            <DetailRow label={t.address}>
              {location || t.noAddress}
            </DetailRow>
            <DetailRow label={t.payment}>
              {paymentMethodLabel(invoice.paymentMethod, lang)}
            </DetailRow>
          </dl>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.products}
            </p>
            <ul className="divide-y divide-border/50 rounded-xl border border-border/50">
              {invoice.items.map((it, idx) => (
                <li
                  key={`${invoice.id}-${idx}`}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.variant
                        ? it.variant === 'box'
                          ? t.box
                          : t.unit
                        : null}
                      {it.variant ? ' · ' : ''}×{formatNumber(it.qty)} ·{' '}
                      {formatNumber(it.price)} {currency}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatNumber(it.qty * it.price)} {currency}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-4 text-sm">
            {invoice.subtotal != null ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.subtotal}</dt>
                <dd className="font-medium tabular-nums">
                  {formatNumber(invoice.subtotal)} {currency}
                </dd>
              </div>
            ) : null}
            {hasDiscount ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.discount}</dt>
                <dd className="font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                  {invoice.discountAmount != null && invoice.discountAmount > 0
                    ? `−${formatNumber(invoice.discountAmount)} ${currency}`
                    : '—'}
                </dd>
              </div>
            ) : null}
            {invoice.discountCode ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.promo}</dt>
                <dd className="font-mono text-xs" dir="ltr">
                  {invoice.discountCode}
                </dd>
              </div>
            ) : null}
            {invoice.influencerName ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t.influencer}</dt>
                <dd>{invoice.influencerName}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 border-t border-border/50 pt-2 text-base">
              <dt className="font-semibold">{t.total}</dt>
              <dd className="font-bold tabular-nums text-primary">
                {formatNumber(invoice.total)} {currency}
              </dd>
            </div>
          </dl>

          <div className="space-y-3 rounded-xl border border-border/50 bg-muted/15 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.track}
            </p>
            <p className="text-xs text-muted-foreground">{t.trackHint}</p>
            <OrderStatusStepper
              status={status}
              language={language}
              readOnly={!onStatusChange}
              clickableSteps={onStatusChange ? ADMIN_ORDER_STATUS_ACTIONS : undefined}
              onStatusChange={
                onStatusChange ? (next) => onStatusChange(invoice.id, next) : undefined
              }
            />
            {archiveRemaining != null ? (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t.archiveIn} {formatAdminOrdersArchiveRemaining(archiveRemaining, lang)}
              </p>
            ) : null}
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrderDetailsDialog;
