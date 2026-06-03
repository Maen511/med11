import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { JORDAN_CITIES } from '@/lib/storeLocale';
import {
  buildJordanPhone,
  formatJordanPhoneDisplay,
  isValidJordanLocalPhone,
  JORDAN_PHONE_LOCAL_LENGTH,
  sanitizeJordanLocalDigits,
} from '@/lib/jordanPhone';
import {
  CUSTOMER_ADDRESSES_CHANGED,
  readCustomerAddresses,
  readSelectedAddressId,
  writeCustomerAddresses,
  writeSelectedAddressId,
  type CustomerDeliveryAddress,
} from '@/lib/customerAddresses';
import { cn } from '@/lib/utils';

const countryOptions = [
  {
    id: 'jo',
    name: { en: 'Jordan', ar: 'الأردن' },
    cities: JORDAN_CITIES,
  },
] as const;

const getCountryById = (id: string | undefined) => countryOptions.find((c) => c.id === id) || countryOptions[0];

type AddressFormState = {
  countryId: string;
  extraPhoneLocal1: string;
  extraPhoneLocal2: string;
  street: string;
  building: string;
  city: string;
  landmark: string;
  instructions: string;
  isPrimary: boolean;
  isGift: boolean;
  recipientName: string;
  giftNote: string;
};

function createEmptyAddressForm(countryId = 'jo', defaultPrimary = false): AddressFormState {
  return {
    countryId,
    extraPhoneLocal1: '',
    extraPhoneLocal2: '',
    street: '',
    building: '',
    city: '',
    landmark: '',
    instructions: '',
    isPrimary: defaultPrimary,
    isGift: false,
    recipientName: '',
    giftNote: '',
  };
}

function ExtraPhoneField({
  id,
  label,
  value,
  onChange,
  language,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  language: 'en' | 'ar';
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex" dir="ltr">
        <span className="inline-flex shrink-0 items-center rounded-s-md border border-e-0 border-border/70 bg-muted/40 px-3 font-mono text-sm font-medium">
          +962
        </span>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(sanitizeJordanLocalDigits(e.target.value))}
          maxLength={JORDAN_PHONE_LOCAL_LENGTH}
          placeholder="791234567"
          className="rounded-s-none font-mono tracking-wide"
        />
      </div>
      <p className="text-[0.7rem] text-muted-foreground">
        {language === 'ar' ? 'اختياري — 9 أرقام' : 'Optional — 9 digits'}
      </p>
    </div>
  );
}

