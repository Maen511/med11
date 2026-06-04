import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingBag, MapPin, Trash2, Heart, Pencil, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { addMockOrder } from '@/lib/catalog';
import { appendInvoice, getInvoicesForCustomer } from '@/lib/invoices';
import { notifyAdminNewOrder } from '@/lib/adminOrderNotifications';
import { notifyAdminPromoCodeUse } from '@/lib/adminPromoCodeNotifications';
import { CartProductImage } from '@/components/CartProductImage';
import {
  CATALOG_IMAGES_HYDRATED_EVENT,
  persistableCartImage,
  prefetchCartProductImages,
  resolveStoredLineImage,
} from '@/lib/catalogImages';
import CurrencyIcon from '@/components/CurrencyIcon';
import { getProductById, getSectionIdForProduct } from '@/lib/products';
import { useMergedCatalog } from '@/hooks/useMergedCatalog';
import {
  cartLineId,
  cartVariantKey,
  getPriceForMode,
  normalizeCartVariant,
  resolveCartItemName,
  saleModePurchaseLabel,
} from '@/lib/productSaleModes';
import { readWishlist, WISHLIST_CHANGED, WISHLIST_KEY } from '@/lib/wishlist';
import { CartLineProductHeading } from '@/components/ProductSaleModeBadge';
import { sectionBonusFreeLineLabel } from '@/lib/sectionBonus';
import AddAddressDialog from '@/components/AddAddressDialog';
import SelectDeliveryAddressDialog from '@/components/SelectDeliveryAddressDialog';
import CheckoutOrderSuccess from '@/components/checkout/CheckoutOrderSuccess';
import {
  CUSTOMER_ADDRESSES_CHANGED,
  readCustomerAddresses,
  readSelectedAddressId,
  type CustomerDeliveryAddress,
} from '@/lib/customerAddresses';
import {
  readLastOrderStorePath,
  saveLastOrderStorePath,
  storeProductsPath,
  storeProductsPathFromCart,
} from '@/lib/storeNav';
import PromoCodeInput from '@/components/PromoCodeInput';
import {
  recordInfluencerCodeUse,
  tryApplyInfluencerCode,
  type AppliedInfluencerCode,
} from '@/lib/influencerCodes';
import { formatNumber } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';

type CheckoutSuggestProduct = {
  id: number;
  name: { en: string; ar: string };
  price: number;
  image: string;
  category: string;
  inStock?: boolean;
};

