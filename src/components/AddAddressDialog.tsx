import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Gift, MapPin, Phone, Plus, User } from 'lucide-react';
import type { AppUser } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatJordanPhoneDisplay, JORDAN_PHONE_LOCAL_LENGTH, sanitizeJordanLocalDigits } from '@/lib/jordanPhone';
import {
  ADDRESS_COUNTRY_OPTIONS,
  createEmptyAddressFormInput,
  getAddressCountryById,
  saveAddressErrorMessage,
  saveNewCustomerAddress,
  type AddressFormInput,
} from '@/lib/saveCustomerAddress';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ar';
  user: AppUser | null | undefined;
  /** عند الإضافة من الدفع: يُختار العنوان تلقائياً كعنوان التوصيل */
  selectAsDelivery?: boolean;
  onSaved?: (addressId: string) => void;
};

const fieldClass = 'h-10 border-border/70 bg-background';

function FormSection({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4 rounded-xl border border-border/60 bg-muted/15 p-4 sm:p-5', className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function ExtraPhoneRow({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="flex" dir="ltr">
        <span className="inline-flex shrink-0 items-center rounded-s-md border border-e-0 border-border/70 bg-muted/50 px-2.5 font-mono text-xs font-medium text-muted-foreground">
          +962
        </span>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(sanitizeJordanLocalDigits(e.target.value))}
          maxLength={JORDAN_PHONE_LOCAL_LENGTH}
          placeholder="791234567"
          className={cn(fieldClass, 'rounded-s-none font-mono text-sm')}
        />
      </div>
    </div>
  );
}

