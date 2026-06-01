import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { currencySymbol, currencyTitle } from '@/lib/storeLocale';
import { cn } from '@/lib/utils';

type Props = { className?: string; title?: string; language?: 'en' | 'ar' };

/** Compact JOD display (JD / د.أ); works on any header/background via inherited text color. */
export const CurrencyIcon: React.FC<Props> = ({ className, title, language: languageProp }) => {
  const { language: ctxLang } = useLanguage();
  const language = languageProp ?? ctxLang;
  const sym = currencySymbol(language);
  const ttl = title ?? currencyTitle(language);

  return (
    <span
      className={cn(
        'inline-block align-[-1px] font-semibold tabular-nums tracking-tight text-[0.88em] text-foreground/90',
        className
      )}
      title={ttl}
      aria-label={ttl}
    >
      {sym}
    </span>
  );
};

export default CurrencyIcon;
