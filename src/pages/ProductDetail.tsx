import { useParams, useNavigate } from 'react-router-dom';
import { getSectionIdForProduct, Product } from '@/lib/products';
import { useMergedCatalog } from '@/hooks/useMergedCatalog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RelatedProductCard from '@/components/RelatedProductCard';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarClock, ShoppingCart } from 'lucide-react';
import CurrencyIcon from '@/components/CurrencyIcon';
import ProductSaleModePicker from '@/components/ProductSaleModePicker';
import { ProductRatingStars } from '@/components/ProductRatingStars';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getFooterContent } from '@/lib/footerContent';
import {
  canSellByUnit,
  cartVariantKey,
  getPriceForMode,
  saleModeLabel,
  type SaleMode,
} from '@/lib/productSaleModes';

const RESERVATIONS_KEY = 'med-reservations';

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

  const productSection = useMemo(() => {
    if (!product) return undefined;
    return mergedSections.find((s) => s.products.some((p) => p.id === product.id));
  }, [product, mergedSections]);

  const { language, setLanguage } = useLanguage();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { canAccessSection, isAdmin, user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [saleMode, setSaleMode] = useState<SaleMode>('box');
  const [reserveRefresh, setReserveRefresh] = useState(0);
  const footer = useMemo(() => getFooterContent(), []);

  const productSectionId = product ? getSectionIdForProduct(product.id) : null;

  useEffect(() => {
    if (!productSectionId || isAdmin) return;
    if (!canAccessSection(productSectionId)) {
      navigate('/profile', { replace: true, state: { sectionDenied: productSectionId } });
    }
  }, [productSectionId, canAccessSection, isAdmin, navigate]);

  const related = useMemo(() => {
    if (!product) return [] as Product[];
    const section = mergedSections.find((s) => s.products.some((p) => p.id === product.id));
    if (!section) return [] as Product[];
    return section.products.filter((p) => p.id !== product.id).slice(0, 5);
  }, [product, mergedSections]);

  const reservedIds = useMemo(() => {
    void reserveRefresh;
    try {
      const list = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '[]') as { id: number }[];
      return new Set(list.map((r) => r.id));
    } catch {
      return new Set<number>();
    }
  }, [reserveRefresh]);

  const handleReserve = useCallback(
    (target: Product) => {
      const current = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '[]') as { id: number }[];
      const exists = current.some((r) => r.id === target.id);
      if (exists) {
        localStorage.setItem(
          RESERVATIONS_KEY,
          JSON.stringify(current.filter((r) => r.id !== target.id)),
        );
        toast.success(language === 'en' ? 'Reservation removed' : 'تم إلغاء الحجز');
      } else {
        const record = {
          id: target.id,
          name: target.name,
          category: target.category,
          image: target.image,
          price: target.price,
          description: target.description,
          time: Date.now(),
          userName: user?.name,
          userEmail: user?.email,
        };
        localStorage.setItem(RESERVATIONS_KEY, JSON.stringify([...current, record]));
        toast.success(language === 'en' ? 'Reserved! We will notify you.' : 'تم الحجز! سنقوم بإشعارك.');
      }
      setReserveRefresh((v) => v + 1);
    },
    [language, user?.email, user?.name],
  );

  const addProductToCart = useCallback(
    (target: Product, mode: SaleMode = 'box', qty = 1) => {
      if (target.inStock === false) {
        toast.error(language === 'en' ? 'This item is out of stock.' : 'هذا المنتج غير متوفر حالياً.');
        return;
      }
      const price = getPriceForMode(target, mode);
      addToCart(
        {
          id: target.id,
          name: target.name,
          price,
          image: target.image,
          category: target.category,
          variantName: cartVariantKey(mode),
        },
        qty,
      );
      toast.success(language === 'en' ? 'Added to cart!' : 'تم إضافته للسلة!');
    },
    [addToCart, language],
  );

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
          <p className="text-lg text-muted-foreground mb-6">
            {language === 'en' ? 'Product not found.' : 'لم يتم العثور على المنتج.'}
          </p>
          <Button onClick={() => navigate(-1)}>{language === 'en' ? 'Go Back' : 'رجوع'}</Button>
        </div>
      </div>
    );
  }

  const isSoldOut = product.inStock === false;
  const unitPrice = getPriceForMode(product, saleMode);
  const sectionLabel = productSection?.title[language] ?? product.category;
  const isReserved = reservedIds.has(product.id);

  const addToCartNow = () => addProductToCart(product, saleMode, quantity);

  const tabLabels = {
    details: language === 'en' ? 'Details' : 'التفاصيل',
    usage: language === 'en' ? 'Usage' : 'الاستخدام',
    reviews: language === 'en' ? 'Reviews' : 'التقييمات',
    shipping: language === 'en' ? 'Shipping' : 'الشحن',
    faq: language === 'en' ? 'FAQ' : 'الأسئلة',
  };

  const faqItems =
    language === 'en'
      ? [
          { q: 'How do I choose between box and unit?', a: 'Use the purchase option above when both are available. Unit price applies per piece; box price includes the full pack.' },
          { q: 'Is this product suitable for all skin types?', a: 'Check the product description and consult your specialist if you have sensitive skin or active treatments.' },
          { q: 'Can I reserve an out-of-stock item?', a: 'Yes. Tap Reserve on out-of-stock products and we will notify you when available.' },
        ]
      : [
          { q: 'كيف أختار بين العلبة والحبة؟', a: 'استخدم خيار الشراء أعلاه عند توفره. سعر الحبة للقطعة الواحدة وسعر العلبة للعبوة الكاملة.' },
          { q: 'هل المنتج مناسب لجميع أنواع البشرة؟', a: 'راجع وصف المنتج واستشر مختصك إذا كانت بشرتك حساسة أو تخضع لعلاجات فعّالة.' },
          { q: 'هل يمكن حجز منتج غير متوفر؟', a: 'نعم. اضغط «احجز» للمنتجات غير المتوفرة وسنبلغك عند توفرها.' },
        ];

  return (
    <div
      className="min-h-screen bg-background"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      lang={language === 'ar' ? 'ar' : 'en'}
    >
      <Header language={language} onLanguageChange={setLanguage} />

      <motion.div
        className="container mx-auto max-w-6xl px-4 pb-12 pt-20 sm:px-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Hero: image + info */}
        <div className="product-detail-hero grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
          <div className="product-detail-media featured-product-card w-full overflow-hidden rounded-2xl border">
            <div className="product-detail-media__frame product-detail-media__frame--hero relative w-full overflow-hidden bg-muted/30">
              <img
                src={product.image || '/placeholder.svg'}
                alt={product.name[language]}
                className="product-detail-media__img product-detail-media__img--hero"
                loading="eager"
                decoding="async"
              />
              {isSoldOut && (
                <span className="absolute end-3 top-3 z-[1] rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                  {language === 'en' ? 'Out of Stock' : 'غير متوفر'}
                </span>
              )}
            </div>
          </div>

          <div className="product-detail-info flex flex-col gap-5">
            <div className="product-detail-head space-y-3">
              <h1
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {product.name[language]}
              </h1>

              <div className="product-detail-category-block w-full max-w-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {language === 'en' ? 'Category' : 'القسم'}
                </p>
                <p className="mt-1 text-sm font-semibold text-primary sm:text-base">{sectionLabel}</p>
                {(product.summary?.[language] || product.description[language]) ? (
                  <p
                    className="product-detail-category-desc mt-2 text-sm leading-relaxed text-muted-foreground"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    lang={language}
                  >
                    {product.summary?.[language] || product.description[language]}
                  </p>
                ) : null}
              </div>

              {product.subtitle ? (
                <p
                  className="product-detail-spec inline-flex w-fit max-w-full items-center rounded-lg border border-border/60 bg-muted/50 px-3.5 py-2 text-sm font-semibold tracking-wide text-foreground sm:text-base"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                  lang={language}
                >
                  {product.subtitle[language]}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-primary sm:text-4xl" dir="ltr">
                {unitPrice}
              </span>
              <CurrencyIcon className="h-6 w-6 text-primary" title={language === 'ar' ? 'دينار أردني' : 'Jordanian Dinar'} />
              {canSellByUnit(product) && (
                <span className="text-sm text-muted-foreground">
                  / {saleModeLabel(saleMode, language)}
                </span>
              )}
            </div>

            {canSellByUnit(product) ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {language === 'en' ? 'Available option' : 'خيار الشراء'}
                </p>
                <ProductSaleModePicker
                  product={product}
                  language={language}
                  value={saleMode}
                  onChange={setSaleMode}
                  variant="detail"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'en'
                    ? `Currently selected: ${saleModeLabel(saleMode, 'en')}`
                    : `المحدد حالياً: ${saleModeLabel(saleMode, 'ar')}`}
                </p>
              </div>
            ) : null}

            {!isSoldOut && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {language === 'en' ? 'Quantity' : 'الكمية'}
                </p>
                <div className="grid h-11 max-w-[12rem] grid-cols-3 overflow-hidden rounded-xl border border-border/60 bg-background">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-full rounded-none text-lg"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label={language === 'en' ? 'Decrease quantity' : 'تقليل الكمية'}
                  >
                    −
                  </Button>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="h-full rounded-none border-0 border-x border-border/60 bg-transparent text-center shadow-none focus-visible:ring-0"
                    aria-label={language === 'en' ? 'Quantity' : 'الكمية'}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-full rounded-none text-lg"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label={language === 'en' ? 'Increase quantity' : 'زيادة الكمية'}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isSoldOut ? (
                <Button
                  className={cn(
                    'btn-primary h-12 flex-1 gap-2 rounded-full text-base font-semibold sm:max-w-xs',
                    isReserved && 'border border-accent/50 bg-accent/25 text-foreground hover:bg-accent/35',
                  )}
                  onClick={() => handleReserve(product)}
                >
                  <CalendarClock className="h-5 w-5" />
                  {isReserved
                    ? language === 'en'
                      ? 'Reserved'
                      : 'محجوز'
                    : language === 'en'
                      ? 'Reserve'
                      : 'احجز'}
                </Button>
              ) : (
                <Button
                  className="btn-primary h-12 flex-1 gap-2 rounded-full text-base font-semibold sm:max-w-xs"
                  onClick={addToCartNow}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {language === 'en' ? 'Add to Cart' : 'أضف إلى السلة'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className="h-12 gap-2 rounded-full border-border/70 px-6"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className={cn('h-4 w-4', language === 'ar' && 'rotate-180')} />
                {language === 'en' ? 'Back' : 'رجوع'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="product-detail-tabs mt-10 sm:mt-12">
          <TabsList className="mb-4 flex h-auto min-h-10 w-full flex-wrap justify-center gap-1 rounded-2xl border border-border/50 bg-muted/40 p-1.5">
            {(Object.keys(tabLabels) as (keyof typeof tabLabels)[]).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="rounded-xl px-3 py-2 text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-4 sm:text-sm"
              >
                {tabLabels[key]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value="details"
            className="product-detail-tab-panel rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {product.name[language]}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {product.description[language]}
                </p>
                {canSellByUnit(product) && (
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' ? 'Options: ' : 'الخيارات: '}
                    {saleModeLabel('box', language)}, {saleModeLabel('unit', language)}
                  </p>
                )}
              </div>
              <p className="inline-flex shrink-0 items-center gap-1 text-2xl font-bold text-primary" dir="ltr">
                {unitPrice}
                <CurrencyIcon className="h-5 w-5" />
              </p>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="product-detail-tab-panel rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="mb-3 text-lg font-semibold">{tabLabels.usage}</h2>
            {product.subtitle ? (
              <p className="mb-3 text-sm font-medium text-primary">{product.subtitle[language]}</p>
            ) : null}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {language === 'en'
                ? 'Follow the directions on the product label. For professional treatments, use only as directed by your skincare specialist.'
                : 'اتبع التعليمات على ملصق المنتج. للعلاجات الاحترافية، استخدم المنتج حسب توجيهات مختص العناية بالبشرة فقط.'}
            </p>
          </TabsContent>

          <TabsContent value="reviews" className="product-detail-tab-panel rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="mb-4 text-lg font-semibold">{tabLabels.reviews}</h2>
            <ProductRatingStars rating={product.rating} language={language} showValue className="mb-3" />
            <p className="text-sm text-muted-foreground">
              {language === 'en'
                ? 'No written reviews yet. Ratings reflect catalog defaults.'
                : 'لا توجد مراجعات مكتوبة بعد. التقييم يعكس القيم الافتراضية في الكتالوج.'}
            </p>
          </TabsContent>

          <TabsContent value="shipping" className="product-detail-tab-panel rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="mb-3 text-lg font-semibold">{tabLabels.shipping}</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                {language === 'en'
                  ? 'Delivery across Jordan. Cash on delivery and online payment available at checkout.'
                  : 'التوصيل داخل الأردن. الدفع عند الاستلام والدفع الإلكتروني متاحان عند إتمام الطلب.'}
              </li>
              <li>{footer.address.line1[language]}</li>
              <li>{footer.address.line2[language]}</li>
              <li>
                {footer.hours.days[language]} — {footer.hours.time[language]}
              </li>
            </ul>
          </TabsContent>

          <TabsContent value="faq" className="product-detail-tab-panel rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-7">
            <h2 className="mb-4 text-lg font-semibold">{tabLabels.faq}</h2>
            <dl className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.q}>
                  <dt className="text-sm font-semibold text-foreground">{item.q}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
        </Tabs>

        {related.length > 0 && (
          <section className="mt-12 border-t border-border/40 pt-10">
            <h2 className="mb-6 text-center text-xl font-light text-gradient sm:text-2xl">
              {language === 'en' ? 'You may also like' : 'قد يعجبك أيضاً'}
            </h2>
            <div className="product-detail-related-rail -mx-1 flex gap-4 overflow-x-auto px-1 pb-2 scroll-smooth">
              {related.map((r) => (
                <RelatedProductCard
                  key={r.id}
                  product={r}
                  language={language}
                  isReserved={reservedIds.has(r.id)}
                  onAddToCart={(p) => addProductToCart(p)}
                  onReserve={handleReserve}
                />
              ))}
            </div>
          </section>
        )}
      </motion.div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
