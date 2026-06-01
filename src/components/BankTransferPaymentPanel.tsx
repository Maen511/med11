import { Button } from '@/components/ui/button';
import { Building2, Mail } from 'lucide-react';
import { getBankTransferConfig, hasBankTransferDetails } from '@/lib/bankTransfer';
import { cn } from '@/lib/utils';

type Lang = 'en' | 'ar';

type Props = {
  language: Lang;
  /** رقم الفاتورة — يُعرض في البريد وفي تعليمات الحوالة */
  invoiceId?: string;
  className?: string;
};

export function BankTransferPaymentPanel({ language, invoiceId, className }: Props) {
  const isAr = language === 'ar';
  const c = getBankTransferConfig();
  const configured = hasBankTransferDetails();

  const rows = [
    { label: isAr ? 'البنك' : 'Bank', value: c.bankName },
    { label: isAr ? 'اسم المستفيد' : 'Beneficiary', value: c.beneficiary },
    { label: 'IBAN', value: c.iban },
    { label: 'SWIFT / BIC', value: c.swift },
    { label: isAr ? 'العملة' : 'Currency', value: c.currency },
  ].filter((r) => r.value);

  const mailSubject =
    invoiceId != null && invoiceId !== ''
      ? isAr
        ? `إيصال تحويل — فاتورة ${invoiceId}`
        : `Bank transfer receipt — invoice ${invoiceId}`
      : isAr
        ? 'إيصال تحويل بنكي'
        : 'Bank transfer receipt';

  const mailHref = (() => {
    if (!c.contactEmail) return null;
    const params = new URLSearchParams();
    params.set('subject', mailSubject);
    if (invoiceId) {
      params.set('body', isAr ? `رقم الفاتورة: ${invoiceId}\n\n` : `Invoice #: ${invoiceId}\n\n`);
    }
    return `mailto:${c.contactEmail}?${params.toString()}`;
  })();

  return (
    <div
      className={cn(
        'rounded-xl border border-sky-600/25 bg-sky-500/10 p-3 text-start text-sm dark:border-sky-500/35 dark:bg-sky-950/30',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-700 dark:text-sky-400" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold text-foreground">
              {isAr ? 'الدفع بالتحويل البنكي' : 'Bank transfer payment'}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {isAr
                ? 'حوّل المبلغ إلى الحساب أدناه. اذكر رقم الفاتورة في تفاصيل الحوالة إن أمكن، ثم أرسل صورة الإيصال إلى البريد المخصص لمعالجة الطلب.'
                : 'Transfer the amount to the account below. Include your invoice number in the transfer reference if possible, then email us a clear receipt so we can confirm your payment.'}
            </p>
          </div>

          {invoiceId ? (
            <p className="rounded-md bg-background/60 px-2 py-1.5 font-mono text-xs text-foreground ring-1 ring-border/60">
              {isAr ? 'رقم الفاتورة:' : 'Invoice #:'} <span className="font-semibold">{invoiceId}</span>
            </p>
          ) : null}

          {configured ? (
            <dl className="space-y-1.5 rounded-lg border border-border/50 bg-background/50 p-3 text-xs">
              {rows.map((r) => (
                <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                  <dt className="shrink-0 font-medium text-muted-foreground">{r.label}</dt>
                  <dd className="min-w-0 break-all font-mono text-foreground sm:text-end">{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {isAr
                ? 'لم تُضبط بيانات الحساب البنكي بعد. أضف في المشروع: VITE_BANK_NAME، VITE_BANK_BENEFICIARY، VITE_BANK_IBAN، واختياري VITE_BANK_SWIFT و VITE_PAYMENT_CONTACT_EMAIL.'
                : 'Bank details are not configured yet. Set VITE_BANK_NAME, VITE_BANK_BENEFICIARY, VITE_BANK_IBAN, and optionally VITE_BANK_SWIFT and VITE_PAYMENT_CONTACT_EMAIL in your env.'}
            </p>
          )}

          {c.contactEmail ? (
            <div className="flex flex-wrap items-center gap-2">
              {mailHref ? (
                <Button size="sm" variant="secondary" className="gap-2" asChild>
                  <a href={mailHref} target="_blank" rel="noopener noreferrer">
                    <Mail className="h-4 w-4" />
                    {isAr ? 'إرسال إيصال التحويل بالبريد' : 'Email transfer receipt'}
                  </a>
                </Button>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {isAr ? 'البريد:' : 'Email:'}{' '}
                <span className="font-mono text-foreground">{c.contactEmail}</span>
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {isAr
                ? 'أضف VITE_PAYMENT_CONTACT_EMAIL لعرض بريد إرسال الإيصالات.'
                : 'Add VITE_PAYMENT_CONTACT_EMAIL to show where customers should send receipts.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