const Addresses = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRtl = language === 'ar';
  const accountName = (user?.name || '').trim();
  const accountPhone = (user?.phone || '').trim();

  const [addresses, setAddresses] = useState<CustomerDeliveryAddress[]>([]);
  const [form, setForm] = useState<AddressFormState>(() => createEmptyAddressForm('jo', true));
  const [primaryId, setPrimaryId] = useState('');

  const loadAddresses = useCallback(() => {
    const loaded = readCustomerAddresses(user);
    const selected = readSelectedAddressId(user);
    const synced = loaded.map((a) => ({
      ...a,
      isPrimary: selected ? a.id === selected : Boolean(a.isPrimary),
    }));
    setAddresses(synced);
    setPrimaryId(selected);
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    const onChanged = () => loadAddresses();
    window.addEventListener(CUSTOMER_ADDRESSES_CHANGED, onChanged);
    const onStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith('med-addresses:')) return;
      loadAddresses();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CUSTOMER_ADDRESSES_CHANGED, onChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [loadAddresses]);

  const persist = (next: CustomerDeliveryAddress[]): boolean => {
    const ok = writeCustomerAddresses(user, next);
    if (!ok) {
      toast.error(
        isRtl ? 'تعذّر حفظ العناوين. تحقق من مساحة التخزين.' : 'Could not save addresses. Check browser storage.',
      );
      return false;
    }
    setAddresses(next);
    return true;
  };

  const setPrimary = (id: string | null) => {
    const next = addresses.map((a) => ({ ...a, isPrimary: id ? a.id === id : false }));
    if (!persist(next)) return;
    setPrimaryId(id || '');
    writeSelectedAddressId(user, id);
  };

  const collectExtraPhones = (): string[] | null => {
    const built: string[] = [];
    const fields = [
      { digits: sanitizeJordanLocalDigits(form.extraPhoneLocal1), index: 1 },
      { digits: sanitizeJordanLocalDigits(form.extraPhoneLocal2), index: 2 },
    ];

    for (const { digits, index } of fields) {
      if (!digits) continue;
      if (!isValidJordanLocalPhone(digits)) {
        toast.error(
          isRtl
            ? `الرقم الإضافي ${index}: أدخل ${JORDAN_PHONE_LOCAL_LENGTH} أرقام كاملة أو اترك الحقل فارغاً.`
            : `Extra number ${index}: enter all ${JORDAN_PHONE_LOCAL_LENGTH} digits or leave blank.`,
        );
        return null;
      }
      const e164 = buildJordanPhone(digits);
      if (e164 === accountPhone) {
        toast.error(
          isRtl ? 'الرقم الإضافي يطابق رقم حسابك الأساسي.' : 'Extra number matches your account primary number.',
        );
        return null;
      }
      if (built.includes(e164)) {
        toast.error(isRtl ? 'لا تكرر نفس الرقم الإضافي.' : 'Do not repeat the same extra number.');
        return null;
      }
      built.push(e164);
    }
    return built;
  };

  const addAddress = () => {
    if (!user) {
      toast.error(isRtl ? 'سجّل الدخول أولاً.' : 'Please sign in first.');
      return;
    }
    if (!accountName) {
      toast.error(isRtl ? 'أكمل اسمك في الملف الشخصي أولاً.' : 'Complete your name in profile first.');
      return;
    }
    if (!accountPhone) {
      toast.error(isRtl ? 'أضف رقم هاتفك عند إنشاء الحساب أو من الملف الشخصي.' : 'Add your phone on your account.');
      return;
    }

    const extraPhones = collectExtraPhones();
    if (extraPhones === null) return;

    if (!form.street.trim() || !form.city) {
      toast.error(isRtl ? 'يرجى إدخال الشارع والمدينة' : 'Please enter street and city');
      return;
    }

    const label = `${form.building || form.street}${form.city ? `, ${form.city}` : ''}`.trim();
    const details = [form.street, form.building, form.landmark].filter(Boolean).join(' — ');
    const record: CustomerDeliveryAddress = {
      id: `addr-${Date.now().toString(36)}`,
      label,
      city: form.city || undefined,
      details,
      fullName: accountName,
      country: getCountryById(form.countryId).name[language],
      phone: accountPhone,
      extraPhones: extraPhones.length > 0 ? extraPhones : undefined,
      street: form.street,
      building: form.building,
      landmark: form.landmark || undefined,
      instructions: form.instructions || undefined,
      isPrimary: false,
      isGift: form.isGift || undefined,
      recipientName: form.isGift ? form.recipientName || undefined : undefined,
      giftNote: form.isGift ? form.giftNote || undefined : undefined,
    };

    const shouldBePrimary = form.isPrimary || addresses.length === 0;
    const next = [
      { ...record, isPrimary: shouldBePrimary },
      ...addresses.map((a) => ({ ...a, isPrimary: shouldBePrimary ? false : a.isPrimary })),
    ];

    if (!persist(next)) return;

    if (shouldBePrimary) {
      setPrimaryId(record.id);
      writeSelectedAddressId(user, record.id);
    }

    setForm(createEmptyAddressForm(form.countryId, false));
    toast.success(isRtl ? 'تم حفظ العنوان' : 'Address saved');
  };

  const removeAddress = (id: string) => {
    const remaining = addresses.filter((a) => a.id !== id);
    if (primaryId === id) {
      const fallback = remaining[0]?.id ?? null;
      const next = remaining.map((a) => ({ ...a, isPrimary: Boolean(fallback && a.id === fallback) }));
      if (!persist(next)) return;
      setPrimaryId(fallback || '');
      writeSelectedAddressId(user, fallback);
      return;
    }
    persist(remaining);
  };

  return (
    <div className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto w-full pb-8">
        <h1 className="mb-6 text-3xl font-semibold">{isRtl ? 'عناويني' : 'My Addresses'}</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isRtl ? 'إضافة عنوان جديد' : 'Add new address'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{isRtl ? 'البلد/المنطقة' : 'Country/Region'}</Label>
                <Select
                  value={form.countryId}
                  onValueChange={(val) => {
                    setForm({ ...form, countryId: val, city: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRtl ? 'اختر الدولة' : 'Select country'} />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{isRtl ? 'الاسم' : 'Name'}</Label>
                <Input value={accountName} readOnly className="cursor-default bg-muted/50" aria-readonly />
              </div>

              <div>
                <Label>{isRtl ? 'رقم الهاتف الأساسي' : 'Primary phone'}</Label>
                <Input
                  value={accountPhone ? formatJordanPhoneDisplay(accountPhone) : ''}
                  readOnly
                  dir="ltr"
                  className="cursor-default bg-muted/50 font-mono"
                  placeholder={isRtl ? 'لا يوجد رقم في الحساب' : 'No phone on account'}
                  aria-readonly
                />
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/15 p-3">
                <p className="text-sm font-medium">{isRtl ? 'أرقام إضافية (اختياري)' : 'Extra numbers (optional)'}</p>
                <ExtraPhoneField
                  id="extra-phone-1"
                  label={isRtl ? 'رقم إضافي 1' : 'Extra number 1'}
                  value={form.extraPhoneLocal1}
                  onChange={(v) => setForm({ ...form, extraPhoneLocal1: v })}
                  language={language}
                />
                <ExtraPhoneField
                  id="extra-phone-2"
                  label={isRtl ? 'رقم إضافي 2' : 'Extra number 2'}
                  value={form.extraPhoneLocal2}
                  onChange={(v) => setForm({ ...form, extraPhoneLocal2: v })}
                  language={language}
                />
              </div>

              <div>
                <Label>{isRtl ? 'اسم الشارع' : 'Street name'}</Label>
                <Input
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                  placeholder={isRtl ? 'مثال شارع عمر بن الخطاب' : 'e.g., Omar Bin Al Khattab St'}
                />
              </div>
              <div>
                <Label>{isRtl ? 'اسم/رقم المبنى' : 'Building'}</Label>
                <Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
              </div>
              <div>
                <Label>{isRtl ? 'المدينة' : 'City'}</Label>
                <Select value={form.city} onValueChange={(val) => setForm({ ...form, city: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRtl ? 'اختر المدينة' : 'Select city'} />
                  </SelectTrigger>
                  <SelectContent>
                    {getCountryById(form.countryId).cities[language].map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRtl ? 'أقرب معلم' : 'Landmark'}</Label>
                <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
              </div>
              <div>
                <Label>{isRtl ? 'تعليمات التوصيل' : 'Delivery instructions'}</Label>
                <Input value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="gift-switch" className="flex-1 cursor-pointer">
                  {isRtl ? 'إرسال كهدية؟' : 'Send as a gift?'}
                </Label>
                <Switch id="gift-switch" checked={form.isGift} onCheckedChange={(v) => setForm({ ...form, isGift: !!v })} />
              </div>
              {form.isGift && (
                <>
                  <Input
                    placeholder={isRtl ? 'اسم المستلم' : 'Recipient name'}
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  />
                  <Input
                    placeholder={isRtl ? 'ملاحظة الهدية' : 'Gift note'}
                    value={form.giftNote}
                    onChange={(e) => setForm({ ...form, giftNote: e.target.value })}
                  />
                </>
              )}
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="primary-switch" className="flex-1 cursor-pointer">
                  {isRtl ? 'عنوان رئيسي' : 'Default address'}
                </Label>
                <Switch
                  id="primary-switch"
                  checked={form.isPrimary}
                  onCheckedChange={(checked) => setForm({ ...form, isPrimary: checked })}
                />
              </div>
              <Button type="button" className="btn-primary w-full" onClick={addAddress}>
                {isRtl ? 'إضافة عنوان' : 'Add Address'}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{isRtl ? 'عناويني' : 'My Addresses'}</CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">{isRtl ? 'لا توجد عناوين بعد.' : 'No addresses yet.'}</p>
              ) : (
                <ul className="space-y-3">
                  {addresses.map((a) => (
                    <li key={a.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 font-medium">
                          <span>
                            {a.label}
                            {a.city ? ` • ${a.city}` : ''}
                          </span>
                          {primaryId === a.id && (
                            <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
                              {isRtl ? 'الرئيسي' : 'Primary'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{a.details}</p>
                        {a.phone ? (
                          <p dir="ltr" className={cn('mt-1 font-mono text-xs text-muted-foreground', isRtl && 'text-end')}>
                            {formatJordanPhoneDisplay(a.phone)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Switch
                          checked={primaryId === a.id}
                          onCheckedChange={(checked) => {
                            if (checked) setPrimary(a.id);
                            else if (primaryId === a.id) setPrimary(null);
                          }}
                        />
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeAddress(a.id)}>
                          {isRtl ? 'حذف' : 'Delete'}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Addresses;
