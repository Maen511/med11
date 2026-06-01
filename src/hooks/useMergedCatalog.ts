import { useCallback, useEffect, useState } from 'react';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import { hydrateCatalogSections, parseCatalogImageRef, revokeHydratedCatalogImages } from '@/lib/catalogImages';
import { getCatalogSections } from '@/lib/catalog';
import { getMergedSections, mapCatalogSectionsToStore, type StoreSection } from '@/lib/products';
import { getProductPlaceholderImage } from '@/lib/productPlaceholders';
import { buildBioskinCatalog2026 } from '@/data/bioskinCatalog2026';
import type { CatalogSection } from '@/lib/catalog';

function sectionsForFastPaint(dynamic: CatalogSection[]) {
  return mapCatalogSectionsToStore(
    dynamic.map((sec) => ({
      ...sec,
      products: sec.products.map((p) => ({
        ...p,
        image:
          parseCatalogImageRef(p.image) !== null ? getProductPlaceholderImage(p.id) : p.image,
      })),
    })),
  );
}

export function useMergedCatalog() {
  const [revision, setRevision] = useState(0);
  const [mergedSections, setMergedSections] = useState<StoreSection[]>(() => getMergedSections());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    revokeHydratedCatalogImages();
    const dynamic = getCatalogSections();
    if (dynamic.length === 0) {
      setMergedSections(mapCatalogSectionsToStore(buildBioskinCatalog2026()));
      setLoading(false);
      return;
    }

    setMergedSections(sectionsForFastPaint(dynamic));
    setLoading(true);
    try {
      const hydrated = await hydrateCatalogSections(dynamic);
      setMergedSections(mapCatalogSectionsToStore(hydrated));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, revision]);

  useEffect(() => {
    const bump = () => setRevision((n) => n + 1);
    window.addEventListener(CATALOG_CHANGED_EVENT, bump);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'med-catalog') bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CATALOG_CHANGED_EVENT, bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const refresh = useCallback(() => setRevision((n) => n + 1), []);

  return { mergedSections, revision, refresh, loading };
}

export type { StoreSection };
