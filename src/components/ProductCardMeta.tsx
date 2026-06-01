import { ProductRatingStars } from '@/components/ProductRatingStars';
import { cn } from '@/lib/utils';

type Props = {
  rating?: number | null;
  language: 'en' | 'ar';
  /** بداية السطر — يسار في EN، يسار الشاشة في AR (مع RTL) */
  align?: 'start' | 'center';
  className?: string;
};

/** نجوم التقييم فقط — بدون نصوص وهمية (مشاهدات / مواصفات ثابتة). */
export function ProductCardMeta({ rating, language, align = 'start', className }: Props) {
  const onVisualLeft = align === 'start';

  return (
    <div
      className={cn(
        'flex h-4 w-full shrink-0 items-center',
        onVisualLeft ? 'justify-start' : 'justify-center',
        className,
      )}
      dir="ltr"
    >
      <ProductRatingStars
        rating={rating}
        language={language}
        starClassName="h-3.5 w-3.5"
        className={onVisualLeft ? 'justify-start' : 'justify-center'}
      />
    </div>
  );
}

export default ProductCardMeta;
