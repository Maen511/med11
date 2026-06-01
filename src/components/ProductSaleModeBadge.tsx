import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  canSellByUnit,
  formatDualSaleHint,
  getBoxPrice,
  getUnitPrice,
  normalizeCartVariant,
  resolveCartItemName,
  saleModeLabel,
  saleModePurchaseLabel,
  type LocalizedName,
  type ProductSaleInfo,
  type SaleMode,
} from '@/lib/productSaleModes';

type ProductBadgeProps = {
  product: ProductSaleInfo;
  language: 'en' | 'ar';
  variant?: 'overlay' | 'inline';
  className?: string;
};

/** On catalog cards: shows بوكس / حبة when both sale types are available. */
export function ProductSaleModeBadge({ product, language, variant = 'overlay', className }: ProductBadgeProps) {
  const isRtl = language === 'ar';
  const dual = canSellByUnit(product);

  if (variant === 'overlay') {
    if (!dual) return null;
    return (
      <div
        className={cn(
          'absolute bottom-2 start-2 end-2 z-10 rounded-lg border border-white/20 bg-black/65 px-2 py-1.5 text-center text-[10px] font-medium leading-tight text-white shadow-md backdrop-blur-sm',
          className,
        )}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <span className="block">{isRtl ? 'بالبوكس أو بالحبة' : 'Box or unit'}</span>
        <span className="mt-0.5 block opacity-90">{formatDualSaleHint(product, language)}</span>
      </div>
    );
  }

  return (
    <Badge variant="secondary" className={cn('text-[10px] font-normal', className)}>
      {dual ? formatDualSaleHint(product, language) : isRtl ? 'بالبوكس' : 'By box'}
    </Badge>
  );
}

type VariantBadgeProps = {
  variantName?: string;
  language: 'en' | 'ar';
  className?: string;
};

/** Checkout / cart line: بالبوكس or بالحبة */
export function SaleModeVariantBadge({ variantName, language, className }: VariantBadgeProps) {
  const mode = normalizeCartVariant(variantName);
  const isRtl = language === 'ar';
  return (
    <Badge
      variant="outline"
      className={cn(
        'max-w-full border-primary/35 bg-primary/10 text-[11px] font-semibold leading-tight text-primary',
        className,
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {saleModePurchaseLabel(mode, language)}
    </Badge>
  );
}

type CartLineHeadingProps = {
  name: LocalizedName;
  variantName?: string;
  language: 'en' | 'ar';
  className?: string;
  onNameClick?: () => void;
};

/** Cart / checkout: product title + purchase type (بوكس / حبة) with correct RTL. */
export function CartLineProductHeading({
  name,
  variantName,
  language,
  className,
  onNameClick,
}: CartLineHeadingProps) {
  const isRtl = language === 'ar';
  const displayName = resolveCartItemName(name, language);

  return (
    <div className={cn('min-w-0 space-y-1 text-start', className)} dir={isRtl ? 'rtl' : 'ltr'}>
      {onNameClick ? (
        <button
          type="button"
          className="line-clamp-2 text-start text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline"
          onClick={onNameClick}
        >
          {displayName}
        </button>
      ) : (
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{displayName}</p>
      )}
      <SaleModeVariantBadge variantName={variantName} language={language} className="w-fit" />
    </div>
  );
}

type DualPricePillsProps = {
  product: ProductSaleInfo;
  language: 'en' | 'ar';
  className?: string;
};

/** Compact بوكس / حبة price chips for admin or lists */
export function DualSalePricePills({ product, language, className }: DualPricePillsProps) {
  if (!canSellByUnit(product)) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {language === 'ar' ? `بوكس ${getBoxPrice(product)} د.أ` : `Box ${getBoxPrice(product)} JOD`}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex flex-wrap gap-1', className)}>
      {(['box', 'unit'] as const).map((mode: SaleMode) => (
        <Badge key={mode} variant="secondary" className="text-[10px] font-normal">
          {saleModeLabel(mode, language)}: {mode === 'box' ? getBoxPrice(product) : getUnitPrice(product)}
        </Badge>
      ))}
    </span>
  );
}
