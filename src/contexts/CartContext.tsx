import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { persistableCartImage, prefetchCartProductImages, CATALOG_IMAGES_HYDRATED_EVENT } from '@/lib/catalogImages';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import { getProductById } from '@/lib/products';
import {
  cartLinesMatch,
  cartVariantKey,
  normalizeCartItemName,
  resolveCartLinePrice,
  resolveCartLineVariant,
} from '@/lib/productSaleModes';
import { reconcileSectionBonusLines, SECTION_BONUS_CHANGED } from '@/lib/sectionBonus';

interface CartItem {
  id: number;
  name: { en: string; ar: string };
  price: number;
  image: string;
  category: string;
  quantity: number;
  variantName?: string;
  variantImage?: string;
  /** حبة مجانية من عرض القسم (5+1) */
  isSectionBonusFree?: boolean;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toggleCartOpen: () => void;
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: number, variantName?: string, isSectionBonusFree?: boolean) => void;
  updateQuantity: (id: number, quantity: number, variantName?: string, isSectionBonusFree?: boolean) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function normalizeStoredCartLine(item: CartItem): CartItem {
  const live = getProductById(item.id);
  const product = live ?? item;
  const mode = resolveCartLineVariant(item, product);
  const variantName = cartVariantKey(mode);
  return {
    ...item,
    name: live?.name ?? normalizeCartItemName(item.name),
    image: persistableCartImage(item.id, live?.image ?? item.image),
    variantName,
    isSectionBonusFree: Boolean(item.isSectionBonusFree),
    price: resolveCartLinePrice(product, mode, item.isSectionBonusFree),
  };
}

function readCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem('med-cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: CartItem) => normalizeStoredCartLine(item));
  } catch {
    return [];
  }
}

function normalizeCartLine(item: CartItem): CartItem {
  return normalizeStoredCartLine(item);
}

function withBonusSync(items: CartItem[]): CartItem[] {
  return reconcileSectionBonusLines(items).map(normalizeCartLine);
}

const CartProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { canAccessCatalog } = useAuth();
  const { language } = useLanguage();
  const [items, setItems] = useState<CartItem[]>(() => withBonusSync(readCartFromStorage()));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setCartOpen = useCallback((open: boolean) => {
    setIsCartOpen(open);
  }, []);

  const toggleCartOpen = useCallback(() => {
    setIsCartOpen((o) => !o);
  }, []);

  useEffect(() => {
    if (canAccessCatalog) {
      setItems(withBonusSync(readCartFromStorage()));
    }
  }, [canAccessCatalog]);

  useEffect(() => {
    const onBonusChange = () => setItems((prev) => withBonusSync(prev));
    window.addEventListener(SECTION_BONUS_CHANGED, onBonusChange);
    return () => window.removeEventListener(SECTION_BONUS_CHANGED, onBonusChange);
  }, []);

  useEffect(() => {
    const refreshImages = () => setItems((prev) => prev.map(normalizeCartLine));
    window.addEventListener(CATALOG_CHANGED_EVENT, refreshImages);
    window.addEventListener(CATALOG_IMAGES_HYDRATED_EVENT, refreshImages);
    return () => {
      window.removeEventListener(CATALOG_CHANGED_EVENT, refreshImages);
      window.removeEventListener(CATALOG_IMAGES_HYDRATED_EVENT, refreshImages);
    };
  }, []);

  useEffect(() => {
    const ids = items.map((item) => item.id);
    if (ids.length === 0) return;
    void prefetchCartProductImages(ids);
  }, [items]);

  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem('med-cart', JSON.stringify(items));
      } catch {
        /* ignore quota */
      }
    };
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flush, 400);
    const onUnload = () => flush();
    window.addEventListener('beforeunload', onUnload);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      window.removeEventListener('beforeunload', onUnload);
      flush();
    };
  }, [items]);

  const addToCart = useCallback(
    (product: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
      if (!canAccessCatalog) {
        toast.error(
          language === 'ar'
            ? 'لا يمكنك إضافة منتجات للسلة حتى يمنحك المسؤول وصولاً للكتالوج'
            : 'You cannot add items until an admin grants you catalog access.',
        );
        return;
      }
      setItems((prevItems) => {
        const live = getProductById(product.id);
        const productInfo = live ?? product;
        const mode = resolveCartLineVariant(
          { variantName: product.variantName, price: product.price, isSectionBonusFree: false },
          productInfo,
        );
        const variantName = cartVariantKey(mode);
        const normalizedProduct = {
          ...product,
          name: normalizeCartItemName(product.name),
          image: persistableCartImage(product.id, product.image),
          variantName,
          isSectionBonusFree: false as const,
          price: resolveCartLinePrice(productInfo, mode, false),
        };
        const line = { id: product.id, variantName, isSectionBonusFree: false };
        const existingItem = prevItems.find((item) => cartLinesMatch(item, line));
        const next = existingItem
          ? prevItems.map((item) =>
              cartLinesMatch(item, line) ? { ...item, quantity: item.quantity + quantity } : item,
            )
          : [...prevItems, { ...normalizedProduct, quantity }];
        return withBonusSync(next);
      });
    },
    [canAccessCatalog, language],
  );

  const removeFromCart = useCallback((id: number, variantName?: string, isSectionBonusFree?: boolean) => {
    const line = { id, variantName, isSectionBonusFree };
    setItems((prevItems) => withBonusSync(prevItems.filter((item) => !cartLinesMatch(item, line))));
  }, []);

  const updateQuantity = useCallback(
    (id: number, quantity: number, variantName?: string, isSectionBonusFree?: boolean) => {
      const line = { id, variantName, isSectionBonusFree };
      if (quantity === 0) {
        setItems((prevItems) => withBonusSync(prevItems.filter((item) => !cartLinesMatch(item, line))));
        return;
      }
      setItems((prevItems) =>
        withBonusSync(
          prevItems.map((item) => (cartLinesMatch(item, line) ? { ...item, quantity } : item)),
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotalPrice = useCallback(() => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [items]);

  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const contextValue = useMemo(
    () => ({
      items,
      isCartOpen,
      setCartOpen,
      toggleCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
    }),
    [
      items,
      isCartOpen,
      setCartOpen,
      toggleCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
    ],
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CartProviderInner>{children}</CartProviderInner>
);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
