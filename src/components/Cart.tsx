import React from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import CurrencyIcon from '@/components/CurrencyIcon';
import { cn } from '@/lib/utils';
import { CartLineProductHeading } from '@/components/ProductSaleModeBadge';
import { cartLineId, resolveCartItemName } from '@/lib/productSaleModes';
import { CartProductImage } from '@/components/CartProductImage';
import { sectionBonusFreeLineLabel } from '@/lib/sectionBonus';
import { isCartHiddenPath } from '@/lib/cartUi';

interface CartProps {
  language: 'en' | 'ar';
}

function HeaderCartGlyph({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn('relative inline-flex items-center justify-center will-change-transform', className)}
      whileHover={{ scale: 1.08, y: -1 }}
      transition={{ type: 'spring', stiffness: 440, damping: 22 }}
    >
      <ShoppingCart
        aria-hidden
        className="size-full text-white [filter:drop-shadow(0_0_0.5px_rgba(0,0,0,0.95))_drop-shadow(0_0_4px_rgba(0,0,0,0.75))_drop-shadow(0_2px_8px_rgba(0,0,0,0.55))_drop-shadow(0_-1px_0_rgba(255,255,255,0.45))]"
        strokeWidth={2.65}
        absoluteStrokeWidth
      />
    </motion.span>
  );
}

