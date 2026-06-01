import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { LayoutTemplate, Loader2, RotateCcw, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  DEFAULT_FOOTER_CONTENT,
  FOOTER_CONTENT_CHANGED,
  getFooterContent,
  phoneDisplayToTel,
  setFooterContent,
  type FooterContent,
  type FooterLocaleText,
} from '@/lib/footerContent';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
};

function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('space-y-4 rounded-xl border border-border/60 bg-muted/15 p-4', className)}>
      <h3 className="text-sm font-semibold text-foreground text-start">{title}</h3>
      {children}
    </section>
  );
}

function LocalePairField({
  label,
  value,
  onChange,
  multiline,
  dirLtr,
}: {
  label: string;
  value: FooterLocaleText;
  onChange: (next: FooterLocaleText) => void;
  multiline?: boolean;
  dirLtr?: boolean;
}) {
  const InputCmp = multiline ? Textarea : Input;
  return (
    <div className="space-y-2 text-start">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">AR</span>
          <InputCmp
            className={cn('min-h-10', multiline && 'min-h-[72px] resize-y')}
            value={value.ar}
            onChange={(e) => onChange({ ...value, ar: e.target.value })}
            dir="rtl"
          />
        </div>
        <div className="space-y-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">EN</span>
          <InputCmp
            className={cn('min-h-10', multiline && 'min-h-[72px] resize-y')}
            value={value.en}
            onChange={(e) => onChange({ ...value, en: e.target.value })}
            dir={dirLtr ? 'ltr' : undefined}
          />
        </div>
      </div>
    </div>
  );
}

const AdminFooterPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const [draft, setDraft] = useState<FooterContent>(() => getFooterContent());
  const [saveBusy, setSaveBusy] = useState(false);

  const reload = useCallback(() => {
    setDraft(getFooterContent());
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(FOOTER_CONTENT_CHANGED, onChange);
    return () => window.removeEventListener(FOOTER_CONTENT_CHANGED, onChange);
  }, [reload]);

  const t =
    language === 'ar'
      ? {
          title: 'الفوتر',
          desc: 'عدّل معلومات أسفل كل صفحات المتجر (تواصل، دعم، عنوان، ساعات العمل).',
          contact: 'التواصل',
          email: 'البريد الإلكتروني',
          phone: 'رقم الهاتف (للعرض)',
          support: 'الدعم',
          supportLine1: 'السطر الأول',
          supportLine2: 'السطر الثاني (اختياري)',
          address: 'العنوان',
          addressLine1: 'الشارع / المبنى',
          addressLine2: 'المدينة والبلد',
          hours: 'ساعات العمل',
          hoursTime: 'أوقات الدوام',
          hoursDays: 'أيام العمل',
          copyright: 'حقوق النشر',
          save: 'حفظ الفوتر',
          saving: 'جارٍ الحفظ…',
          reset: 'استعادة الافتراضي',
          saved: 'تم حفظ الفوتر — سيظهر في الموقع فوراً',
          resetDone: 'تمت استعادة القيم الافتراضية',
          emailRequired: 'أدخل البريد الإلكتروني',
          previewHint: 'بعد الحفظ، مرّر على أي صفحة في المتجر وانزل للأسفل لمعاينة الفوتر.',
        }
      : {
          title: 'Site footer',
          desc: 'Edit the footer shown at the bottom of every storefront page.',
          contact: 'Contact',
          email: 'Email',
          phone: 'Phone (display)',
          support: 'Support',
          supportLine1: 'Line 1',
          supportLine2: 'Line 2 (optional)',
          address: 'Address',
          addressLine1: 'Street / building',
          addressLine2: 'City & country',
          hours: 'Opening hours',
          hoursTime: 'Hours',
          hoursDays: 'Days',
          copyright: 'Copyright',
          save: 'Save footer',
          saving: 'Saving…',
          reset: 'Restore defaults',
          saved: 'Footer saved — visible on the site immediately',
          resetDone: 'Default footer restored',
          emailRequired: 'Enter an email address',
          previewHint: 'After saving, open any store page and scroll down to preview the footer.',
        };

  const save = async () => {
    const email = draft.contact.email.trim();
    if (!email) {
      toast.error(t.emailRequired);
      return;
    }
    setSaveBusy(true);
    try {
      const phoneDisplay = draft.contact.phoneDisplay.trim();
      setFooterContent({
        ...draft,
        contact: {
          ...draft.contact,
          email,
          phoneDisplay,
          phoneTel: phoneDisplayToTel(phoneDisplay),
        },
      });
      toast.success(t.saved);
      reload();
    } finally {
      setSaveBusy(false);
    }
  };

  const reset = () => {
    const defaults = DEFAULT_FOOTER_CONTENT;
    setDraft(defaults);
    setFooterContent(defaults);
    toast.message(t.resetDone);
  };

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <p className="text-sm text-muted-foreground text-start">{t.previewHint}</p>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-start">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            {t.title}
          </CardTitle>
          <CardDescription className="text-start">{t.desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormSection title={t.contact}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 text-start sm:col-span-2">
                <Label htmlFor="footer-email">{t.email}</Label>
                <Input
                  id="footer-email"
                  type="email"
                  dir="ltr"
                  className="text-left"
                  value={draft.contact.email}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      contact: { ...d.contact, email: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5 text-start sm:col-span-2">
                <Label htmlFor="footer-phone">{t.phone}</Label>
                <Input
                  id="footer-phone"
                  dir="ltr"
                  className="text-left"
                  value={draft.contact.phoneDisplay}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      contact: { ...d.contact, phoneDisplay: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </FormSection>

          <FormSection title={t.support}>
            <LocalePairField
              label={t.supportLine1}
              value={draft.support.line1}
              onChange={(line1) => setDraft((d) => ({ ...d, support: { ...d.support, line1 } }))}
            />
            <LocalePairField
              label={t.supportLine2}
              value={draft.support.line2}
              onChange={(line2) => setDraft((d) => ({ ...d, support: { ...d.support, line2 } }))}
            />
          </FormSection>

          <FormSection title={t.address}>
            <LocalePairField
              label={t.addressLine1}
              value={draft.address.line1}
              onChange={(line1) => setDraft((d) => ({ ...d, address: { ...d.address, line1 } }))}
            />
            <LocalePairField
              label={t.addressLine2}
              value={draft.address.line2}
              onChange={(line2) => setDraft((d) => ({ ...d, address: { ...d.address, line2 } }))}
            />
          </FormSection>

          <FormSection title={t.hours}>
            <LocalePairField
              label={t.hoursTime}
              value={draft.hours.time}
              onChange={(time) => setDraft((d) => ({ ...d, hours: { ...d.hours, time } }))}
            />
            <LocalePairField
              label={t.hoursDays}
              value={draft.hours.days}
              onChange={(days) => setDraft((d) => ({ ...d, hours: { ...d.hours, days } }))}
            />
          </FormSection>

          <FormSection title={t.copyright}>
            <LocalePairField
              label={t.copyright}
              value={draft.copyright}
              onChange={(copyright) => setDraft((d) => ({ ...d, copyright }))}
              multiline
            />
          </FormSection>

          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button type="button" className="gap-2" onClick={() => void save()} disabled={saveBusy}>
              {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saveBusy ? t.saving : t.save}
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={reset} disabled={saveBusy}>
              <RotateCcw className="h-4 w-4" />
              {t.reset}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFooterPanel;
