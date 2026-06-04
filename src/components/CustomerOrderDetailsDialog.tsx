import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import OrderStatusStepper from '@/components/OrderStatusStepper';
import { BankTransferPaymentPanel } from '@/components/BankTransferPaymentPanel';
import { CartProductImage } from '@/components/CartProductImage';
import { SaleModeVariantBadge } from '@/components/ProductSaleModeBadge';
import { getProductById } from '@/lib/products';
import { resolveStoredLineImage } from '@/lib/catalogImages';
import { resolveCartItemName } from '@/lib/productSaleModes';
import {
  getInvoiceDeliveryLocation,
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  normalizeInvoiceStatus,
  paymentMethodLabel,
  type StoredInvoice,
} from '@/lib/invoices';
import { formatDateTime, formatNumber } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: StoredInvoice | null;
  language: 'en' | 'ar';
};

const CustomerOrderDetailsDialog = ({ open, onOpenChange, invoice, language }: Props) => {
  const isRtl = language === 'ar';
  const lang = isRtl ? 'ar' : 'en';
  const currency = isRtl ? 'د.أ' : 'JOD';

  const t = isRtl
    ? {
        title: 'تفاصيل الطلب',
        date: 'التاريخ',
        address: 'عنوان التوصيل',
        payment: 'الدفع',
        products: 'المنتجات',
        subtotal: 'المجموع الفرعي',
        discount: 'الخصم',
        total: 'الإجمالي',
        promo: 'كود الخصم',
        track: 'تتبع الطلب',
        box: 'بوكس',
        unit: 'حبة',
        noAddress: '—',
        close: 'إغلاق',
        viewProduct: 'عرض المنتج',
      }
    : {
        title: 'Order details',
        date: 'Date',
        address: 'Delivery address',
        payment: 'Payment',
        products: 'Items',
        subtotal: 'Subtotal',
        discount: 'Discount',
        total: 'Total',
        promo: 'Promo code',
        track: 'Track order',
        box: 'Box',
        unit: 'Unit',
        noAddress: '—',
        close: 'Close',
        viewProduct: 'View product',
      };

  if (!invoice) return null;

  const status = normalizeInvoiceStatus(invoice.status);
  const location = getInvoiceDeliveryLocation(invoice, lang);
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
          <dl className="space-y-2 rounded-xl border border-border/50 bg-muted/15 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t.date}</dt>
              <dd className="font-medium tabular-nums">
                {formatDateTime(invoice.createdAt, language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-muted-foreground">{t.address}</dt>
              <dd className="min-w-0 text-end leading-relaxed">{location || t.noAddress}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t.payment}</dt>
              <dd>{paymentMethodLabel(invoice.paymentMethod, lang)}</dd>
            </div>
          </dl>

          {invoice.paymentMethod === 'bank_transfer' ? (
            <BankTransferPaymentPanel invoiceId={invoice.id} language={language} />
          ) : null}

          <div className="rounded-xl border border-border/50 bg-muted/15 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.track}
            </p>
            <OrderStatusStepper status={status} language={language} readOnly />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.products}
            </p>
            <ul className="divide-y divide-border/50 rounded-xl border border-border/50">
              {invoice.items.map((it, idx) => {
                const prod = getProductById(it.id);
                const name = prod
                  ? prod.name[language]
                  : resolveCartItemName(
                      typeof it.name === 'object'
                        ? it.name
                        : { en: String(it.name ?? ''), ar: String(it.name ?? '') },
                      language,
                    );
                const image = resolveStoredLineImage(it.id, it.image);
                return (
                  <li key={`${invoice.id}-${idx}`}>
                    <Link
                      to={`/product/${it.id}`}
                      className="flex gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <CartProductImage
                          productId={it.id}
                          image={image}
                          alt={name}
                          allowPlaceholder={false}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-snug">{name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {it.variant ? (
                            <SaleModeVariantBadge
                              variantName={it.variant}
                              language={language}
                              className="me-1 inline-flex"
                            />
                          ) : null}
                          ×{formatNumber(it.qty)} · {formatNumber(it.price)} {currency}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums">
                        {formatNumber(it.qty * it.price)} {currency}
                      </span>
                    </Link>
                  </li>
                );
              })}
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
            <div className="flex justify-between gap-2 border-t border-border/50 pt-2 text-base">
              <dt className="font-semibold">{t.total}</dt>
              <dd className="font-bold tabular-nums text-primary">
                {formatNumber(invoice.total)} {currency}
              </dd>
            </div>
          </dl>

          <Button type="button" variant="secondary" className="w-full" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerOrderDetailsDialog;
