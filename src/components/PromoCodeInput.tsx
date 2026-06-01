import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  formatCodeDiscountLabel,
  formatInfluencerCodeSectionLabel,
  influencerCodeErrorMessage,
  tryApplyInfluencerCode,
  type AppliedInfluencerCode,
  type PromoCartLine,
} from '@/lib/influencerCodes';

type Props = {
  language: 'en' | 'ar';
  cartLines: PromoCartLine[];
  applied: AppliedInfluencerCode | null;
  onApplied: (value: AppliedInfluencerCode | null) => void;
  sectionTitleById?: Map<string, { en: string; ar: string }>;
  compact?: boolean;
};

const PromoCodeInput = ({ language, cartLines, applied, onApplied, sectionTitleById, compact }: Props) => {
  const [input, setInput] = useState(applied?.code.code ?? '');
  const [error, setError] = useState<string | null>(null);

  const t =
    language === 'ar'
      ? {
          label: 'كود الخصم',
          placeholder: 'أدخل الكود',
          apply: 'تطبيق',
          remove: 'إزالة',
          applied: 'تم تطبيق الخصم',
          sectionNote: 'يُطبَّق على منتجات القسم المحدد فقط',
        }
      : {
          label: 'Promo code',
          placeholder: 'Enter code',
          apply: 'Apply',
          remove: 'Remove',
          applied: 'Discount applied',
          sectionNote: 'Applies to eligible section items only',
        };

  const handleApply = () => {
    const result = tryApplyInfluencerCode(input, cartLines);
    if (result.ok === false) {
      setError(influencerCodeErrorMessage(result.error, language));
      onApplied(null);
      return;
    }
    setError(null);
    onApplied(result.applied);
  };

  const handleRemove = () => {
    setInput('');
    setError(null);
    onApplied(null);
  };

  if (applied) {
    return (
      <div
        className={
          compact
            ? 'rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm'
            : 'rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2'
        }
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 text-start">
            <p className="font-medium text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
              <Tag className="h-4 w-4 shrink-0" />
              {t.applied}
            </p>
            <p className="mt-1 font-mono text-sm" dir="ltr">
              {applied.code.code}
            </p>
            <p className="text-xs text-muted-foreground">
              {applied.code.influencerName} · {formatCodeDiscountLabel(applied.code, language)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatInfluencerCodeSectionLabel(
                applied.code,
                language,
                applied.code.sectionId
                  ? sectionTitleById?.get(applied.code.sectionId) ?? null
                  : null,
              )}
              {applied.code.sectionScope === 'section' && applied.eligibleSubtotal < applied.subtotal
                ? ` · ${t.sectionNote}`
                : ''}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={handleRemove}>
            <X className="h-4 w-4" />
            <span className="sr-only">{t.remove}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <label className="text-sm font-medium text-start block">{t.label}</label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder={t.placeholder}
          className="font-mono uppercase"
          dir="ltr"
        />
        <Button type="button" variant="secondary" onClick={handleApply} className="shrink-0">
          {t.apply}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive text-start">{error}</p> : null}
    </div>
  );
};

export default PromoCodeInput;
