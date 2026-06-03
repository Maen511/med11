import { Link } from 'react-router-dom';
import { CalendarClock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CurrencyIcon from '@/components/CurrencyIcon';
import type { Product } from '@/lib/products';
import { getPriceForMode } from '@/lib/productSaleModes';
import { cn } from '@/lib/utils';

type Props = {
  product: Product;
  language: 'en' | 'ar';
  isReserved?: boolean;
  onAddToCart: (product: Product) => void;
  onReserve: (product: Product) => void;
};

/** Split image / info card for "You may also like" — uses site theme colors. */
export default function RelatedProductCard({
  product,
  language,
  isReserved,
  onAddToCart,
  onReserve,
}: Props) {
  const soldOut = product.inStock === false;
  const price = getPriceForMode(product, 'box');

  return (
    <article className="product-detail-related-card group flex w-[min(100%,11.25rem)] shrink-0 flex-col sm:w-[13rem]">
      <Link
        to={`/product/${product.id}`}
        className="product-detail-related-card__media relative block w-full overflow-hidden rounded-t-2xl bg-muted/30"
      >
        <div className="relative aspect-[4/3] w-full">
          <img
            src={product.image || '/placeholder.svg'}
            alt={product.name[language]}
            className="product-detail-media__img transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        </div>
        {soldOut && (
          <span className="absolute end-2 top-2 z-[1] rounded-full bg-accent px-2.5 py-0.5 text-[0.65rem] font-semibold text-accent-foreground shadow-sm">
            {language === 'en' ? 'Out of Stock' : 'غير متوفر'}
          </span>
        )}
      </Link>

      <div className="product-detail-related-card__body featured-product-card flex flex-1 flex-col gap-2 rounded-b-2xl border-t border-border/40 p-3">
        <Link to={`/product/${product.id}`} className="space-y-0.5 text-start hover:opacity-90">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground" dir="ltr" lang="en">
            {product.name.en}
          </h3>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground" dir="rtl" lang="ar">
            {product.name.ar}
          </p>
        </Link>

        <p className="inline-flex items-center gap-1 text-base font-semibold text-primary" dir="ltr">
          {price}
          <CurrencyIcon className="h-3.5 w-3.5" title={language === 'ar' ? 'دينار أردني' : 'Jordanian Dinar'} />
        </p>

        {soldOut ? (
          <Button
            type="button"
            size="sm"
            className={cn(
              'mt-auto h-9 w-full gap-1.5 rounded-full text-xs font-semibold',
              isReserved
                ? 'border border-accent/50 bg-accent/25 text-foreground hover:bg-accent/35'
                : 'btn-primary',
            )}
            onClick={(e) => {
              e.preventDefault();
              onReserve(product);
            }}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {language === 'en' ? 'Reserve' : 'احجز'}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="btn-primary mt-auto h-9 w-full gap-1.5 rounded-full text-xs font-semibold"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product);
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {language === 'en' ? 'Add to Cart' : 'أضف إلى السلة'}
          </Button>
        )}
      </div>
    </article>
  );
}
