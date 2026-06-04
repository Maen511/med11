import { Heart, Package, TrendingDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWishlistAlerts } from '@/hooks/useWishlistAlerts';
import CurrencyIcon from '@/components/CurrencyIcon';
import { CartProductImage } from '@/components/CartProductImage';
import type { WishlistAlert } from '@/lib/wishlistAlerts';

type Props = {
  language: 'en' | 'ar';
  buttonClassName?: string;
};

export function WishlistAlertsBell({ language, buttonClassName }: Props) {
  const navigate = useNavigate();
  const { alerts, dismiss, dismissAll } = useWishlistAlerts();
  const count = alerts.length;
  const isRtl = language === 'ar';

  const title = isRtl ? 'تنبيهات المفضلة' : 'Wishlist alerts';
  const empty = isRtl ? 'لا توجد تنبيهات جديدة' : 'No new alerts';
  const clearAll = isRtl ? 'مسح الكل' : 'Clear all';
  const viewProduct = isRtl ? 'عرض المنتج' : 'View product';

  const messageFor = (alert: WishlistAlert) => {
    if (alert.type === 'price_drop') {
      return isRtl
        ? `انخفض السعر من ${alert.previousPrice} إلى ${alert.currentPrice}`
        : `Price dropped from ${alert.previousPrice} to ${alert.currentPrice}`;
    }
    return isRtl ? 'المنتج متوفر الآن' : 'Back in stock';
  };

  const iconFor = (alert: WishlistAlert) => {
    if (alert.type === 'price_drop') {
      return <TrendingDown className="h-4 w-4 shrink-0 text-emerald-600" />;
    }
    return <Package className="h-4 w-4 shrink-0 text-primary" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${buttonClassName ?? ''}`}
          aria-label={title}
          title={title}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              count > 0 && 'fill-rose-500 text-rose-500',
            )}
          />
          {count > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none"
            >
              {count > 9 ? '9+' : count}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">{title}</DropdownMenuLabel>
          {count > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={dismissAll}>
              {clearAll}
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        {count === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="max-h-72 overflow-y-auto py-1">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="flex gap-2 border-b border-border/60 px-3 py-2.5 last:border-0"
              >
                <CartProductImage
                  productId={alert.productId}
                  image={alert.image}
                  alt={alert.name[language]}
                  className="h-12 w-12 shrink-0 rounded-md border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1.5">
                    {iconFor(alert)}
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{alert.name[language]}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{messageFor(alert)}</p>
                  {alert.type === 'price_drop' ? (
                    <p className="mt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {alert.currentPrice}{' '}
                      <CurrencyIcon className="inline-block h-3 w-3 align-[-1px]" />
                    </p>
                  ) : null}
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0 text-xs"
                    onClick={() => {
                      dismiss(alert);
                      navigate(`/product/${alert.productId}`);
                    }}
                  >
                    {viewProduct}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={isRtl ? 'إخفاء' : 'Dismiss'}
                  onClick={() => dismiss(alert)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
