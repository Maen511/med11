import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import CurrencyIcon from '@/components/CurrencyIcon';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CalendarClock, ArrowLeft, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ShinyText from '@/components/ShinyText';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CategoryBar from '@/components/CategoryBar';
import ProductCatalogCardFooter from '@/components/ProductCatalogCardFooter';
import { useMergedCatalog } from '@/hooks/useMergedCatalog';
import { cartVariantKey, getPriceForMode, type SaleMode } from '@/lib/productSaleModes';
import { buildCategoryNavItems } from '@/lib/categoryNav';
import ProductCatalogToolbar from '@/components/ProductCatalogToolbar';
import ProductCardMeta from '@/components/ProductCardMeta';
import { isInWishlist, toggleWishlistItem } from '@/lib/wishlist';
import { filterStoreCatalogProducts } from '@/lib/catalogProductFilter';
import SectionBonusStorefront from '@/components/SectionBonusStorefront';
import { resolveStoreSectionId } from '@/lib/storeNav';
import { cn } from '@/lib/utils';
type Product = {
  id: number;
  name: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  rating: number;
  category: string;
  inStock?: boolean;
  unitsPerBox?: number;
  pricePerUnit?: number;
  sellByBox?: boolean;
  sellByUnit?: boolean;
};

const ProductCategory = () => {
  const RESERVATIONS_KEY = 'med-reservations';
  const SALE_WATCHES_KEY = 'med-sale-watches';
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const tabsListRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
  );
  const { addToCart } = useCart();
  const [refreshKey, setRefreshKey] = useState(0);
  const { canAccessCatalog, canAccessSection, isAdmin, user, grantedSectionIds } = useAuth();
  const { mergedSections } = useMergedCatalog();

  const { categoryData, categoryKeys, categoryNavItems } = useMemo(() => {
    const data = Object.fromEntries(
      mergedSections.map((s) => [s.id, { title: s.title, products: s.products }]),
    ) as Record<string, { title: { en: string; ar: string }; products: Product[] }>;
    const keys = mergedSections.map((s) => s.id);
    return {
      categoryData: data,
      categoryKeys: keys,
      categoryNavItems: buildCategoryNavItems(mergedSections),
    };
  }, [mergedSections]);

  const visibleCategoryKeys = useMemo(() => {
    if (isAdmin) return categoryKeys;
    return categoryKeys.filter((key) => canAccessSection(key));
  }, [categoryKeys, canAccessSection, isAdmin]);

  useEffect(() => {
    if (!categoryId || isAdmin) return;
    if (!canAccessCatalog) return;
    if (!canAccessSection(categoryId)) {
      navigate('/profile', { replace: true, state: { sectionDenied: categoryId } });
    }
  }, [categoryId, canAccessCatalog, canAccessSection, isAdmin, navigate]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', 'ltr');
    return () => {
      root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    };
  }, [language]);

  const currentCategory = categoryData[categoryId as keyof typeof categoryData];

  useEffect(() => {
    if (currentCategory || !categoryId) return;
    const fallback = resolveStoreSectionId(grantedSectionIds, {
      isAdmin,
      catalogUnlocked: canAccessCatalog,
    });
    if (fallback) {
      navigate(`/products/${fallback}`, { replace: true });
    }
  }, [categoryId, currentCategory, canAccessCatalog, grantedSectionIds, isAdmin, navigate]);
  const products = (currentCategory?.products || []) as Product[];

  const [catalogSearch, setCatalogSearch] = useState('');

  useEffect(() => {
    setCatalogSearch('');
  }, [categoryId]);

  const filteredProducts = useMemo(
    () =>
      filterStoreCatalogProducts(products, {
        query: catalogSearch,
        stock: 'all',
        sale: 'all',
      }),
    [products, catalogSearch],
  );

  const hasActiveSearch = catalogSearch.trim() !== '';

  const clearCatalogSearch = () => setCatalogSearch('');

  // Ensure tab list starts at the beginning on mobile and RTL
  useLayoutEffect(() => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollLeft = 0;
    }
  }, [categoryKeys.length]);

  // Detect mobile for showing CategoryBar
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDarkTheme(root.classList.contains('dark'));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('med-apply-theme', syncTheme);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', syncTheme);
    return () => {
      observer.disconnect();
      window.removeEventListener('med-apply-theme', syncTheme);
      media.removeEventListener?.('change', syncTheme);
    };
  }, []);

  const sectionTitleShiny = useMemo(
    () =>
      isDarkTheme
        ? { color: 'hsl(0 0% 96%)', shineColor: 'hsl(0 0% 55%)', speed: 2.2 }
        : { color: 'hsl(0 0% 18%)', shineColor: 'hsl(0 0% 52%)', speed: 2.4 },
    [isDarkTheme],
  );

  const addToCartText = {
    en: 'Shopping Cart',
    ar: 'عربة تسوق'
  };

  const addedToCartText = {
    en: 'Added to cart!',
    ar: 'تم إضافته للسلة!'
  };

  const backToHomeText = {
    en: 'Back to Home',
    ar: 'العودة للرئيسية'
  };

  const handleAddToCart = (product: Product, mode: SaleMode = 'box') => {
    addToCart({
      id: product.id,
      name: product.name,
      price: getPriceForMode(product, mode),
      image: product.image,
      category: product.category,
      variantName: cartVariantKey(mode),
    });
    toast.success(addedToCartText[language]);
  };

  const handleReserve = (product: Product) => {
    if (!canAccessCatalog) {
      toast.error(
        language === 'en'
          ? 'Catalog access must be granted by the store admin first.'
          : 'يجب أن يمنحك المسؤول وصولاً للكتالوج أولاً.',
      );
      return;
    }
    const current = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '[]');
    const exists = current.some((r: any) => r.id === product.id);
    if (exists) {
      const next = current.filter((r: any) => r.id !== product.id);
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(next));
      toast.success(language === 'en' ? 'Reservation removed' : 'تم إلغاء الحجز');
    } else {
      const record = { id: product.id, name: product.name, category: product.category, image: product.image, price: product.price, description: product.description, time: Date.now(), userName: user?.name, userEmail: user?.email };
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify([...current, record]));
      toast.success(language === 'en' ? 'Reserved! We will notify you.' : 'تم الحجز! سنقوم بإشعارك.');
    }
    setRefreshKey((v) => v + 1);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  if (!currentCategory) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-background"
        dir="ltr"
        lang={language === 'ar' ? 'ar' : 'en'}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">
            {language === 'en' ? 'Category Not Found' : 'القسم غير موجود'}
          </h1>
          <Link to="/">
            <Button className="btn-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backToHomeText[language]}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isArabic = language === 'ar';

  return (
    <div className="min-h-screen overflow-x-clip bg-background" dir="ltr" lang={isArabic ? 'ar' : 'en'}>
      <Header language={language} onLanguageChange={setLanguage} />
      
      {/* صف الرجوع قصير — لا يُلف حول الشريط الـ sticky حتى لا يحدّ ارتفاع الالتصاق */}
      <div className="container mx-auto px-4 pt-24 pb-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/">
            <Button variant="ghost" className="text-foreground hover:bg-secondary hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backToHomeText[language]}
            </Button>
          </Link>
        </div>
      </div>

      {/* ابن مباشر لـ min-h-screen: يبقى تحت الهيدر لطول الصفحة */}
      <div className="store-category-sticky sticky z-40 w-full border-b border-border/30 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
        <div className="container mx-auto min-w-0 px-2 py-2 sm:px-4 sm:py-2.5 md:py-3">
          {isMobile ? (
            <CategoryBar
              variant="store"
              language={language}
              categories={categoryNavItems.filter((c) => visibleCategoryKeys.includes(c.id))}
              currentCategoryId={categoryId}
              onSelect={(id) => navigate(`/products/${id}`)}
            />
          ) : (
            <Tabs
              value={currentCategory ? (categoryId as string) : (categoryKeys[0] || 'perfumes')}
              onValueChange={(val) => navigate(`/products/${val}`)}
              dir="ltr"
            >
              <TabsList
                ref={tabsListRef as any}
                className="flex h-11 min-h-11 w-full min-w-0 flex-nowrap items-center justify-center gap-1 overflow-x-auto overflow-y-hidden rounded-lg border border-border/60 bg-muted/50 p-1 [scrollbar-width:thin] dark:bg-muted/30"
              >
                {visibleCategoryKeys.map((key) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="inline-flex shrink-0 snap-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-center text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    {categoryData[key].title[language]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      <section className="bg-gradient-to-b from-background to-secondary/15 pb-0">
        <motion.div
          className="container mx-auto max-w-5xl px-3 pt-2 text-center sm:px-4 sm:pt-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <motion.h1
            className={`mb-3 w-full max-w-full overflow-visible break-words px-1 text-3xl leading-[1.35] [overflow-wrap:anywhere] antialiased md:text-4xl md:leading-[1.4] ${isDarkTheme ? 'font-light drop-shadow-[0_2px_28px_rgba(255,255,255,0.14)]' : 'font-extralight'} ${language === 'ar' ? 'tracking-normal' : 'tracking-[0.14em]'}`}
            style={{ fontFamily: "'Raleway', sans-serif" }}
            dir={isArabic ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <ShinyText
              text={currentCategory.title[language]}
              speed={sectionTitleShiny.speed}
              delay={0}
              color={sectionTitleShiny.color}
              shineColor={sectionTitleShiny.shineColor}
              spread={isDarkTheme ? 110 : 115}
              direction="left"
              className={`${isDarkTheme ? 'font-light' : 'font-extralight'} ${language === 'ar' ? 'tracking-normal' : 'tracking-[0.14em]'}`}
            />
          </motion.h1>
          <motion.div className="mx-auto h-0.5 w-16 rounded-full bg-gradient-to-r from-primary to-accent" />
          <p
            className="mx-auto mt-2 max-w-2xl px-1 text-base leading-snug text-muted-foreground [overflow-wrap:anywhere]"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {language === 'en'
              ? `Discover our complete collection of ${currentCategory.title.en.toLowerCase()}`
              : `اكتشف مجموعتنا الكاملة من ${currentCategory.title.ar}`}
          </p>
        </motion.div>

        <div className="container mx-auto px-4 pb-10 pt-4 md:pb-12 md:pt-5">
          <ProductCatalogToolbar
            language={language}
            search={catalogSearch}
            onSearchChange={setCatalogSearch}
            filteredCount={filteredProducts.length}
            totalCount={products.length}
            hasActiveSearch={hasActiveSearch}
            onClear={clearCatalogSearch}
            className="mx-auto max-w-[1400px]"
          />

          {isMobile && filteredProducts.length > 0 ? (
            <p
              className="mx-auto mb-3 max-w-[1400px] px-1 text-center text-xs text-muted-foreground"
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              {language === 'ar'
                ? 'اسحب يميناً ويساراً لتصفح المنتجات'
                : 'Swipe left or right to browse products'}
            </p>
          ) : null}

          {filteredProducts.length === 0 ? (
            <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-14 text-center">
              <p className="text-lg font-medium text-foreground">
                {language === 'ar' ? 'لا توجد نتائج' : 'No matching products'}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {language === 'ar' ? 'جرّب كلمة بحث أخرى.' : 'Try a different search term.'}
              </p>
              {hasActiveSearch ? (
                <Button type="button" variant="secondary" size="sm" className="mt-5" onClick={clearCatalogSearch}>
                  {language === 'ar' ? 'مسح البحث' : 'Clear search'}
                </Button>
              ) : null}
            </div>
          ) : (
          <motion.div
            className={cn(
              'mx-auto w-full max-w-[1400px]',
              isMobile
                ? 'catalog-products-rail flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-3 pt-0 [-webkit-overflow-scrolling:touch]'
                : 'grid auto-rows-fr grid-cols-[repeat(auto-fill,minmax(min(100%,272px),1fr))] items-stretch gap-4 sm:gap-5 lg:gap-6',
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            key={`${categoryId}-${catalogSearch}`}
          >
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                className={cn(
                  'flex min-h-0',
                  isMobile
                    ? 'w-[min(78vw,17.5rem)] shrink-0 snap-center'
                    : 'h-full w-full',
                )}
                variants={itemVariants}
              >
                <Link to={`/product/${product.id}`} className="flex h-full min-h-0 w-full">
                  <div className="flex h-full min-h-0 w-full flex-col">
                    <Card
                      className={cn(
                        'catalog-product-card featured-product-card group flex h-full w-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:border-primary/35 dark:hover:border-accent/40',
                        isMobile
                          ? 'min-h-[20rem] hover:shadow-md'
                          : 'min-h-[22rem] hover:-translate-y-0.5 hover:shadow-md sm:min-h-[24rem] sm:rounded-2xl sm:hover:-translate-y-1 sm:hover:shadow-lg',
                      )}
                    >
                      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted/30">
                        <img
                          src={product.image}
                          alt={product.name[language]}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                        {product.inStock === false && (
                          <div className="absolute left-3 top-3 rounded bg-destructive px-2 py-1 text-xs text-destructive-foreground">
                            {language === 'en' ? 'Sold Out' : 'غير متوفر'}
                          </div>
                        )}
                      </div>

                      <CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-4" dir="ltr">
                        <div className="flex min-h-0 flex-1 flex-col justify-start">
                          <div className="flex w-full flex-col gap-1">
                            <h3
                              className="line-clamp-2 w-full text-center text-base font-semibold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-lg"
                              dir={isArabic ? 'rtl' : 'ltr'}
                            >
                              {product.name[language]}
                            </h3>
                            <ProductCardMeta
                              rating={product.rating}
                              language={language}
                              align="start"
                            />
                            <p
                              className="line-clamp-3 text-start text-sm leading-snug text-muted-foreground"
                              dir={isArabic ? 'rtl' : 'ltr'}
                            >
                              {product.description[language] || '\u00a0'}
                            </p>
                          </div>
                        </div>

                        {product.inStock === false ? (
                          <div className="mt-auto flex min-h-[5.75rem] shrink-0 flex-col justify-center gap-3 border-t border-border/40 pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="inline-flex items-center gap-1 text-xl font-semibold text-primary md:text-lg">
                              {product.price}
                              <CurrencyIcon
                                className="mx-1 inline-block h-4 w-4"
                                title={language === 'ar' ? 'دينار أردني' : 'Jordanian Dinar'}
                              />
                            </span>
                            {(() => {
                              const list = JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '[]') as { id: number }[];
                              const isReserved = list.some((r) => r.id === product.id);
                              return (
                                <Button
                                  size="sm"
                                  className={
                                    isReserved
                                      ? 'border border-amber-400 bg-amber-300/60 text-foreground'
                                      : 'btn-primary'
                                  }
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleReserve(product);
                                  }}
                                >
                                  <CalendarClock className="mr-2 h-4 w-4" />
                                  {language === 'en' ? 'Reserve' : 'احجز'}
                                </Button>
                              );
                            })()}
                          </div>
                        ) : (
                          <ProductCatalogCardFooter
                            product={product}
                            language={language}
                            onAddToCart={handleAddToCart}
                            extraActions={
                              <>
                                {(() => {
                                  const wished = isInWishlist(product.id);
                                  return (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      title={language === 'en' ? 'Add to Wishlist' : 'أضف إلى المفضلة'}
                                      aria-label={language === 'en' ? 'Add to Wishlist' : 'أضف إلى المفضلة'}
                                      className={
                                        wished ? 'border-rose-300 bg-rose-200/50 text-rose-700' : ''
                                      }
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const added = toggleWishlistItem({
                                          id: product.id,
                                          name: product.name,
                                          category: product.category,
                                          image: product.image,
                                          price: product.price,
                                        });
                                        toast.success(
                                          language === 'en'
                                            ? added
                                              ? 'Added to wishlist'
                                              : 'Removed from wishlist'
                                            : added
                                              ? 'أُضيف إلى المفضلة'
                                              : 'تمت الإزالة من المفضلة',
                                        );
                                        setRefreshKey((v) => v + 1);
                                      }}
                                    >
                                      <Heart className="h-4 w-4" />
                                    </Button>
                                  );
                                })()}
                                {(() => {
                                  const watched = (
                                    JSON.parse(localStorage.getItem(SALE_WATCHES_KEY) || '[]') as {
                                      id: number;
                                    }[]
                                  ).some((r) => r.id === product.id);
                                  return (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      title={language === 'en' ? 'Notify on Sale' : 'إشعار عند العرض'}
                                      aria-label={language === 'en' ? 'Notify on Sale' : 'إشعار عند العرض'}
                                      className={watched ? 'border-amber-400 bg-amber-300/60' : ''}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!canAccessCatalog) {
                                          toast.error(
                                            language === 'en'
                                              ? 'Catalog access must be granted by the store admin first.'
                                              : 'يجب أن يمنحك المسؤول وصولاً للكتالوج أولاً.',
                                          );
                                          return;
                                        }
                                        const current = JSON.parse(
                                          localStorage.getItem(SALE_WATCHES_KEY) || '[]',
                                        );
                                        const exists = current.some((r: { id: number }) => r.id === product.id);
                                        const next = exists
                                          ? current.filter((r: { id: number }) => r.id !== product.id)
                                          : [
                                              ...current,
                                              {
                                                id: product.id,
                                                name: product.name,
                                                category: product.category,
                                                image: product.image,
                                                price: product.price,
                                                description: product.description,
                                                time: Date.now(),
                                                userName: user?.name,
                                                userEmail: user?.email,
                                              },
                                            ];
                                        localStorage.setItem(SALE_WATCHES_KEY, JSON.stringify(next));
                                        toast.success(
                                          language === 'en'
                                            ? exists
                                              ? 'Sale alert removed'
                                              : 'You will be notified when on sale'
                                            : exists
                                              ? 'تم إزالة تنبيه العرض'
                                              : 'سيصلك إشعار عند توفر عرض',
                                        );
                                        setRefreshKey((v) => v + 1);
                                      }}
                                    >
                                      <Bell className="h-4 w-4" />
                                    </Button>
                                  );
                                })()}
                              </>
                            }
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
          )}
        </div>
        {categoryId ? <SectionBonusStorefront language={language} sectionId={categoryId} /> : null}
      </section>
      <Footer />
    </div>
  );
};

export default ProductCategory;
