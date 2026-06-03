import { cn } from '@/lib/utils';
import {
  canSellByUnit,
  getPriceForMode,
  saleModeLabel,
  type ProductSaleInfo,
  type SaleMode,
} from '@/lib/productSaleModes';

type Props = {
  product: ProductSaleInfo;
  language: 'en' | 'ar';
  value: SaleMode;
  onChange: (mode: SaleMode) => void;
  compact?: boolean;
  /** Product detail page — full-width luxury segmented control */
  variant?: 'default' | 'detail';
  className?: string;
};

const ProductSaleModePicker = ({ product, language, value, onChange, compact, variant = 'default', className }: Props) => {
  const isDetail = variant === 'detail';
  if (!canSellByUnit(product)) return null;

  const isRtl = language === 'ar';

  return (
    <div className={cn(isDetail ? 'space-y-2' : compact ? 'space-y-1' : 'space-y-2', className)} dir="ltr" lang={isRtl ? 'ar' : 'en'}>
      <div
        className={cn(
          isDetail
            ? 'grid w-full grid-cols-2 gap-2'
            : cn('inline-flex w-full rounded-lg border border-border/70 bg-muted/30 p-0.5', compact && 'text-xs'),
        )}
        role="group"
        aria-label={isRtl ? 'طريقة الشراء' : 'Purchase type'}
      >
        {(['box', 'unit'] as const).map((mode) => {
          const selected = value === mode;
          const price = getPriceForMode(product, mode);
          return (
            <button
              key={mode}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(mode);
              }}
              className={cn(
                'font-medium transition-all duration-200',
                isDetail
                  ? cn(
                      'flex min-h-[3.5rem] flex-col items-center justify-center rounded-lg border px-2 py-2 text-center',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.45)]'
                        : 'border-border/55 bg-background/90 text-foreground/80 hover:border-primary/25 hover:bg-background',
                    )
                  : cn(
                      'flex-1 rounded-md px-2 py-1.5 text-center',
                      selected
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      compact && 'py-1',
                    ),
              )}
            >
              <span className={cn('block leading-tight', isDetail && 'text-sm')}>{saleModeLabel(mode, language)}</span>
              <span
                className={cn(
                  'mt-1 block leading-tight opacity-90',
                  isDetail ? 'text-xs' : compact ? 'text-[10px]' : 'text-xs',
                )}
              >
                {price} {isRtl ? 'د.أ' : 'JOD'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductSaleModePicker;