function DockCartBagGlyph({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn('relative inline-flex items-center justify-center', className)}
      whileHover={{ scale: 1.06, y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <ShoppingBag
        aria-hidden
        className="size-full text-foreground [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.55))_drop-shadow(0_2px_5px_rgba(0,0,0,0.14))_drop-shadow(0_0_12px_hsl(var(--accent)_/_0.28))] dark:[filter:drop-shadow(0_1px_0_rgba(255,255,255,0.12))_drop-shadow(0_2px_8px_rgba(0,0,0,0.5))_drop-shadow(0_0_14px_hsl(var(--accent)_/_0.35))]"
        strokeWidth={2.65}
        absoluteStrokeWidth
      />
    </motion.span>
  );
}

const BOTTOM_INSET = 'max(clamp(5.75rem, 22vh, 14rem), env(safe-area-inset-bottom, 0px))';
const PANEL_MAX_HEIGHT =
  'calc(100dvh - 6rem - clamp(5.75rem, 22vh, 14rem) - env(safe-area-inset-bottom, 0px))';

const Cart: React.FC<CartProps> = ({ language }) => {
  const {
    items,
    isCartOpen,
    setCartOpen,
    toggleCartOpen,
    updateQuantity,
    removeFromCart,
    getTotalPrice,
    getTotalItems,
  } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const prevCountRef = React.useRef(items.length);

  React.useEffect(() => {
    const prev = prevCountRef.current;
    const curr = items.length;
    if (prev === 0 && curr > 0) setCartOpen(true);
    prevCountRef.current = curr;
  }, [items.length, setCartOpen]);

  React.useEffect(() => {
    if (isCartHiddenPath(location.pathname)) setCartOpen(false);
  }, [location.pathname, setCartOpen]);

  React.useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCartOpen, setCartOpen]);

  if (isCartHiddenPath(location.pathname)) {
    return null;
  }

  const texts = {
    en: {
      cart: 'Shopping Cart',
      empty: 'Your cart is empty',
      total: 'Total',
      checkout: 'Proceed to Checkout',
      currency: 'JOD',
      openCart: 'Open cart',
      close: 'Close',
    },
    ar: {
      cart: 'سلة التسوق',
      empty: 'سلة التسوق فارغة',
      total: 'المجموع',
      checkout: 'متابعة إلى الدفع',
      currency: 'د.أ',
      openCart: 'فتح السلة',
      close: 'إغلاق',
    },
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setCartOpen(false);
    navigate('/checkout');
  };

  const hasItems = items.length > 0;
  const isRtl = language === 'ar';

  const floatingPanel =
    isCartOpen && typeof document !== 'undefined'
      ? ReactDOM.createPortal(
          <AnimatePresence>
            <motion.aside
              key="cart-panel"
              role="complementary"
              aria-label={texts[language].cart}
              initial={{ opacity: 0, x: isRtl ? 14 : -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 14 : -14 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              dir={isRtl ? 'rtl' : 'ltr'}
              lang={isRtl ? 'ar' : 'en'}
              className="fixed start-3 top-24 z-[60] w-[min(360px,calc(100dvw-1.25rem))] max-w-[calc(100dvw-0.75rem)]"
              style={{ bottom: BOTTOM_INSET, maxHeight: PANEL_MAX_HEIGHT }}
            >
                <div
                  className="flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-xl dark:bg-background/90"
                  style={{ maxHeight: PANEL_MAX_HEIGHT }}
                >
                  <div className="shrink-0 border-b border-border/60 bg-background px-3 pb-2 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold">
                        <DockCartBagGlyph className="h-4 w-4 shrink-0" />
                        <span className="truncate">{texts[language].cart}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setCartOpen(false)}
                          aria-label={texts[language].close}
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </Button>
                        {hasItems ? (
                          <Button variant="ghost" size="sm" className="shrink-0 px-2 text-xs" onClick={handleCheckout}>
                            {texts[language].checkout}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                    <div className="space-y-3">
                      {items.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">{texts[language].empty}</div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={cartLineId(item)}
                            className="flex items-center gap-3 rounded-lg border border-border p-3"
                          >
                            <button
                              type="button"
                              className="h-20 w-20 shrink-0"
                              onClick={() => {
                                navigate(`/product/${item.id}`);
                              }}
                              aria-label={resolveCartItemName(item.name, language)}
                            >
                              <CartProductImage
                                productId={item.id}
                                image={item.image}
                                alt={resolveCartItemName(item.name, language)}
                                className="h-20 w-20 rounded-md"
                              />
                            </button>
                            <div className="min-w-0 flex-1">
                              <CartLineProductHeading
                                name={item.name}
                                variantName={item.variantName}
                                language={language}
                                onNameClick={() => {
                                  navigate(`/product/${item.id}`);
                                }}
                              />
                              <p className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                                {item.isSectionBonusFree ? (
                                  <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100">
                                    {sectionBonusFreeLineLabel(item.variantName, language)}
                                  </Badge>
                                ) : (
                                  <>
                                    {item.price}{' '}
                                    <CurrencyIcon language={language} className="h-4 w-4" title={texts[language].currency} />
                                  </>
                                )}
                              </p>
                              {!item.isSectionBonusFree ? (
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity - 1, item.variantName, item.isSectionBonusFree)
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1, item.variantName, item.isSectionBonusFree)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              ) : (
                                <p className="mt-2 text-xs text-muted-foreground">× {item.quantity}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.id, item.variantName, item.isSectionBonusFree)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {hasItems ? (
                    <div className="shrink-0 space-y-3 border-t border-border/60 bg-background px-3 pb-4 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{texts[language].total}:</span>
                        <span className="inline-flex items-center gap-1 text-lg font-bold text-primary">
                          {getTotalPrice()}{' '}
                          <CurrencyIcon language={language} className="h-5 w-5" title={texts[language].currency} />
                        </span>
                      </div>
                      <Button className="btn-primary w-full" size="lg" onClick={handleCheckout}>
                        {texts[language].checkout}
                      </Button>
                    </div>
                  ) : null}
                </div>
            </motion.aside>
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-8 w-8 rounded-full border-0 bg-transparent shadow-none hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-white/35 focus-visible:ring-offset-0 sm:h-9 sm:w-9 md:h-10 md:w-10"
        aria-label={texts[language].openCart}
        aria-expanded={isCartOpen}
        onClick={toggleCartOpen}
      >
        <HeaderCartGlyph className="h-[1.15rem] w-[1.15rem] sm:h-5 sm:w-5 md:h-6 md:w-6" />
        {getTotalItems() > 0 ? (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center border-0 p-0 text-[10px] shadow-none ring-0 md:h-6 md:w-6 md:text-xs"
          >
            {getTotalItems()}
          </Badge>
        ) : null}
      </Button>
      {floatingPanel}
    </>
  );
};

export default Cart;