function CheckoutSuggestProductCard({
  product: p,
  language,
  currencyTitle,
  onAdd,
  addLabel,
  soldOutLabel,
  boxed,
}: {
  product: CheckoutSuggestProduct;
  language: 'en' | 'ar';
  currencyTitle: string;
  onAdd: (p: CheckoutSuggestProduct) => void;
  addLabel: string;
  soldOutLabel: string;
  boxed?: boolean;
}) {
  const inStock = p.inStock !== false;
  const title = p.name[language];

  if (boxed) {
    return (
      <article
        className="checkout-suggest-box group flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card text-start shadow-sm transition-all duration-300 hover:border-primary/35 hover:shadow-md dark:hover:border-accent/40"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <Link
          to={`/product/${p.id}`}
          className="relative block aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted/30"
        >
          <CartProductImage
            productId={p.id}
            image={p.image}
            alt={title}
            allowPlaceholder={false}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-3 sm:p-3.5">
          <Link to={`/product/${p.id}`} className="min-h-[2.75rem] hover:text-primary">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{title}</h3>
          </Link>
          <p className="text-base font-bold text-primary" dir="ltr">
            {p.price}{' '}
            <CurrencyIcon className="inline-block h-4 w-4 align-[-2px]" title={currencyTitle} />
          </p>
          <Button
            type="button"
            size="sm"
            className="btn-primary mt-auto h-10 w-full gap-1.5 text-xs sm:text-sm"
            disabled={!inStock}
            onClick={() => onAdd(p)}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
            {inStock ? addLabel : soldOutLabel}
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article
      className="checkout-suggest-card flex w-[min(72vw,10.75rem)] shrink-0 snap-center flex-col gap-2 rounded-xl border border-border/50 bg-card/80 p-2.5 text-start shadow-sm"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Link
        to={`/product/${p.id}`}
        className="relative mx-auto aspect-square w-full max-w-[7.5rem] overflow-hidden rounded-lg border border-border/40 bg-muted/30"
      >
        <CartProductImage
          productId={p.id}
          image={p.image}
          alt={title}
          className="h-full w-full p-1.5"
        />
      </Link>
      <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug text-foreground">{title}</h3>
      <p className="text-sm font-semibold text-primary" dir="ltr">
        {p.price}{' '}
        <CurrencyIcon className="inline-block h-3.5 w-3.5 align-[-1px]" title={currencyTitle} />
      </p>
      <Button
        type="button"
        size="sm"
        className="btn-primary mt-auto h-9 w-full text-xs"
        disabled={!inStock}
        onClick={() => onAdd(p)}
      >
        {inStock ? addLabel : soldOutLabel}
      </Button>
    </article>
  );
}

function CheckoutSuggestProducts({
  products,
  language,
  currencyTitle,
  onAdd,
  addLabel,
  soldOutLabel,
  layout = 'rail',
}: {
  products: CheckoutSuggestProduct[];
  language: 'en' | 'ar';
  currencyTitle: string;
  onAdd: (p: CheckoutSuggestProduct) => void;
  addLabel: string;
  soldOutLabel: string;
  layout?: 'rail' | 'grid';
}) {
  if (products.length === 0) return null;

  if (layout === 'grid') {
    return (
      <div
        className={cn(
          'checkout-suggest-grid grid gap-3 sm:gap-4',
          products.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-2 lg:grid-cols-3',
        )}
      >
        {products.map((p) => (
          <CheckoutSuggestProductCard
            key={p.id}
            product={p}
            language={language}
            currencyTitle={currencyTitle}
            onAdd={onAdd}
            addLabel={addLabel}
            soldOutLabel={soldOutLabel}
            boxed
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="checkout-suggest-rail flex gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 pt-0.5 scroll-smooth snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
      dir="ltr"
    >
      {products.map((p) => (
        <CheckoutSuggestProductCard
          key={p.id}
          product={p}
          language={language}
          currencyTitle={currencyTitle}
          onAdd={onAdd}
          addLabel={addLabel}
          soldOutLabel={soldOutLabel}
        />
      ))}
    </div>
  );
}

const Checkout: React.FC = () => {
  const GUEST_ADDRESS_KEY = 'med-addresses:guest';
  const GUEST_SELECTED_ADDRESS_KEY = 'med-selected-address:guest';
  const { language, setLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const { items, clearCart, addToCart, updateQuantity, removeFromCart, setCartOpen } = useCart();
  const { user, canAccessCatalog, grantedSectionIds } = useAuth();
  const { mergedSections } = useMergedCatalog();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || !canAccessCatalog) {
      navigate(user ? '/profile' : '/login', { replace: true, state: { from: '/checkout' } });
    }
  }, [user, canAccessCatalog, navigate]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addresses, setAddresses] = useState<CustomerDeliveryAddress[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [confirmOrderOpen, setConfirmOrderOpen] = useState(false);
  const [orderPlacedSuccess, setOrderPlacedSuccess] = useState(false);
  const [postOrderReturnPath, setPostOrderReturnPath] = useState('/');
  const orderRedirectDoneRef = useRef(false);
  const [wishlistTick, setWishlistTick] = useState(0);
  const [lastPurchaseTick, setLastPurchaseTick] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<AppliedInfluencerCode | null>(null);

  const promoCartLines = useMemo(
    () => items.map((item) => ({ id: item.id, price: item.price, quantity: item.quantity })),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items],
  );

  const displayItems = useMemo(() => {
    const liveById = new Map(mergedSections.flatMap((s) => s.products).map((p) => [p.id, p]));
    return items.map((item) => {
      const live = liveById.get(item.id);
      if (!live?.image) return item;
      return { ...item, image: persistableCartImage(item.id, live.image) };
    });
  }, [items, mergedSections]);

  useEffect(() => {
    if (displayItems.length === 0) return;
    void prefetchCartProductImages(displayItems.map((i) => i.id));
  }, [displayItems]);

  const lastPurchaseLines = useMemo(() => {
    void lastPurchaseTick;
    const invs = getInvoicesForCustomer(user?.email, user?.username);
    const last = invs[0];
    if (!last?.items?.length) return [];
    return last.items.slice(0, 6).map((li) => {
      const prod = getProductById(li.id);
      const name = prod ? prod.name[language] : li.name;
      return {
        id: li.id,
        name,
        image: resolveStoredLineImage(li.id, li.image),
        price: li.price,
        qty: li.qty || 1,
      };
    });
  }, [user?.email, user?.username, language, lastPurchaseTick]);

  useEffect(() => {
    if (lastPurchaseLines.length === 0) return;
    void prefetchCartProductImages(lastPurchaseLines.map((l) => l.id));
  }, [lastPurchaseLines]);

  useEffect(() => {
    const bump = () => setLastPurchaseTick((t) => t + 1);
    window.addEventListener(CATALOG_IMAGES_HYDRATED_EVENT, bump);
    return () => window.removeEventListener(CATALOG_IMAGES_HYDRATED_EVENT, bump);
  }, []);

  const sectionTitleById = useMemo(() => {
    const map = new Map<string, { en: string; ar: string }>();
    for (const sec of mergedSections) {
      map.set(sec.id, sec.title);
    }
    return map;
  }, [mergedSections]);

  const orderPricing = useMemo(() => {
    if (!appliedPromo) {
      return {
        subtotal,
        eligibleSubtotal: 0,
        discountAmount: 0,
        total: subtotal,
        code: null as AppliedInfluencerCode['code'] | null,
      };
    }
    const result = tryApplyInfluencerCode(appliedPromo.code.code, promoCartLines);
    if (!result.ok) {
      return { subtotal, eligibleSubtotal: 0, discountAmount: 0, total: subtotal, code: null };
    }
    return {
      subtotal: result.applied.subtotal,
      eligibleSubtotal: result.applied.eligibleSubtotal,
      discountAmount: result.applied.discountAmount,
      total: result.applied.total,
      code: result.applied.code,
    };
  }, [subtotal, promoCartLines, appliedPromo]);

  useEffect(() => {
    if (!appliedPromo) return;
    const result = tryApplyInfluencerCode(appliedPromo.code.code, promoCartLines);
    if (!result.ok) {
      setAppliedPromo(null);
      return;
    }
    if (
      result.applied.discountAmount !== appliedPromo.discountAmount ||
      result.applied.total !== appliedPromo.total ||
      result.applied.eligibleSubtotal !== appliedPromo.eligibleSubtotal
    ) {
      setAppliedPromo(result.applied);
    }
  }, [promoCartLines, appliedPromo?.code.code, appliedPromo?.discountAmount, appliedPromo?.total, appliedPromo?.eligibleSubtotal]);

  const refreshAddresses = useCallback(() => {
    setAddresses(readCustomerAddresses(user));
    setSelectedAddressId(readSelectedAddressId(user));
  }, [user]);

  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses, location.pathname, location.key]);

  useEffect(() => {
    const onChanged = () => refreshAddresses();
    window.addEventListener(CUSTOMER_ADDRESSES_CHANGED, onChanged);
    return () => window.removeEventListener(CUSTOMER_ADDRESSES_CHANGED, onChanged);
  }, [refreshAddresses]);

  // Keep selection in sync if user changes it from header (storage event)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      const selKey = user?.email ? `med-selected-address:${user?.email}` : GUEST_SELECTED_ADDRESS_KEY;
      if (e.key === selKey) {
        setSelectedAddressId(e.newValue || '');
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [user?.email]);

  useEffect(() => {
    const bump = () => setWishlistTick((t) => t + 1);
    window.addEventListener(WISHLIST_CHANGED, bump);
    const onStorage = (e: StorageEvent) => {
      if (e.key === WISHLIST_KEY || e.key === null) bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WISHLIST_CHANGED, bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const hasSelectedAddress = useMemo(() => {
    if (!selectedAddressId) return false;
    return addresses.some((a) => a.id === selectedAddressId);
  }, [addresses, selectedAddressId]);

  // Notes and address management removed to keep checkout minimal

  const saveInvoice = () => {
    try {
      const invoice = {
        id: Math.random().toString(36).slice(2, 8).toUpperCase(),
        createdAt: Date.now(),
        items: items.map((i) => ({
          id: i.id,
          name: i.name.en,
          qty: i.quantity,
          price: i.price,
          variant: normalizeCartVariant(i.variantName),
          image: persistableCartImage(i.id, i.image),
        })),
        total: orderPricing.total,
        subtotal: orderPricing.subtotal,
        discountAmount: orderPricing.discountAmount > 0 ? orderPricing.discountAmount : undefined,
        discountCode: orderPricing.code?.code,
        influencerName: orderPricing.code?.influencerName,
        customerEmail: user?.email?.trim().toLowerCase(),
        customerUsername: user?.username?.trim().toLowerCase(),
        customerName: user?.name?.trim() || undefined,
        status: 'pending' as const,
        paymentMethod: 'cod' as const,
      };
      appendInvoice(invoice);
      notifyAdminNewOrder(invoice);
      if (invoice.discountCode) {
        recordInfluencerCodeUse(invoice.discountCode);
        notifyAdminPromoCodeUse({
          useId: invoice.id,
          code: invoice.discountCode,
          influencerName: invoice.influencerName,
          discountAmount: invoice.discountAmount ?? 0,
          orderTotal: invoice.total,
          customerName: invoice.customerName,
          customerUsername: invoice.customerUsername,
          createdAt: invoice.createdAt,
        });
      }
    } catch {}
  };

  const resolveStoreReturnPath = useCallback(() => {
    const fallback = storeProductsPath(grantedSectionIds, { catalogUnlocked: canAccessCatalog });
    const saved = postOrderReturnPath || readLastOrderStorePath() || fallback;
    if (saved.startsWith('/products/')) return saved;
    return fallback.startsWith('/products/') ? fallback : '/';
  }, [postOrderReturnPath, grantedSectionIds, canAccessCatalog]);

  const continueAfterOrderSuccess = useCallback(() => {
    if (orderRedirectDoneRef.current) return;
    orderRedirectDoneRef.current = true;
    setOrderPlacedSuccess(false);
    setCartOpen(false);
    navigate(resolveStoreReturnPath(), { replace: true });
  }, [navigate, resolveStoreReturnPath, setCartOpen]);

  useEffect(() => {
    if (!orderPlacedSuccess) {
      orderRedirectDoneRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => continueAfterOrderSuccess(), 2800);
    return () => window.clearTimeout(timer);
  }, [orderPlacedSuccess, continueAfterOrderSuccess]);

  const finalizeOrder = () => {
    const returnPath = storeProductsPathFromCart(items, grantedSectionIds, {
      catalogUnlocked: canAccessCatalog,
    });
    setPostOrderReturnPath(returnPath);
    saveLastOrderStorePath(returnPath);
    orderRedirectDoneRef.current = false;
    saveInvoice();
    recordOrder();
    clearCart();
    setAppliedPromo(null);
    setCartOpen(false);
    setConfirmOrderOpen(false);
    setOrderPlacedSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const recordOrder = () => {
    try {
      const selKey = user?.email ? `med-selected-address:${user.email}` : GUEST_SELECTED_ADDRESS_KEY;
      let effectiveId = selectedAddressId;
      try {
        effectiveId = (selKey && localStorage.getItem(selKey)) || selectedAddressId;
      } catch {}
      const chosen = addresses.find(a => a.id === effectiveId);
      const order = {
        id: Math.random().toString(36).slice(2, 10).toUpperCase(),
        time: Date.now(),
        customerName: user?.name,
        email: user?.email,
        phone: (user as any)?.phone,
        city: chosen?.city,
        address: chosen?.details,
        items: items.map(i => ({
          productId: i.id,
          name: i.name,
          qty: i.quantity,
          price: i.price,
          category: i.category,
          image: i.image,
          variant: normalizeCartVariant(i.variantName),
          variantLabel: saleModePurchaseLabel(normalizeCartVariant(i.variantName), language),
        })),
        total: orderPricing.total,
        subtotal: orderPricing.subtotal,
        discountAmount: orderPricing.discountAmount > 0 ? orderPricing.discountAmount : undefined,
        discountCode: orderPricing.code?.code,
      };
      addMockOrder(order);
    } catch {}
  };

  const texts = {
    en: {
      checkout: 'Checkout',
      backToHome: 'Back to Home',
      orderSummary: 'Order Summary',
      deliveryInfo: 'Account Information',
      paymentNote: 'Payment: cash on delivery when your order arrives',
      confirmTitle: 'Are you sure you want to purchase?',
      confirmDesc: 'Your order will be registered after you confirm.',
      orderSuccessTitle: 'Order placed',
      orderSuccessSubtitle: 'Thank you. Your order has been registered — returning you to the store…',
      continueShopping: 'Continue shopping',
      confirmItems: 'Items',
      confirmTotal: 'Total',
      confirmDeliverTo: 'Deliver to',
      confirmCancel: 'Go back',
      confirmSubmit: 'Yes, place order',
      selectAddress: 'Delivery Address',
      notes: 'Order Notes (Optional)',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      currency: 'JOD',
      placeOrder: 'Place Order',
      processing: 'Processing...',
      required: 'This field is required',
      items: 'items',
      orderSuccess: 'Order placed successfully!',
      orderError: 'Please fill in all required fields',
      addNewAddress: 'Add New Address',
      addressLabel: 'Label (e.g., Home)',
      addressCity: 'City (optional)',
      addressDetails: 'Details',
      selectCity: 'Select city (optional)',
      addressPlaceholder: 'Area - Street - Notes',
      saveAddress: 'Save Address',
      cancel: 'Cancel',
      selectAddressRequired: 'Please select a delivery address',
      noAddressSelected: 'You must select a delivery address to continue',
      changeAddress: 'Change address',
      useMap: 'Use Map',
      selectOnMap: 'Select on Map',
      mapInstructions: 'Click on the map or drag the marker to select your location',
      wishlistTitle: 'From your wishlist',
      wishlistViewAll: 'View all',
      addToCart: 'Add',
      soldOut: 'Out of stock',
    },
    ar: {
      checkout: 'إتمام الطلب',
      backToHome: 'العودة للصفحة الرئيسية',
      orderSummary: 'ملخص الطلب',
      deliveryInfo: 'معلومات الحساب',
      paymentNote: 'الدفع: عند الاستلام نقداً عند وصول الطلب',
      confirmTitle: 'هل أنت متأكد من الشراء؟',
      confirmDesc: 'سيتم تسجيل طلبك بعد التأكيد.',
      orderSuccessTitle: 'تم الطلب',
      orderSuccessSubtitle: 'شكراً لك. تم تسجيل طلبك — سنعيدك للمتجر الآن…',
      continueShopping: 'متابعة التسوق',
      confirmItems: 'المنتجات',
      confirmTotal: 'المجموع',
      confirmDeliverTo: 'التوصيل إلى',
      confirmCancel: 'رجوع',
      confirmSubmit: 'نعم، تأكيد الطلب',
      selectAddress: 'عنوان التوصيل',
      notes: 'ملاحظات الطلب (اختياري)',
      total: 'المجموع',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      currency: 'د.أ',
      placeOrder: 'تأكيد الطلب',
      processing: 'جارٍ المعالجة...',
      required: 'هذا الحقل مطلوب',
      items: 'قطعة',
      orderSuccess: 'تم تأكيد الطلب بنجاح!',
      orderError: 'يرجى ملء جميع الحقول المطلوبة',
      addNewAddress: 'إضافة عنوان جديد',
      addressLabel: 'التسمية (مثال: المنزل)',
      addressCity: 'المدينة (اختياري)',
      addressDetails: 'التفاصيل',
      selectCity: 'اختر المدينة (اختياري)',
      addressPlaceholder: 'المنطقة - الشارع - ملاحظات',
      saveAddress: 'حفظ العنوان',
      cancel: 'إلغاء',
      selectAddressRequired: 'يرجى اختيار عنوان التوصيل',
      noAddressSelected: 'يجب اختيار عنوان التوصيل للمتابعة',
      changeAddress: 'تغيير العنوان',
      useMap: 'استخدام الخريطة',
      selectOnMap: 'اختيار على الخريطة',
      mapInstructions: 'انقر على الخريطة أو اسحب العلامة لتحديد موقعك',
      wishlistTitle: 'من المفضلة',
      wishlistViewAll: 'عرض الكل',
      addToCart: 'أضف',
      soldOut: 'غير متوفر',
    }
  };

  // No form inputs in simplified checkout

  // Map selection removed in simplified checkout

  // Address creation removed in simplified checkout

  // No validation needed beyond having items
  const validateForm = () => true;

  const openOrderConfirm = () => {
    if (!hasSelectedAddress) {
      toast.error(texts[language].selectAddressRequired);
      setAddressDialogOpen(true);
      return;
    }
    if (items.length === 0) return;
    setConfirmOrderOpen(true);
  };

  const confirmPlaceOrder = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      finalizeOrder();
    } finally {
      setIsLoading(false);
    }
  };

  const isRtl = language === 'ar';

  const chosenAddress = useMemo(() => {
    const selKey = user?.email ? `med-selected-address:${user.email}` : GUEST_SELECTED_ADDRESS_KEY;
    let effectiveId = selectedAddressId;
    try {
      effectiveId = (selKey && localStorage.getItem(selKey)) || selectedAddressId;
    } catch {}
    return addresses.find((a) => a.id === effectiveId);
  }, [addresses, selectedAddressId, user?.email]);

  const openAddressPicker = () => setAddressPickerOpen(true);

  const wishlistPicks = useMemo(() => {
    const inCartIds = new Set(items.map((i) => i.id));
    return readWishlist()
      .filter((w) => !inCartIds.has(w.id))
      .slice(0, 8)
      .map((w) => {
        const live = getProductById(w.id);
        if (live) {
          return {
            id: w.id,
            name: live.name,
            image: persistableCartImage(w.id, live.image),
            price: getPriceForMode(live, 'box'),
            category: live.category,
            inStock: live.inStock !== false,
          };
        }
        return {
          id: w.id,
          name: w.name,
          image: persistableCartImage(w.id, w.image),
          price: w.price,
          category: w.category,
          inStock: true,
        };
      });
  }, [items, wishlistTick]);

  useEffect(() => {
    const ids = [
      ...wishlistPicks.map((p) => p.id),
    ];
    if (ids.length) void prefetchCartProductImages(ids);
  }, [wishlistPicks]);

  const sameSectionSuggestions = useMemo(() => {
    const inCartIds = new Set(items.map((i) => i.id));
    const inCartSectionIds = new Set(
      items
        .map((i) => getSectionIdForProduct(i.id))
        .filter((sid): sid is string => Boolean(sid)),
    );
    if (inCartSectionIds.size === 0) {
      return { heading: '', products: [] as (typeof wishlistPicks) };
    }

    const products = mergedSections
      .filter((sec) => inCartSectionIds.has(sec.id))
      .flatMap((sec) =>
        sec.products
          .filter((p) => !inCartIds.has(p.id) && p.inStock !== false)
          .map((p) => {
            const live = getProductById(p.id);
            return {
              id: p.id,
              name: live?.name ?? p.name,
              image: persistableCartImage(p.id, live?.image ?? p.image),
              price: live ? getPriceForMode(live, 'box') : p.price,
              category: live?.category ?? p.category,
              inStock: (live?.inStock ?? p.inStock) !== false,
            };
          }),
      )
      .slice(0, 6);

    let heading: string;
    if (inCartSectionIds.size === 1) {
      const secId = [...inCartSectionIds][0];
      const sec = mergedSections.find((s) => s.id === secId);
      const secName = sec?.title[language] || sec?.title.en || '';
      heading =
        language === 'ar'
          ? secName
            ? `منتجات أخرى من ${secName}`
            : 'من نفس القسم'
          : secName
            ? `More from ${secName}`
            : 'From the same section';
    } else {
      heading = language === 'ar' ? 'منتجات من نفس أقسام طلبك' : 'More from your order sections';
    }

    return { heading, products };
  }, [items, mergedSections, language]);

  useEffect(() => {
    const ids = sameSectionSuggestions.products.map((p) => p.id);
    if (ids.length) void prefetchCartProductImages(ids);
  }, [sameSectionSuggestions.products]);

  const addWishlistToCart = (p: (typeof wishlistPicks)[number]) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      category: p.category,
      variantName: cartVariantKey('box'),
    });
    toast.success(language === 'ar' ? 'تمت الإضافة للسلة' : 'Added to cart');
  };

  if (items.length === 0 && !orderPlacedSuccess) {
    return (
      <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
        <Header language={language} onLanguageChange={setLanguage} />
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-4">
              {language === 'en' ? 'Your cart is empty' : 'سلة التسوق فارغة'}
            </h2>
            <Button onClick={() => navigate('/')}>
              {texts[language].backToHome}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <Header language={language} onLanguageChange={setLanguage} isStatic />

      {orderPlacedSuccess ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 px-4 backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <CheckoutOrderSuccess
            language={language}
            title={texts[language].orderSuccessTitle}
            subtitle={texts[language].orderSuccessSubtitle}
            continueLabel={texts[language].continueShopping}
            onContinue={continueAfterOrderSuccess}
          />
        </div>
      ) : null}

      <div
        className={cn(
          'container relative mx-auto max-w-6xl px-4 pb-10 pt-20 sm:pt-24',
          orderPlacedSuccess && 'pointer-events-none select-none opacity-0',
        )}
        aria-hidden={orderPlacedSuccess}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {texts[language].backToHome}
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gradient tracking-normal w-full max-w-full break-words">
            {texts[language].checkout}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {language === 'en'
              ? 'Review your items (by box or by unit) and choose how to pay'
              : 'راجع المنتجات (بالبوكس أو بالحبة) واختر طريقة الدفع'}
          </p>
        </motion.div>

        <div className="checkout-layout grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <motion.aside
            initial={{ opacity: 0, x: isRtl ? -24 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            className="checkout-sidebar order-1 lg:order-2 lg:col-span-1"
          >
            <div className="checkout-sidebar__inner space-y-4">
              {!hasSelectedAddress ? (
                <Card className="border-primary/30 shadow-md">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-2 text-start">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {language === 'en' ? 'Delivery address' : 'عنوان التوصيل'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{texts[language].noAddressSelected}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setAddressDialogOpen(true)}
                      className="btn-primary h-11 w-full"
                    >
                      {language === 'ar' ? 'إضافة عنوان' : 'Add Address'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-primary/30 shadow-md">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-start gap-2 text-start">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">
                            {language === 'en' ? 'Delivery address' : 'عنوان التوصيل'}
                          </p>
                          <p className="mt-1 text-sm font-semibold leading-snug">
                            {chosenAddress?.label || chosenAddress?.details || ''}
                            {chosenAddress?.city ? ` • ${chosenAddress.city}` : ''}
                          </p>
                          {chosenAddress?.details ? (
                            <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{chosenAddress.details}</p>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 gap-1 px-2 text-xs"
                        onClick={openAddressPicker}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                        {texts[language].changeAddress}
                      </Button>
                    </div>
                    {orderPricing.discountAmount > 0 ? (
                      <div className="flex items-center justify-between text-sm text-emerald-700 dark:text-emerald-300">
                        <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
                        <span className="tabular-nums">−{formatNumber(orderPricing.discountAmount)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3">
                      <span className="text-sm text-muted-foreground">
                        {language === 'en' ? 'Order total' : 'المجموع'}
                      </span>
                      <span className="text-xl font-bold text-primary tabular-nums">
                        {formatNumber(orderPricing.total)}{' '}
                        <CurrencyIcon className="inline-block h-5 w-5 align-[-2px]" title={texts[language].currency} />
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-start">{texts[language].paymentNote}</p>
                    <Button
                      type="button"
                      onClick={openOrderConfirm}
                      className="btn-primary h-12 w-full text-base font-semibold"
                      size="lg"
                      disabled={isLoading || !hasSelectedAddress}
                    >
                      {isLoading ? texts[language].processing : texts[language].placeOrder}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.aside>

          <motion.div
            initial={{ opacity: 0, x: isRtl ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            className="checkout-main order-2 lg:order-1 lg:col-span-2"
          >
            <Card className="shadow-xl border-primary/40 ring-1 ring-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-3 text-start">
                  <span className="min-w-0">{texts[language].orderSummary}</span>
                  <Badge variant="secondary" className="font-normal">
                    {items.length} {texts[language].items}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y rounded-lg border bg-card/60 backdrop-blur">
                  {displayItems.map((item) => (
                    <div key={cartLineId(item)} className="flex items-center gap-3 p-3 sm:gap-4">
                      <div className="checkout-line-image relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl border border-border/50 bg-muted/30 sm:h-20 sm:w-20">
                        <CartProductImage
                          productId={item.id}
                          image={item.image}
                          alt={resolveCartItemName(item.name, language)}
                          className="h-full w-full p-1.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CartLineProductHeading
                          name={item.name}
                          variantName={item.variantName}
                          language={language}
                        />
                        {item.isSectionBonusFree ? (
                          <Badge variant="secondary" className="mt-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100">
                            {sectionBonusFreeLineLabel(item.variantName, language)}
                          </Badge>
                        ) : null}
                        <div className="mt-1 flex items-center gap-3">
                          {item.isSectionBonusFree ? (
                            <span className="text-sm text-muted-foreground">× {item.quantity}</span>
                          ) : (
                            <>
                              <div className="inline-flex items-center border rounded-md overflow-hidden">
                                <button
                                  className="px-2 py-1 text-sm hover:bg-secondary"
                                  onClick={() =>
                                    updateQuantity(
                                      item.id,
                                      Math.max(1, item.quantity - 1),
                                      item.variantName,
                                      item.isSectionBonusFree,
                                    )
                                  }
                                  aria-label={language === 'en' ? 'Decrease' : 'إنقاص'}
                                >
                                  −
                                </button>
                                <span className="px-3 py-1 text-sm min-w-[2rem] text-center">{item.quantity}</span>
                                <button
                                  className="px-2 py-1 text-sm hover:bg-secondary"
                                  onClick={() =>
                                    updateQuantity(item.id, item.quantity + 1, item.variantName, item.isSectionBonusFree)
                                  }
                                  aria-label={language === 'en' ? 'Increase' : 'زيادة'}
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-xs md:text-sm text-muted-foreground">
                                × {item.price}{' '}
                                <CurrencyIcon
                                  className="inline-block h-3.5 w-3.5 align-[-1px]"
                                  title={texts[language].currency}
                                />
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm md:text-base font-semibold whitespace-nowrap">
                          {item.isSectionBonusFree ? (
                            <span className="text-emerald-700 dark:text-emerald-300">
                              {language === 'ar' ? 'مجاناً' : 'Free'}
                            </span>
                          ) : (
                            <>
                              {item.quantity * item.price}{' '}
                              <CurrencyIcon
                                className="inline-block h-3.5 w-3.5 align-[-1px]"
                                title={texts[language].currency}
                              />
                            </>
                          )}
                        </div>
                        <button
                          className="p-2 rounded-md hover:bg-secondary text-destructive"
                          onClick={() => removeFromCart(item.id, item.variantName, item.isSectionBonusFree)}
                          aria-label={language === 'en' ? 'Remove' : 'حذف'}
                          title={language === 'en' ? 'Remove' : 'حذف'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-primary/5 p-4 border border-primary/30 space-y-2">
                  {items.some((i) => i.isSectionBonusFree) ? (
                    <div className="space-y-2 text-sm text-emerald-800 dark:text-emerald-200">
                      <p className="font-medium text-start">
                        {language === 'ar' ? 'بونص القسم (مجاناً)' : 'Section bonus (free)'}
                      </p>
                      <ul className="space-y-1.5 border-t border-emerald-500/20 pt-2">
                        {items
                          .filter((i) => i.isSectionBonusFree)
                          .map((item) => (
                            <li
                              key={cartLineId(item)}
                              className="flex items-start justify-between gap-3 text-start"
                            >
                              <span className="min-w-0 flex-1 truncate font-medium text-foreground/90">
                                {resolveCartItemName(item.name, language)}
                              </span>
                              <span className="shrink-0 whitespace-nowrap">
                                × {item.quantity}{' '}
                                {sectionBonusFreeLineLabel(item.variantName, language)}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ) : null}
                  <PromoCodeInput
                    language={language}
                    cartLines={promoCartLines}
                    applied={appliedPromo}
                    onApplied={setAppliedPromo}
                    sectionTitleById={sectionTitleById}
                  />
                  {orderPricing.discountAmount > 0 ? (
                    <>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{texts[language].subtotal}</span>
                        <span>
                          {formatNumber(orderPricing.subtotal)}{' '}
                          <CurrencyIcon className="inline-block h-3.5 w-3.5 align-[-2px]" title={texts[language].currency} />
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-emerald-700 dark:text-emerald-300">
                        <span>
                          {texts[language].discount}
                          {orderPricing.code ? (
                            <span className="ms-1 font-mono text-xs" dir="ltr">
                              ({orderPricing.code.code})
                            </span>
                          ) : null}
                        </span>
                        <span>
                          −{formatNumber(orderPricing.discountAmount)}{' '}
                          <CurrencyIcon className="inline-block h-3.5 w-3.5 align-[-2px]" title={texts[language].currency} />
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between items-center text-base font-medium">
                    <span>{texts[language].total}</span>
                    <span className="text-primary font-semibold">
                      {formatNumber(orderPricing.total)}{' '}
                      <CurrencyIcon className="inline-block h-4 w-4 align-[-2px]" title={texts[language].currency} />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {wishlistPicks.length > 0 && (
              <Card className="mt-6 shadow-md border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-base text-start">
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Heart className="h-4 w-4 shrink-0 text-primary" />
                      {texts[language].wishlistTitle}
                    </span>
                    <Link
                      to="/wishlist"
                      className="shrink-0 text-xs font-normal text-primary hover:underline"
                    >
                      {texts[language].wishlistViewAll}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 sm:px-4">
                  <CheckoutSuggestProducts
                    products={wishlistPicks}
                    language={language}
                    currencyTitle={texts[language].currency}
                    onAdd={addWishlistToCart}
                    addLabel={texts[language].addToCart}
                    soldOutLabel={texts[language].soldOut}
                  />
                </CardContent>
              </Card>
            )}

            {sameSectionSuggestions.products.length > 0 ? (
              <Card className="mt-6 overflow-hidden border-border/60 shadow-md">
                <CardHeader className="border-b border-border/40 bg-muted/20 pb-3">
                  <CardTitle className="text-start text-base font-semibold sm:text-lg">
                    {sameSectionSuggestions.heading}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 py-4 sm:px-5 sm:py-5">
                  <CheckoutSuggestProducts
                    layout="grid"
                    products={sameSectionSuggestions.products}
                    language={language}
                    currencyTitle={texts[language].currency}
                    onAdd={(p) =>
                      addToCart({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        image: p.image,
                        category: p.category,
                        variantName: cartVariantKey('box'),
                      })
                    }
                    addLabel={language === 'ar' ? 'أضف للسلة' : 'Add to cart'}
                    soldOutLabel={texts[language].soldOut}
                  />
                </CardContent>
              </Card>
            ) : null}

            <div className="mt-6">
              <Card className="border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-start">
                    {language === 'ar' ? 'آخر ما اشتريته' : 'Last purchase'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-start">
                  {lastPurchaseLines.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'لا يوجد أشياء من قبل' : 'No previous items'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {lastPurchaseLines.map((li) => (
                        <div key={`${li.id}-${li.name}`} className="flex items-center gap-3 rounded-lg border p-2">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border/50 bg-muted/30">
                            <CartProductImage
                              productId={li.id}
                              image={li.image}
                              alt={li.name}
                              allowPlaceholder={false}
                              className="h-full w-full object-cover p-0"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{li.name}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {li.qty} × {li.price}{' '}
                              <CurrencyIcon
                                className="inline-block h-3.5 w-3.5 align-[-1px]"
                                title={texts[language].currency}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        <Dialog open={confirmOrderOpen} onOpenChange={setConfirmOrderOpen}>
          <DialogContent className="max-w-md gap-0 p-0" dir={isRtl ? 'rtl' : 'ltr'} animation="reduced">
            <DialogHeader className="space-y-2 border-b border-border/60 px-5 py-4 text-start">
              <DialogTitle>{texts[language].confirmTitle}</DialogTitle>
              <DialogDescription>{texts[language].confirmDesc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 px-5 py-4 text-start text-sm">
              {chosenAddress ? (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">{texts[language].confirmDeliverTo}</p>
                  <p className="mt-1 font-semibold">
                    {chosenAddress.label}
                    {chosenAddress.city ? ` • ${chosenAddress.city}` : ''}
                  </p>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{texts[language].confirmTotal}</span>
                <span className="text-lg font-bold text-primary tabular-nums">
                  {formatNumber(orderPricing.total)}{' '}
                  <CurrencyIcon className="inline-block h-4 w-4 align-[-2px]" title={texts[language].currency} />
                </span>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse gap-2 border-t border-border/60 px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOrderOpen(false)}
                disabled={isLoading}
              >
                {texts[language].confirmCancel}
              </Button>
              <Button
                type="button"
                className="btn-primary gap-2"
                onClick={() => void confirmPlaceOrder()}
                disabled={isLoading}
              >
                {isLoading ? texts[language].processing : texts[language].confirmSubmit}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SelectDeliveryAddressDialog
          layout="scroll"
          open={addressPickerOpen}
          onOpenChange={setAddressPickerOpen}
          language={language}
          user={user}
          selectedId={selectedAddressId}
          onSelected={(id) => {
            setSelectedAddressId(id);
            refreshAddresses();
          }}
          onAddNew={() => setAddressDialogOpen(true)}
        />
        <AddAddressDialog
          layout="scroll"
          open={addressDialogOpen}
          onOpenChange={setAddressDialogOpen}
          language={language}
          user={user}
          selectAsDelivery
          onSaved={(id) => {
            refreshAddresses();
            setSelectedAddressId(id);
          }}
        />
      </div>

      <Footer />
    </div>
  );
};

export default Checkout;
