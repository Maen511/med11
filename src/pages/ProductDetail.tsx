import { useParams, useNavigate, Link } from 'react-router-dom';
import { getSectionIdForProduct, Product } from '@/lib/products';
import { useMergedCatalog } from '@/hooks/useMergedCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, CalendarClock } from 'lucide-react';
import CurrencyIcon from '@/components/CurrencyIcon';
import ProductSaleModePicker from '@/components/ProductSaleModePicker';
import { cn } from '@/lib/utils';
import {
  canSellByUnit,
  cartVariantKey,
  getPriceForMode,
  type SaleMode,
} from '@/lib/productSaleModes';

const ProductDetail = () => {
  const { id } = useParams();
  const productId = Number(id);
  const { mergedSections, loading } = useMergedCatalog();
  const product: Product | undefined = useMemo(() => {
    if (isNaN(productId)) return undefined;
    for (const sec of mergedSections) {
      const found = sec.products.find((p) => p.id === productId);
      if (found) return found;
    }
    return undefined;
  }, [mergedSections, productId]);
  const { language, setLanguage } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { canAccessSection, isAdmin } = useAuth();
  const [quantity, setQuantity] = useState<number>(1);
  const [saleMode, setSaleMode] = useState<SaleMode>('box');

  const productSectionId = product ? getSectionIdForProduct(product.id) : null;

  useEffect(() => {
    if (!productSectionId || isAdmin) return;
    if (!canAccessSection(productSectionId)) {
      navigate('/profile', { replace: true, state: { sectionDenied: productSectionId } });
    }
  }, [productSectionId, canAccessSection, isAdmin, navigate]);

  const related = useMemo(() => {
    if (!product) return [] as Product[];
    const section = mergedSections.find(s => s.products.some(p => p.id === product.id));
    if (!section) return [] as Product[];
    return section.products.filter(p => p.id !== product.id).slice(0, 3);
  }, [product, mergedSections]);

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header language={language} onLanguageChange={setLanguage} isStatic />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-lg text-muted-foreground mb-6">
            {language === 'en' ? 'Loading product...' : 'جاري تحميل المنتج...'}
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header language={language} onLanguageChange={setLanguage} isStatic />
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-lg text-muted-foreground mb-6">{language === 'en' ? 'Product not found.' : 'لم يتم العثور على المنتج.'}</p>
          <Button onClick={() => navigate(-1)}>{language === 'en' ? 'Go Back' : 'رجوع'}</Button>
        </div>
      </div>
    );
  }

  const isSoldOut = product.inStock === false;
  const unitPrice = getPriceForMode(product, saleMode);

  const addToCartNow = () => {
    if (isSoldOut) {
      toast.error(language === 'en' ? 'This item is out of stock.' : 'هذا المنتج غير متوفر حالياً.');
      return;
    }
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: unitPrice,
        image: product.image,
        category: product.category,
        variantName: cartVariantKey(saleMode),
      },
      quantity,
    );
    toast.success(language === 'en' ? 'Added to cart!' : 'تم إضافته للسلة!');
  };

  return (
    <div
      className="min-h-screen bg-background"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      lang={language === 'ar' ? 'ar' : 'en'}
    >
      <Header language={language} onLanguageChange={setLanguage} />
      <motion.div className="container mx-auto max-w-5xl px-4 pt-20 pb-8">
        <motion.div className="flex flex-col gap-4">
          <motion.div className="space-y-1.5">
            <h1
              className={cn(
                'text-2xl font-semibold text-gradient sm:text-3xl w-full max-w-full break-words leading-snug',
                language === 'ar' && 'text-right',
              )}
            >
              {product.name[language]}
            </h1>
            {product.subtitle && (
              <p className="text-sm font-medium text-primary">{product.subtitle[language]}</p>
            )}
            <p
              className={cn(
                'max-w-2xl text-sm leading-relaxed text-muted-foreground line-clamp-3 md:line-clamp-4',
                language === 'ar' && 'text-right',
              )}
            >
              {product.description[language]}
            </p>
          </motion.div>

          <motion.div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-6">
            <motion.div
              className="w-full max-w-[18rem] shrink-0 lg:w-[18rem]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="featured-product-card w-full overflow-hidden rounded-xl">
                <CardContent className="p-2">
                  <motion.div
                    className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/25 ring-1 ring-border/40 dark:ring-white/10"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.45 }}
                  >
                    <img
                      src={product.image || '/placeholder.svg'}
                      alt={product.name[language]}
                      className="absolute inset-0 h-full w-full object-cover object-center"
                      loading="eager"
                      decoding="async"
                    />
                    <motion.div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 dark:from-black/35 dark:to-white/5"
                      aria-hidden
                    />
                    {isSoldOut && (
                      <motion.div className="absolute inset-0 flex items-center justify-center bg-background/55 backdrop-blur-[3px]">
                        <span className="rounded-full border border-destructive/40 bg-destructive/90 px-4 py-1.5 text-sm font-medium text-destructive-foreground">
                          {language === 'en' ? 'Out of Stock' : 'غير متوفر'}
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <Card className="featured-product-card w-full max-w-[18rem] shrink-0 overflow-hidden rounded-xl lg:w-[18rem]">
              <CardContent className="flex flex-col gap-3 p-3">
                {canSellByUnit(product) ? (
                  <ProductSaleModePicker
                    product={product}
                    language={language}
                    value={saleMode}
                    onChange={setSaleMode}
                    variant="detail"
                  />
                ) : (
                  <motion.div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/70 px-4 py-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {language === 'en' ? 'Price' : 'السعر'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xl font-semibold text-primary">
                      {unitPrice}
                      <CurrencyIcon className="h-4 w-4" title={language === 'ar' ? 'دينار أردني' : 'Jordanian Dinar'} />
                    </span>
                  </motion.div>
                )}

                <motion.div className="flex w-full flex-col gap-2 border-t border-border/40 pt-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {language === 'en' ? 'Quantity' : 'الكمية'}
                  </p>
                  <motion.div className="grid h-10 w-full grid-cols-3 overflow-hidden rounded-lg border border-border/60 bg-background/80">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-full rounded-none text-lg hover:bg-muted/60"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label={language === 'en' ? 'Decrease quantity' : 'تقليل الكمية'}
                    >
                      -
                    </Button>
                    <Input
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="h-full rounded-none border-0 border-x border-border/60 bg-transparent text-center text-sm font-medium shadow-none focus-visible:ring-0"
                      aria-label={language === 'en' ? 'Quantity' : 'الكمية'}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-full rounded-none text-lg hover:bg-muted/60"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label={language === 'en' ? 'Increase quantity' : 'زيادة الكمية'}
                    >
                      +
                    </Button>
                  </motion.div>
                  {isSoldOut ? (
                    <Button className="btn-primary h-10 w-full text-sm" disabled>
                      <CalendarClock className="h-4 w-4 me-1.5" />
                      {language === 'en' ? 'Out of Stock' : 'غير متوفر'}
                    </Button>
                  ) : (
                    <Button className="btn-primary h-10 w-full gap-2 text-sm font-semibold" onClick={addToCartNow}>
                      <ShoppingCart className="h-4 w-4" />
                      {language === 'en' ? 'Add to Cart' : 'أضف إلى السلة'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(-1)}
                  >
                    {language === 'en' ? '← Back to store' : '← العودة للمتجر'}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {related.length > 0 && (
          <motion.section
            className="mt-4 border-t border-border/40 pt-4"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-3 text-center text-lg font-light text-gradient md:text-xl">
              {language === 'en' ? 'Related products' : 'منتجات مرتبطة'}
            </h2>
            <motion.div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {related.map((r) => (
                <Link to={`/product/${r.id}`} key={r.id} className="group block h-full">
                  <Card className="featured-product-card h-full overflow-hidden rounded-xl transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg">
                    <CardContent className="p-2.5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg bg-muted/25 ring-1 ring-border/40">
                        <img
                          src={r.image || '/placeholder.svg'}
                          alt={r.name[language]}
                          className="absolute inset-0 h-full w-full object-cover object-center"
                          loading="lazy"
                        />
                      </div>
                      <h3
                        className={cn(
                          'line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary',
                          language === 'ar' ? 'text-start' : 'text-center',
                        )}
                      >
                        {r.name[language]}
                      </h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </motion.div>
          </motion.section>
        )}
      </motion.div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
