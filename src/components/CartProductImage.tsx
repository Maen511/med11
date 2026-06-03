import { useCallback, useEffect, useState } from 'react';
import {
  CATALOG_IMAGES_HYDRATED_EVENT,
  getCachedCatalogImage,
  resolveCartProductImage,
} from '@/lib/catalogImages';
import { getProductPlaceholderImage } from '@/lib/productPlaceholders';
import { cn } from '@/lib/utils';

type CartProductImageProps = {
  productId: number;
  image: string;
  alt: string;
  className?: string;
  /** When false, never show generic stock photos — only real catalog / BIOSKIN assets. */
  allowPlaceholder?: boolean;
};

export function CartProductImage({
  productId,
  image,
  alt,
  className,
  allowPlaceholder = true,
}: CartProductImageProps) {
  const placeholder = allowPlaceholder ? getProductPlaceholderImage(productId) : '';
  const resolveOpts = { allowPlaceholder };
  const [src, setSrc] = useState(() => getCachedCatalogImage(productId) ?? placeholder);

  const load = useCallback(async () => {
    const cached = getCachedCatalogImage(productId);
    if (cached) {
      setSrc(cached);
      return;
    }
    const resolved = await resolveCartProductImage(productId, image, resolveOpts);
    setSrc(resolved || placeholder);
  }, [productId, image, placeholder, allowPlaceholder]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cached = getCachedCatalogImage(productId);
      if (cached && !cancelled) {
        setSrc(cached);
        return;
      }
      const resolved = await resolveCartProductImage(productId, image, resolveOpts);
      if (!cancelled) setSrc(resolved || placeholder);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, image, placeholder, allowPlaceholder]);

  useEffect(() => {
    const onHydrated = () => {
      void load();
    };
    window.addEventListener(CATALOG_IMAGES_HYDRATED_EVENT, onHydrated);
    return () => window.removeEventListener(CATALOG_IMAGES_HYDRATED_EVENT, onHydrated);
  }, [load]);

  const onImgError = () => {
    if (!allowPlaceholder) {
      setSrc('');
      return;
    }
    const fallback = getProductPlaceholderImage(productId);
    if (src !== fallback) setSrc(fallback);
  };

  if (!src) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted/50 text-muted-foreground', className)}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-contain object-center', className)}
      loading="lazy"
      decoding="async"
      onError={onImgError}
    />
  );
}
