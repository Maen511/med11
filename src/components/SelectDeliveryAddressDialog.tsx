import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Plus } from 'lucide-react';
import type { AppUser } from '@/contexts/AuthContext';
import {
  CUSTOMER_ADDRESSES_CHANGED,
  readCustomerAddresses,
  writeSelectedAddressId,
  type CustomerDeliveryAddress,
} from '@/lib/customerAddresses';
import CheckoutScrollPanel from '@/components/checkout/CheckoutScrollPanel';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ar';
  user: AppUser | null | undefined;
  selectedId: string;
  onSelected: (id: string) => void;
  onAddNew: () => void;
  /** scroll: panel moves with checkout page scroll (not fixed viewport) */
  layout?: 'modal' | 'scroll';
};

const SelectDeliveryAddressDialog = ({
  open,
  onOpenChange,
  language,
  user,
  selectedId,
  onSelected,
  onAddNew,
  layout = 'modal',
}: Props) => {
  const isRtl = language === 'ar';
  const [addresses, setAddresses] = useState<CustomerDeliveryAddress[]>([]);
  const [draftId, setDraftId] = useState(selectedId);

  const refresh = () => setAddresses(readCustomerAddresses(user));

  useEffect(() => {
    if (!open) return;
    refresh();
    setDraftId(selectedId || readCustomerAddresses(user)[0]?.id || '');
  }, [open, selectedId, user]);

  useEffect(() => {
    const onChanged = () => refresh();
    window.addEventListener(CUSTOMER_ADDRESSES_CHANGED, onChanged);
    return () => window.removeEventListener(CUSTOMER_ADDRESSES_CHANGED, onChanged);
  }, [user]);

  const t =
    language === 'ar'
      ? {
          title: 'عنوان التوصيل',
          subtitle: 'اختر عنواناً لهذا الطلب أو أضف عنواناً جديداً.',
          confirm: 'استخدام هذا العنوان',
          add: 'إضافة عنوان جديد',
          manage: 'إدارة العناوين',
          empty: 'لا توجد عناوين محفوظة بعد.',
          selected: 'محدّد للطلب',
        }
      : {
          title: 'Delivery address',
          subtitle: 'Choose an address for this order or add a new one.',
          confirm: 'Use this address',
          add: 'Add new address',
          manage: 'Manage addresses',
          empty: 'No saved addresses yet.',
          selected: 'Selected for order',
        };

  const applySelection = () => {
    if (!draftId) return;
    writeSelectedAddressId(user, draftId);
    onSelected(draftId);
    onOpenChange(false);
  };

  const handleAddNew = () => {
    onOpenChange(false);
    onAddNew();
  };

  const body = (
    <>
      <div className="space-y-1 border-b border-border/60 px-5 pe-12 py-4 text-start sm:text-start">
        <h2 id="checkout-addr-title" className="flex items-center gap-2 text-lg font-semibold leading-none">
          <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="space-y-4 px-5 py-4">
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <RadioGroup
            value={draftId}
            onValueChange={setDraftId}
            className="max-h-[min(50vh,320px)] space-y-2 overflow-y-auto pe-1"
          >
            {addresses.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <RadioGroupItem value={a.id} id={`checkout-addr-${a.id}`} className="mt-1" />
                <Label
                  htmlFor={`checkout-addr-${a.id}`}
                  className={cn(
                    'flex-1 cursor-pointer rounded-lg border p-3 text-start transition-colors',
                    draftId === a.id ? 'border-primary/50 bg-primary/5' : 'border-border/60 hover:bg-muted/40',
                  )}
                >
                  <span className="block text-sm font-medium">
                    {a.label}
                    {a.city ? ` • ${a.city}` : ''}
                  </span>
                  {a.details ? (
                    <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{a.details}</span>
                  ) : null}
                  {selectedId === a.id ? (
                    <span className="mt-1.5 inline-block text-[0.65rem] font-medium uppercase tracking-wide text-primary">
                      {t.selected}
                    </span>
                  ) : null}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
          <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            {t.add}
          </Button>
          <Button type="button" className="btn-primary w-full" disabled={!draftId} onClick={applySelection}>
            {t.confirm}
          </Button>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" asChild>
            <Link to="/addresses" onClick={() => onOpenChange(false)}>
              {t.manage}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );

  if (layout === 'scroll') {
    return (
      <CheckoutScrollPanel open={open} onOpenChange={onOpenChange} labelledBy="checkout-addr-title">
        {body}
      </CheckoutScrollPanel>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-start">{t.subtitle}</DialogDescription>
        </DialogHeader>
        <div className="px-1">
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            <RadioGroup
              value={draftId}
              onValueChange={setDraftId}
              className="max-h-[min(50vh,320px)] space-y-2 overflow-y-auto pe-1"
            >
              {addresses.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <RadioGroupItem value={a.id} id={`checkout-addr-modal-${a.id}`} className="mt-1" />
                  <Label
                    htmlFor={`checkout-addr-modal-${a.id}`}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg border p-3 text-start transition-colors',
                      draftId === a.id ? 'border-primary/50 bg-primary/5' : 'border-border/60 hover:bg-muted/40',
                    )}
                  >
                    <span className="block text-sm font-medium">
                      {a.label}
                      {a.city ? ` • ${a.city}` : ''}
                    </span>
                    {a.details ? (
                      <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{a.details}</span>
                    ) : null}
                    {selectedId === a.id ? (
                      <span className="mt-1.5 inline-block text-[0.65rem] font-medium uppercase tracking-wide text-primary">
                        {t.selected}
                      </span>
                    ) : null}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          <div className="flex flex-col gap-2 border-t pt-4">
            <Button type="button" variant="outline" className="w-full justify-start gap-2" onClick={handleAddNew}>
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {t.add}
            </Button>
            <Button type="button" className="btn-primary w-full" disabled={!draftId} onClick={applySelection}>
              {t.confirm}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-muted-foreground" asChild>
              <Link to="/addresses" onClick={() => onOpenChange(false)}>
                {t.manage}
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectDeliveryAddressDialog;
