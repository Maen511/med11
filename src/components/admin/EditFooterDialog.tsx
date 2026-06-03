import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { LayoutTemplate, Loader2, RotateCcw, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  DEFAULT_FOOTER_CONTENT,
  FOOTER_CONTENT_CHANGED,
  getFooterContent,
  setFooterContent,
} from '@/lib/footerContent';
import {
  footerContentFromArabicDraft,
  footerContentToArabicDraft,
  type FooterArabicDraft,
} from '@/lib/footerTranslation';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    <section
      className={cn(
        'space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4 text-start',
        className,
      )}
    >
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function ArabicField({
  id,
  label,
  value,
  onChange,
  multiline,
  dirLtr,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  dirLtr?: boolean;
}) {
  const InputCmp = multiline ? Textarea : Input;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <InputCmp
        id={id}
        className={cn('min-h-9 text-sm', multiline && 'min-h-[64px] resize-y', dirLtr && 'text-left')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dirLtr ? 'ltr' : 'rtl'}
      />
    </div>
  );
}

const EditFooterDialog = ({ open, onOpenChange, language }: Props) => {
  const isRtl = language === 'ar';
  const [draft, setDraft] = useState<FooterArabicDraft>(() => footerContentToArabicDraft(getFooterContent()));
  const [saveBusy, setSaveBusy] = useState(false);

  const reload = useCallback(() => {
    setDraft(footerContentToArabicDraft(getFooterContent()));
  }, []);

  useEffect(() => {
    if (!open) return;
    reload();
    const onChange = () => reload();
    window.addEventListener(FOOTER_CONTENT_CHANGED, onChange);
    return () => window.removeEventListener(FOOTER_CONTENT_CHANGED, onChange);
  }, [open, reload]);

  const t =
    language === 'ar'
      ? {
          title: 'تعديل الفوتر',
          desc: 'اكتب بالعربية فقط — النسخة الإنجليزية في الموقع تُحدَّث تلقائياً.',
          contact: 'التواصل',
          sectionTitle: 'عنوان القسم',
          email: 'البريد الإلكتروني',
          phone: 'رقم الهاتف',
          support: 'الدعم',
          supportLine1: 'النص الأول',
          supportLine2: 'النص الثاني (اختياري)',
          address: 'العنوان',
          addressLine1: 'السطر الأول',
          addressLine2: 'السطر الثاني',
          hours: 'ساعات العمل',
          hoursTime: 'أوقات الدوام',
          hoursDays: 'أيام العمل',
          save: 'حفظ',
          saving: 'جارٍ الحفظ…',
          cancel: 'إلغاء',
          reset: 'استعادة الافتراضي',
          saved: 'تم حفظ الفوتر',
          resetDone: 'تمت استعادة القيم الافتراضية',
          emailRequired: 'أدخل البريد الإلكتروني',
        }
      : {
          title: 'Edit footer',
          desc: 'Arabic fields only — English on the storefront is generated automatically.',
          contact: 'Contact',
          sectionTitle: 'Section heading',
          email: 'Email',
          phone: 'Phone',
          support: 'Support',
          supportLine1: 'Line 1',
          supportLine2: 'Line 2 (optional)',
          address: 'Address',
          addressLine1: 'Line 1',
          addressLine2: 'Line 2',
          hours: 'Hours',
          hoursTime: 'Opening times',
          hoursDays: 'Working days',
          save: 'Save',
          saving: 'Saving…',
          cancel: 'Cancel',
          reset: 'Restore defaults',
          saved: 'Footer saved',
          resetDone: 'Defaults restored',
          emailRequired: 'Enter an email address',
        };

  const persistDraft = (next: FooterArabicDraft) => {
    const copyright = getFooterContent().copyright;
    setFooterContent({
      ...footerContentFromArabicDraft(next),
      copyright,
    });
  };

  const save = async () => {
    const email = draft.email.trim();
    if (!email) {
      toast.error(t.emailRequired);
      return;
    }
    setSaveBusy(true);
    try {
      persistDraft(draft);
      toast.success(t.saved);
      reload();
      onOpenChange(false);
    } finally {
      setSaveBusy(false);
    }
  };

  const reset = () => {
    const copyright = getFooterContent().copyright;
    const base = { ...DEFAULT_FOOTER_CONTENT, copyright };
    const arDraft = footerContentToArabicDraft(base);
    setDraft(arDraft);
    setFooterContent(base);
    toast.message(t.resetDone);
  };

  const patch = (patch: Partial<FooterArabicDraft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(52rem,96vw)] gap-0 overflow-visible p-0 sm:max-w-4xl"
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ar' : 'en'}
      >
        <DialogHeader className="space-y-1 border-b border-border/60 px-5 py-4 text-start sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-start">
            <LayoutTemplate className="h-5 w-5 text-primary" aria-hidden />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-start">{t.desc}</DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <FormSection title={t.contact}>
              <ArabicField
                label={t.sectionTitle}
                value={draft.contactTitle}
                onChange={(contactTitle) => patch({ contactTitle })}
              />
              <ArabicField
                id="edit-footer-email"
                label={t.email}
                value={draft.email}
                onChange={(email) => patch({ email })}
                dirLtr
              />
              <ArabicField
                id="edit-footer-phone"
                label={t.phone}
                value={draft.phoneDisplay}
                onChange={(phoneDisplay) => patch({ phoneDisplay })}
                dirLtr
              />
            </FormSection>

            <FormSection title={t.support}>
              <ArabicField
                label={t.sectionTitle}
                value={draft.supportTitle}
                onChange={(supportTitle) => patch({ supportTitle })}
              />
              <ArabicField
                label={t.supportLine1}
                value={draft.supportLine1}
                onChange={(supportLine1) => patch({ supportLine1 })}
              />
              <ArabicField
                label={t.supportLine2}
                value={draft.supportLine2}
                onChange={(supportLine2) => patch({ supportLine2 })}
              />
            </FormSection>

            <FormSection title={t.address}>
              <ArabicField
                label={t.sectionTitle}
                value={draft.addressTitle}
                onChange={(addressTitle) => patch({ addressTitle })}
              />
              <ArabicField
                label={t.addressLine1}
                value={draft.addressLine1}
                onChange={(addressLine1) => patch({ addressLine1 })}
              />
              <ArabicField
                label={t.addressLine2}
                value={draft.addressLine2}
                onChange={(addressLine2) => patch({ addressLine2 })}
              />
            </FormSection>

            <FormSection title={t.hours}>
              <ArabicField
                label={t.sectionTitle}
                value={draft.hoursTitle}
                onChange={(hoursTitle) => patch({ hoursTitle })}
              />
              <ArabicField
                label={t.hoursTime}
                value={draft.hoursTime}
                onChange={(hoursTime) => patch({ hoursTime })}
              />
              <ArabicField
                label={t.hoursDays}
                value={draft.hoursDays}
                onChange={(hoursDays) => patch({ hoursDays })}
              />
            </FormSection>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 bg-muted/15 px-5 py-4 sm:justify-between sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="gap-2 sm:order-1"
            onClick={reset}
            disabled={saveBusy}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t.reset}
          </Button>
          <div className="flex flex-wrap justify-end gap-2 sm:order-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saveBusy}>
              {t.cancel}
            </Button>
            <Button type="button" className="gap-2" onClick={() => void save()} disabled={saveBusy}>
              {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saveBusy ? t.saving : t.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditFooterDialog;
