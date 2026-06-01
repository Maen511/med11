import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  rating?: number | null;
  max?: number;
  className?: string;
  starClassName?: string;
  showValue?: boolean;
  language?: 'en' | 'ar';
};

function clampRating(value: number | null | undefined, max: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 4;
  return Math.min(max, Math.max(0, Math.round(n)));
}

/** Star rating row — stars stay LTR; label supports Arabic. */
export function ProductRatingStars({
  rating,
  max = 5,
  className,
  starClassName,
  showValue = false,
  language = 'en',
}: Props) {
  const filled = clampRating(rating, max);
  const isRtl = language === 'ar';
  const label = isRtl ? `التقييم ${filled} من ${max}` : `Rating ${filled} out of ${max}`;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="img"
      aria-label={label}
    >
      <span className="inline-flex items-center gap-0.5" dir="ltr">
        {Array.from({ length: max }, (_, i) => {
          const index = i + 1;
          const active = index <= filled;
          return (
            <Star
              key={index}
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground/40',
                starClassName,
              )}
              aria-hidden
            />
          );
        })}
      </span>
      {showValue ? (
        <span className="text-[11px] font-medium tabular-nums text-muted-foreground">{filled}/{max}</span>
      ) : null}
    </span>
  );
}

export default ProductRatingStars;