const AddAddressDialog = ({ open, onOpenChange, language, user, selectAsDelivery = false, onSaved }: Props) => {
  const isRtl = language === 'ar';
  const accountName = (user?.name || '').trim();
  const accountPhone = (user?.phone || '').trim();
  const [form, setForm] = useState<AddressFormInput>(() => createEmptyAddressFormInput('jo', true));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(createEmptyAddressFormInput('jo', true));
      setBusy(false);
    }
  }, [open]);

  const t = {
    title: isRtl ? 'إضافة عنوان توصيل' : 'Add delivery address',
    account: isRtl ? 'بيانات الحساب' : 'Account details',
    accountHint: isRtl ? 'من ملفك — للتواصل عند التوصيل' : 'From your profile — used for delivery contact',
    location: isRtl ? 'موقع التوصيل' : 'Delivery location',
    locationHint: isRtl ? 'الحقول المطلوبة مميزة بـ *' : 'Required fields are marked *',
    extras: isRtl ? 'أرقام بديلة' : 'Backup phone numbers',
    extrasHint: isRtl ? 'اختياري — إن تعذّر الوصول للرقم الأساسي' : 'Optional — if we cannot reach your primary number',
    options: isRtl ? 'خيارات إضافية' : 'More options',
    name: isRtl ? 'الاسم' : 'Name',
    phone: isRtl ? 'الهاتف الأساسي' : 'Primary phone',
    street: isRtl ? 'اسم الشارع' : 'Street',
    building: isRtl ? 'المبنى / الشقة' : 'Building / apt.',
    city: isRtl ? 'المدينة' : 'City',
    landmark: isRtl ? 'أقرب معلم' : 'Landmark',
    instructions: isRtl ? 'تعليمات التوصيل' : 'Delivery notes',
    gift: isRtl ? 'إرسال كهدية' : 'Send as gift',
    recipient: isRtl ? 'اسم المستلم' : 'Recipient name',
    giftNote: isRtl ? 'ملاحظة الهدية' : 'Gift note',
    primary: isRtl ? 'تعيين كعنواني الرئيسي' : 'Set as default address',
    save: isRtl ? 'حفظ واستخدام للطلب' : 'Save & use for order',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    country: isRtl ? 'الدولة' : 'Country',
    streetPh: isRtl ? 'مثال: شارع عمر بن الخطاب' : 'e.g. Omar Bin Al Khattab St',
    buildingPh: isRtl ? 'رقم المبنى، الطابق، الشقة' : 'Building no., floor, apt.',
    landmarkPh: isRtl ? 'مثال: بجانب الصيدلية الكبرى' : 'e.g. Next to main pharmacy',
    instructionsPh: isRtl ? 'تعليمات للسائق (باب، رمز، وقت…)' : 'Notes for driver (door, code, timing…)',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const result = saveNewCustomerAddress(user, form, language, {
      forcePrimary: selectAsDelivery || form.isPrimary,
    });
    setBusy(false);

    if (result.ok === false) {
      toast.error(saveAddressErrorMessage(result.reason, language));
      return;
    }

    toast.success(isRtl ? 'تم حفظ العنوان' : 'Address saved');
    onSaved?.(result.addressId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        animation="reduced"
        className={cn(
          'flex max-h-[min(92vh,820px)] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:rounded-2xl',
          'border-border/60 shadow-2xl',
        )}
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ar' : 'en'}
      >
        <DialogHeader
          className={cn(
            'shrink-0 space-y-0 border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-8',
            isRtl ? 'text-end' : 'text-start',
          )}
        >
          <div
            className={cn(
              'flex w-full items-center gap-3 pe-8',
              isRtl ? 'flex-row justify-end' : 'flex-row',
            )}
          >
            {isRtl ? (
              <>
                <DialogTitle className="text-lg font-semibold leading-tight sm:text-xl">{t.title}</DialogTitle>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
              </>
            ) : (
              <>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <MapPin className="h-5 w-5" aria-hidden />
                </span>
                <DialogTitle className="text-lg font-semibold leading-tight sm:text-xl">{t.title}</DialogTitle>
              </>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6">
            <FormSection title={t.account} description={t.accountHint} icon={User}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.name}</Label>
                  <Input value={accountName} readOnly className={cn(fieldClass, 'bg-muted/40')} aria-readonly />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.phone}</Label>
                  <Input
                    value={accountPhone ? formatJordanPhoneDisplay(accountPhone) : ''}
                    readOnly
                    dir="ltr"
                    className={cn(fieldClass, 'bg-muted/40 font-mono')}
                    aria-readonly
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title={t.location} description={t.locationHint} icon={MapPin}>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.country}</Label>
                  <Select value={form.countryId} onValueChange={(val) => setForm({ ...form, countryId: val, city: '' })}>
                    <SelectTrigger className={fieldClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[200]">
                      {ADDRESS_COUNTRY_OPTIONS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name[language]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs text-muted-foreground">
                      {t.street} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      required
                      value={form.street}
                      onChange={(e) => setForm({ ...form, street: e.target.value })}
                      placeholder={t.streetPh}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t.building}</Label>
                    <Input
                      value={form.building}
                      onChange={(e) => setForm({ ...form, building: e.target.value })}
                      placeholder={t.buildingPh}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {t.city} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={form.city || undefined}
                      onValueChange={(val) => setForm({ ...form, city: val })}
                    >
                      <SelectTrigger className={fieldClass} aria-required>
                        <SelectValue placeholder={isRtl ? 'اختر المدينة' : 'Select city'} />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[200] max-h-64">
                        {getAddressCountryById(form.countryId).cities[language].map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t.landmark}</Label>
                    <Input
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      placeholder={t.landmarkPh}
                      className={fieldClass}
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t.instructions}</Label>
                    <Textarea
                      value={form.instructions}
                      onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                      placeholder={t.instructionsPh}
                      rows={2}
                      className="min-h-[4.5rem] resize-none border-border/70 bg-background text-sm"
                    />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title={t.extras} description={t.extrasHint} icon={Phone}>
              <div className="grid gap-4 sm:grid-cols-2">
                <ExtraPhoneRow
                  id="dlg-extra-1"
                  label={isRtl ? 'رقم إضافي 1' : 'Extra number 1'}
                  value={form.extraPhoneLocal1}
                  onChange={(v) => setForm({ ...form, extraPhoneLocal1: v })}
                />
                <ExtraPhoneRow
                  id="dlg-extra-2"
                  label={isRtl ? 'رقم إضافي 2' : 'Extra number 2'}
                  value={form.extraPhoneLocal2}
                  onChange={(v) => setForm({ ...form, extraPhoneLocal2: v })}
                />
              </div>
            </FormSection>

            <FormSection title={t.options} icon={Gift} className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/80 px-4 py-3">
                <Label htmlFor="dlg-gift" className="cursor-pointer text-sm font-medium">
                  {t.gift}
                </Label>
                <Switch id="dlg-gift" checked={form.isGift} onCheckedChange={(v) => setForm({ ...form, isGift: !!v })} />
              </div>
              {form.isGift ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t.recipient}
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    className={fieldClass}
                  />
                  <Input
                    placeholder={t.giftNote}
                    value={form.giftNote}
                    onChange={(e) => setForm({ ...form, giftNote: e.target.value })}
                    className={cn(fieldClass, 'sm:col-span-2')}
                  />
                </div>
              ) : null}

              {!selectAsDelivery ? (
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-background/80 px-4 py-3">
                  <Label htmlFor="dlg-primary" className="cursor-pointer text-sm font-medium">
                    {t.primary}
                  </Label>
                  <Switch
                    id="dlg-primary"
                    checked={form.isPrimary}
                    onCheckedChange={(v) => setForm({ ...form, isPrimary: !!v })}
                  />
                </div>
              ) : null}
            </FormSection>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-8 sm:py-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              {t.cancel}
            </Button>
            <Button type="submit" className="btn-primary gap-2 sm:min-w-[12rem]" disabled={busy}>
              <Plus className="h-4 w-4" aria-hidden />
              {busy ? '…' : t.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAddressDialog;
