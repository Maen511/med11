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
};

export function CartProductImage({ productId, image, alt, className }: CartProductImageProps) {
  const placeholder = getProductPlaceholderImage(productId);
  const [src, setSrc] = useState(() => getCachedCatalogImage(productId) ?? placeholder);

  const load = useCallback(async () => {
    const cached = getCachedCatalogImage(productId);
    if (cached) {
      setSrc(cached);
      return;
    }
    const resolved = await resolveCartProductImage(productId, image);
    setSrc(resolved || placeholder);
  }, [productId, image, placeholder]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const cached = getCachedCatalogImage(productId);
      if (cached && !cancelled) {
        setSrc(cached);
        return;
      }
      const resolved = await resolveCartProductImage(productId, image);
      if (!cancelled) setSrc(resolved || placeholder);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, image, placeholder]);

  useEffect(() => {
    const onHydrated = () => {
      void load();
    };
    window.addEventListener(CATALOG_IMAGES_HYDRATED_EVENT, onHydrated);
    return () => window.removeEventListener(CATALOG_IMAGES_HYDRATED_EVENT, onHydrated);
  }, [load]);

  return (
    <img
      src={src}
      alt={alt}
      className={cn('object-cover', className)}
      loading="lazy"
      decoding="async"
      onError={() => setSrc(placeholder)}
    />
  );
}
