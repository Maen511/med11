import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { parseCatalogImageRef, resolveCatalogImage } from '@/lib/catalogImages';
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  ImageIcon,
  Loader2,
  FolderOpen,
  Package,
  Layers,
  ArrowLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  Table2,
} from 'lucide-react';
import AdminCatalogProductsView, { type CatalogViewMode } from '@/components/admin/AdminCatalogProductsView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { resolveSaleFlagsFromPrices } from '@/lib/productSaleModes';
import {
  type CatalogProduct,
  type CatalogSection,
  upsertProduct,
  deleteProduct,
  upsertSection,
  updateSection,
  deleteSection,
  normalizeSectionId,
  nextCatalogProductId,
} from '@/lib/catalog';
import {
  getRawCatalogProduct,
  prepareProductImageForSave,
  removeStoredProductImage,
} from '@/lib/catalogImages';
import { MAX_PRODUCT_IMAGE_MB, PRODUCT_IMAGE_ACCEPT, readProductImageFile } from '@/lib/productImage';
import { getLowStockThreshold, matchesStockFilter, type StockFilter } from '@/lib/inventory';
type Props = {
  language: 'en' | 'ar';
  sections: CatalogSection[];
  onReload: () => void;
};

function catalogSaveErrorMessage(
  isRtl: boolean,
  reason: 'quota_exceeded' | 'storage_error',
): string {
  if (reason === 'quota_exceeded') {
    return isRtl
      ? 'تعذر الحفظ: مساحة المتصفح ممتلئة. جرّب صورة أصغر أو احذف منتجات قديمة.'
      : 'Could not save: browser storage is full. Try a smaller image or remove old products.';
  }
  return isRtl ? 'تعذر حفظ التغييرات في الكتالوج' : 'Could not save catalog changes';
}

const sectionToCategory: Record<string, CatalogProduct['category']> = {
  perfumes: 'perfume',
  'all-over-spray': 'spray',
  'apparel-mist': 'apparel',
  'home-linen-mist': 'home',
  'scented-body-powder': 'powder',
  'incense-oil': 'oil',
};

const SECTION_CARD_TONES = [
  'bg-primary/10 text-primary',
  'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'bg-amber-500/10 text-amber-800 dark:text-amber-200',
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'bg-rose-500/10 text-rose-700 dark:text-rose-300',
  'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
] as const;

type PanelView = 'sections' | 'catalog';

const CATALOG_VIEW_KEY = 'med-admin-catalog-view';

const AdminProductsPanel = ({ language, sections, onReload }: Props) => {
  const isRtl = language === 'ar';
  const [view, setView] = useState<PanelView>('sections');
  const [catalogSectionId, setCatalogSectionId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addSectionId, setAddSectionId] = useState<string | null>(null);
  const [addDraft, setAddDraft] = useState<Partial<CatalogProduct>>({ rating: 4, stockCount: 20 });
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CatalogProduct | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<CatalogProduct>>({});
  const [sectionAddOpen, setSectionAddOpen] = useState(false);
  const [sectionEditOpen, setSectionEditOpen] = useState(false);
  const [sectionDeleteTarget, setSectionDeleteTarget] = useState<CatalogSection | null>(null);
  const [productDeleteTarget, setProductDeleteTarget] = useState<{
    sectionId: string;
    product: CatalogProduct;
  } | null>(null);
  const [sectionDraft, setSectionDraft] = useState({ id: '', titleAr: '', titleEn: '' });
  const [sectionEditOriginalId, setSectionEditOriginalId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogStockFilter, setCatalogStockFilter] = useState<StockFilter>('all');
  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>(() => {
    try {
      return localStorage.getItem(CATALOG_VIEW_KEY) === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  });

  const setCatalogView = (mode: CatalogViewMode) => {
    setCatalogViewMode(mode);
    try {
      localStorage.setItem(CATALOG_VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const totalProducts = useMemo(
    () => sections.reduce((sum, s) => sum + s.products.length, 0),
    [sections],
  );

  const active =
    (catalogSectionId ? sections.find((s) => s.id === catalogSectionId) : undefined) ?? sections[0];

  const openCatalog = (sectionId: string) => {
    setCatalogSectionId(sectionId);
    setCatalogSearch('');
    setCatalogStockFilter('all');
    setView('catalog');
  };

  const backToSections = () => {
    setCatalogSearch('');
    setCatalogStockFilter('all');
    setView('sections');
  };

  const catalogStockFilters: { id: StockFilter; labelEn: string; labelAr: string }[] = [
    { id: 'all', labelEn: 'All', labelAr: 'الكل' },
    { id: 'in_stock', labelEn: 'In stock', labelAr: 'متوفر' },
    { id: 'low', labelEn: 'Low stock', labelAr: 'مخزون منخفض' },
    { id: 'out', labelEn: 'Out of stock', labelAr: 'نفد' },
  ];

  const filteredCatalogProducts = useMemo(() => {
    if (!active) return [];
    const q = catalogSearch.trim().toLowerCase();
    return active.products.filter((p) => {
      const qty = p.stockCount ?? 0;
      if (!matchesStockFilter(qty, catalogStockFilter)) return false;
      if (!q) return true;
      return (
        p.name.en.toLowerCase().includes(q) ||
        p.name.ar.toLowerCase().includes(q) ||
        p.description.en.toLowerCase().includes(q) ||
        p.description.ar.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        String(p.price).includes(q)
      );
    });
  }, [active, catalogSearch, catalogStockFilter]);

  const catalogHasActiveFilters = catalogSearch.trim() !== '' || catalogStockFilter !== 'all';

  useEffect(() => {
    if (sections.length === 0) return;
    if (catalogSectionId && !sections.some((s) => s.id === catalogSectionId)) {
      setCatalogSectionId(null);
      setView('sections');
    }
  }, [sections, catalogSectionId]);

  const openAdd = (sectionId: string) => {
    setAddSectionId(sectionId);
    setAddDraft({ rating: 4, stockCount: 20 });
    setAddOpen(true);
  };

  const openEdit = (product: CatalogProduct) => {
    const raw = getRawCatalogProduct(product.id) ?? product;
    setEditTarget(product);
    setEditDraft({ ...product, image: raw.image });
    setEditOpen(true);
  };

  const openSectionAdd = () => {
    setSectionDraft({ id: '', titleAr: '', titleEn: '' });
    setSectionAddOpen(true);
  };

  const openSectionEdit = (section: CatalogSection) => {
    setSectionEditOriginalId(section.id);
    setSectionDraft({
      id: section.id,
      titleAr: section.title.ar,
      titleEn: section.title.en,
    });
    setSectionEditOpen(true);
  };

  const saveSectionAdd = () => {
    const id = normalizeSectionId(sectionDraft.id);
    const titleAr = sectionDraft.titleAr.trim();
    if (!id || id.length < 2) {
      toast.error(isRtl ? 'أدخل معرّفاً صالحاً (حروف إنجليزية وأرقام وشرطات)' : 'Enter a valid ID (letters, numbers, hyphens)');
      return;
    }
    if (!titleAr) {
      toast.error(isRtl ? 'أدخل اسم القسم' : 'Enter a section name');
      return;
    }
    if (sections.some((s) => s.id === id)) {
      toast.error(isRtl ? 'هذا المعرّف مستخدم مسبقاً' : 'This section ID already exists');
      return;
    }
    const titleEn = sectionDraft.titleEn.trim() || titleAr;
    const saved = upsertSection({ id, title: { en: titleEn, ar: titleAr }, products: [] });
    if (saved.ok === false) {
      toast.error(catalogSaveErrorMessage(isRtl, saved.reason));
      return;
    }
    setSectionAddOpen(false);
    onReload();
    toast.success(isRtl ? 'تمت إضافة القسم' : 'Section added');
  };

  const saveSectionEdit = () => {
    const originalId = sectionEditOriginalId;
    if (!originalId) return;
    const section = sections.find((s) => s.id === originalId);
    if (!section) return;

    const newId = normalizeSectionId(sectionDraft.id);
    const titleAr = sectionDraft.titleAr.trim();
    const titleEn = sectionDraft.titleEn.trim();
    if (!newId || newId.length < 2) {
      toast.error(isRtl ? 'أدخل معرّفاً صالحاً (حروف إنجليزية وأرقام وشرطات)' : 'Enter a valid ID (letters, numbers, hyphens)');
      return;
    }
    if (!titleAr || !titleEn) {
      toast.error(isRtl ? 'أكمل اسم القسم بالعربية والإنجليزية' : 'Fill section name in Arabic and English');
      return;
    }

    const result = updateSection(originalId, { id: newId, title: { en: titleEn, ar: titleAr } });
    if (result.ok === false) {
      if (result.reason === 'id_taken') {
        toast.error(isRtl ? 'هذا المعرّف مستخدم مسبقاً' : 'This section ID already exists');
      } else if (result.reason === 'not_found') {
        toast.error(isRtl ? 'القسم غير موجود' : 'Section not found');
      } else if (result.reason === 'quota_exceeded' || result.reason === 'storage_error') {
        toast.error(catalogSaveErrorMessage(isRtl, result.reason));
      }
      return;
    }

    if (catalogSectionId === originalId) setCatalogSectionId(newId);
    setSectionEditOpen(false);
    setSectionEditOriginalId(null);
    onReload();
    toast.success(isRtl ? 'تم تحديث القسم' : 'Section updated');
  };

  const confirmSectionDelete = () => {
    if (!sectionDeleteTarget) return;
    if (sections.length <= 1) {
      toast.error(isRtl ? 'يجب أن يبقى قسم واحد على الأقل' : 'At least one section must remain');
      return;
    }
    const { id } = sectionDeleteTarget;
    const title = sectionDeleteTarget.title;
    const productCount = sectionDeleteTarget.products.length;
    const saved = deleteSection(id);
    if (saved.ok === false) {
      toast.error(catalogSaveErrorMessage(isRtl, saved.reason));
      return;
    }
    setSectionDeleteTarget(null);
    onReload();
    toast.success(isRtl ? 'تم حذف القسم' : 'Section deleted');
  };

  const confirmProductDelete = async () => {
    if (!productDeleteTarget) return;
    const { sectionId, product } = productDeleteTarget;
    const saved = deleteProduct(sectionId, product.id);
    if (saved.ok === false) {
      toast.error(catalogSaveErrorMessage(isRtl, saved.reason));
      return;
    }
    try {
      await removeStoredProductImage(product.id);
    } catch {}
    setProductDeleteTarget(null);
    onReload();
    toast.success(isRtl ? 'تم حذف المنتج' : 'Product deleted');
  };

  const saveEdit = async () => {
    if (!editTarget || !active) return;
    const src = editTarget;
    const e = editDraft;
    const rawImage = getRawCatalogProduct(src.id)?.image;
    let image = e.image || rawImage || src.image;
    if (image.startsWith('data:')) {
      try {
        image = await prepareProductImageForSave(src.id, image);
      } catch {
        toast.error(isRtl ? 'تعذر حفظ صورة المنتج' : 'Could not save product image');
        return;
      }
    } else if (image.startsWith('blob:')) {
      image = rawImage ?? image;
    }
    const payload: CatalogProduct = {
      id: src.id,
      name: e.name ? { en: e.name.en || src.name.en, ar: e.name.ar || src.name.ar } : src.name,
      description: e.description
        ? { en: e.description.en || src.description.en, ar: e.description.ar || src.description.ar }
        : src.description,
      price: typeof e.price === 'number' ? e.price : src.price,
      image,
      rating: typeof e.rating === 'number' ? e.rating : (src as CatalogProduct).rating ?? 4,
      category: src.category,
      stockCount: typeof e.stockCount === 'number' ? e.stockCount : src.stockCount ?? 0,
      inStock: (typeof e.stockCount === 'number' ? e.stockCount : src.stockCount ?? 0) > 0,
      notesTop: (e as CatalogProduct).notesTop ?? src.notesTop,
      notesMiddle: (e as CatalogProduct).notesMiddle ?? src.notesMiddle,
      notesBase: (e as CatalogProduct).notesBase ?? src.notesBase,
      volumeMl: (e as CatalogProduct).volumeMl ?? src.volumeMl,
      unitsPerBox: typeof e.unitsPerBox === 'number' ? e.unitsPerBox : src.unitsPerBox,
      pricePerUnit:
        typeof e.pricePerUnit === 'number' && e.pricePerUnit > 0 ? e.pricePerUnit : undefined,
      ...resolveSaleFlagsFromPrices({
        pricePerUnit:
          typeof e.pricePerUnit === 'number' && e.pricePerUnit > 0 ? e.pricePerUnit : undefined,
        unitsPerBox: typeof e.unitsPerBox === 'number' ? e.unitsPerBox : src.unitsPerBox,
      }),
    };
    const saved = upsertProduct(active.id, payload);
    if (saved.ok === false) {
      toast.error(catalogSaveErrorMessage(isRtl, saved.reason));
      return;
    }
    setEditOpen(false);
    setEditTarget(null);
    onReload();
    toast.success(isRtl ? 'تم التحديث' : 'Product updated');
  };

  const saveAdd = async () => {
    if (!addSectionId) return;
    const nameEn = addDraft.name?.en?.trim() || '';
    const descEn = addDraft.description?.en?.trim() || '';
    const boxPrice = typeof addDraft.price === 'number' ? addDraft.price : Number(addDraft.price);
    const unitPriceRaw = addDraft.pricePerUnit;
    const unitPrice =
      typeof unitPriceRaw === 'number' && Number.isFinite(unitPriceRaw) && unitPriceRaw > 0
        ? unitPriceRaw
        : undefined;
    const unitsPerBox =
      typeof addDraft.unitsPerBox === 'number' && addDraft.unitsPerBox > 0
        ? Math.floor(addDraft.unitsPerBox)
        : undefined;
    if (!nameEn || !addDraft.image || !descEn || !Number.isFinite(boxPrice) || boxPrice < 0) {
      toast.error(
        isRtl
          ? 'أكمل الاسم والوصف وصورة المنتج وسعر البوكس'
          : 'Fill name, description, image, and box price',
      );
      return;
    }
    const productId = nextCatalogProductId();
    let image: string;
    try {
      image = await prepareProductImageForSave(productId, addDraft.image as string);
    } catch {
      toast.error(isRtl ? 'تعذر حفظ صورة المنتج' : 'Could not save product image');
      return;
    }
    const payload: CatalogProduct = {
      id: productId,
      name: { en: nameEn, ar: nameEn },
      description: { en: descEn, ar: descEn },
      price: boxPrice,
      image,
      rating: (addDraft.rating as number) ?? 4,
      category: sectionToCategory[addSectionId] || 'home',
      stockCount: addDraft.stockCount ?? 20,
      inStock: (addDraft.stockCount ?? 20) > 0,
      notesTop: (addDraft as CatalogProduct).notesTop,
      notesMiddle: (addDraft as CatalogProduct).notesMiddle,
      notesBase: (addDraft as CatalogProduct).notesBase,
      volumeMl: (addDraft as CatalogProduct).volumeMl,
      unitsPerBox,
      pricePerUnit: unitPrice,
      ...resolveSaleFlagsFromPrices({ pricePerUnit: unitPrice, unitsPerBox }),
    };
    const saved = upsertProduct(addSectionId, payload);
    if (saved.ok === false) {
      toast.error(catalogSaveErrorMessage(isRtl, saved.reason));
      return;
    }
    setAddOpen(false);
    setAddDraft({ rating: 4, stockCount: 20 });
    onReload();
    toast.success(isRtl ? 'تمت الإضافة' : 'Product added');
  };

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {isRtl ? 'لا توجد أقسام.' : 'No catalog sections.'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {view === 'sections' ? (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/50 bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{isRtl ? 'إدارة الأقسام' : 'Sections'}</CardTitle>
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {sections.length} {isRtl ? 'قسم' : 'sections'}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {totalProducts} {isRtl ? 'منتج' : 'products'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRtl
                  ? 'اضغط على قسم لإدارة منتجاته. يمكنك إضافة أقسام جديدة أو تعديلها من هنا.'
                  : 'Click a section to manage its products. Add or edit sections from here.'}
              </p>
            </div>
          </div>
          <Button onClick={openSectionAdd}>
            <Plus className="h-4 w-4" />
            {isRtl ? 'قسم جديد' : 'New section'}
          </Button>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sections.map((s, index) => {
              const tone = SECTION_CARD_TONES[index % SECTION_CARD_TONES.length];
              const previews = s.products.slice(0, 4);
              return (
                <article
                  key={s.id}
                  className="group relative flex min-h-[11rem] flex-col rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:border-primary/25 hover:bg-muted/20 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => openCatalog(s.id)}
                    className="flex flex-1 flex-col items-start gap-3 rounded-2xl p-4 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
                          tone,
                        )}
                      >
                        <Layers className="h-5 w-5" aria-hidden />
                      </div>
                      {previews.length > 0 ? (
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                          {previews.map((p) => (
                            <div
                              key={p.id}
                              className="relative h-9 w-9 overflow-hidden rounded-lg border-2 border-card bg-muted/40 shadow-sm"
                            >
                              <img src={p.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                            </div>
                          ))}
                          {s.products.length > previews.length ? (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
                              +{s.products.length - previews.length}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="line-clamp-2 font-semibold leading-snug text-foreground">{s.title[language]}</p>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground" dir="ltr">
                        {s.id}
                      </p>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {s.products.length} {isRtl ? 'منتج' : 'products'}
                      </Badge>
                    </div>
                    <span className="mt-auto flex w-full items-center justify-between gap-2 pt-1 text-xs font-medium text-primary">
                      {isRtl ? 'إدارة المنتجات' : 'Manage products'}
                      <ChevronRight className={cn('h-4 w-4 shrink-0', isRtl && 'rotate-180')} aria-hidden />
                    </span>
                  </button>
                  <div
                    className={cn(
                      'flex items-center justify-end gap-0.5 border-t border-border/50 px-2 py-1.5',
                      isRtl && 'flex-row-reverse',
                    )}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2.5 text-xs"
                      onClick={() => openSectionEdit(s)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {isRtl ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2.5 text-xs text-destructive hover:text-destructive"
                      onClick={() => setSectionDeleteTarget(s)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {isRtl ? 'حذف' : 'Delete'}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </CardContent>
      </Card>
      ) : active ? (
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/50 bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit shrink-0 gap-2"
              onClick={backToSections}
            >
              <ArrowLeft className={cn('h-4 w-4', isRtl && 'rotate-180')} />
              {isRtl ? 'العودة إلى الأقسام' : 'Back to sections'}
            </Button>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle>{isRtl ? 'كتالوج المنتجات' : 'Product catalog'}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isRtl ? 'القسم:' : 'Section:'}{' '}
                  <span className="font-medium text-foreground">{active.title[language]}</span>
                  <span className="mx-2 text-border">·</span>
                  <span dir="ltr" className="font-mono text-xs">
                    {active.id}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => openAdd(active.id)}>
            <Plus className="h-4 w-4" />
            {isRtl ? 'منتج جديد' : 'New product'}
          </Button>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {active.products.length === 0 ? (
            <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/15 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 font-medium">{isRtl ? 'لا توجد منتجات في هذا القسم' : 'No products in this section'}</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {isRtl ? 'ابدأ بإضافة أول منتج لهذا القسم.' : 'Start by adding the first product for this section.'}
              </p>
              <Button className="mt-5" size="sm" onClick={() => openAdd(active.id)}>
                <Plus className="h-4 w-4" />
                {isRtl ? 'إضافة منتج' : 'Add product'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="ps-9"
                      placeholder={isRtl ? 'بحث بالاسم أو الرقم أو السعر…' : 'Search by name, SKU, or price…'}
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div
                      className="flex rounded-lg border border-border/60 bg-background p-0.5 shadow-sm"
                      role="group"
                      aria-label={isRtl ? 'طريقة العرض' : 'View mode'}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant={catalogViewMode === 'cards' ? 'secondary' : 'ghost'}
                        className="h-8 gap-1.5 px-2.5"
                        onClick={() => setCatalogView('cards')}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">{isRtl ? 'بطاقات' : 'Cards'}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={catalogViewMode === 'table' ? 'secondary' : 'ghost'}
                        className="h-8 gap-1.5 px-2.5"
                        onClick={() => setCatalogView('table')}
                      >
                        <Table2 className="h-4 w-4" />
                        <span className="hidden sm:inline">{isRtl ? 'جدول' : 'Table'}</span>
                      </Button>
                    </div>
                    {catalogHasActiveFilters ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                          setCatalogSearch('');
                          setCatalogStockFilter('all');
                        }}
                      >
                        {isRtl ? 'مسح الفلاتر' : 'Clear filters'}
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {catalogStockFilters.map((f) => (
                    <Button
                      key={f.id}
                      type="button"
                      size="sm"
                      variant={catalogStockFilter === f.id ? 'default' : 'outline'}
                      onClick={() => setCatalogStockFilter(f.id)}
                    >
                      {isRtl ? f.labelAr : f.labelEn}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {catalogHasActiveFilters
                    ? isRtl
                      ? `عرض ${filteredCatalogProducts.length} من ${active.products.length} منتج · تنبيه المخزون المنخفض: ≤ ${getLowStockThreshold()}`
                      : `Showing ${filteredCatalogProducts.length} of ${active.products.length} products · Low stock: ≤ ${getLowStockThreshold()}`
                    : isRtl
                      ? `${active.products.length} منتج في هذا القسم`
                      : `${active.products.length} product(s) in this section`}
                </p>
              </div>

              {filteredCatalogProducts.length === 0 ? (
                <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/70" />
                  <p className="mt-3 font-medium">{isRtl ? 'لا توجد نتائج مطابقة' : 'No matching products'}</p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    {isRtl ? 'جرّب كلمة بحث أخرى أو غيّر فلتر المخزون.' : 'Try a different search term or stock filter.'}
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogStockFilter('all');
                    }}
                  >
                    {isRtl ? 'إظهار الكل' : 'Show all'}
                  </Button>
                </div>
              ) : (
                <AdminCatalogProductsView
                  products={filteredCatalogProducts}
                  language={language}
                  viewMode={catalogViewMode}
                  onEdit={openEdit}
                  onDelete={(p) => setProductDeleteTarget({ sectionId: active.id, product: p })}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
      ) : null}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5 text-start">
            <DialogTitle>{isRtl ? 'منتج جديد' : 'New product'}</DialogTitle>
            <DialogDescription>
              {isRtl ? 'أكمل التفاصيل وارفع صورة للمنتج.' : 'Fill in the details and upload a product image.'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5">
            <ProductForm
              mode="add"
              language={language}
              draft={addDraft}
              setDraft={setAddDraft}
              onCancel={() => setAddOpen(false)}
              onSave={() => void saveAdd()}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditOpen(false)}>
        <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          {editTarget && (
            <>
              <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5 text-start">
                <DialogTitle>{isRtl ? 'تعديل المنتج' : 'Edit product'}</DialogTitle>
                <DialogDescription>
                  {editTarget.name[language]} · #{editTarget.id}
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 py-5">
                <ProductForm
                  mode="edit"
                  language={language}
                  productId={editTarget.id}
                  draft={editDraft}
                  setDraft={setEditDraft}
                  onCancel={() => setEditOpen(false)}
                  onSave={() => void saveEdit()}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={sectionAddOpen} onOpenChange={setSectionAddOpen}>
        <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'قسم جديد' : 'New section'}</DialogTitle>
            <DialogDescription>
              {isRtl
                ? 'المعرّف يُستخدم في الرابط (مثل: new-arrivals).'
                : 'The ID is used in URLs (e.g. new-arrivals).'}
            </DialogDescription>
          </DialogHeader>
          <SectionForm mode="add" isRtl={isRtl} draft={sectionDraft} setDraft={setSectionDraft} />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSectionAddOpen(false)}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={saveSectionAdd}>{isRtl ? 'إضافة القسم' : 'Add section'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sectionEditOpen}
        onOpenChange={(open) => {
          setSectionEditOpen(open);
          if (!open) setSectionEditOriginalId(null);
        }}
      >
        <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'تعديل القسم' : 'Edit section'}</DialogTitle>
            <DialogDescription>
              {isRtl ? 'يمكنك تعديل المعرّف والاسم بالعربية والإنجليزية.' : 'You can edit the ID and names in Arabic and English.'}
            </DialogDescription>
          </DialogHeader>
          <SectionForm mode="edit" isRtl={isRtl} draft={sectionDraft} setDraft={setSectionDraft} />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSectionEditOpen(false)}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={saveSectionEdit}>{isRtl ? 'حفظ التعديلات' : 'Save changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(productDeleteTarget)} onOpenChange={(open) => !open && setProductDeleteTarget(null)}>
        <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'تأكيد حذف المنتج' : 'Delete product?'}</DialogTitle>
            <DialogDescription>
              {productDeleteTarget &&
                (isRtl ? (
                  <>
                    هل أنت متأكد من حذف المنتج{' '}
                    <span className="font-medium text-foreground">{productDeleteTarget.product.name.ar}</span> (#{' '}
                    {productDeleteTarget.product.id})؟ لا يمكن التراجع عن هذا الإجراء.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-foreground">{productDeleteTarget.product.name.en}</span> (#
                    {productDeleteTarget.product.id})? This action cannot be undone.
                  </>
                ))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setProductDeleteTarget(null)}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmProductDelete()}>
              {isRtl ? 'نعم، احذف المنتج' : 'Yes, delete product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(sectionDeleteTarget)} onOpenChange={(open) => !open && setSectionDeleteTarget(null)}>
        <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'تأكيد حذف القسم' : 'Delete section?'}</DialogTitle>
            <DialogDescription>
              {sectionDeleteTarget &&
                (isRtl ? (
                  <>
                    هل أنت متأكد من حذف قسم{' '}
                    <span className="font-medium text-foreground">{sectionDeleteTarget.title.ar}</span> وجميع منتجاته
                    ({sectionDeleteTarget.products.length})؟ لا يمكن التراجع عن هذا الإجراء.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-foreground">{sectionDeleteTarget.title.en}</span> and all{' '}
                    {sectionDeleteTarget.products.length} product(s) in it? This action cannot be undone.
                  </>
                ))}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSectionDeleteTarget(null)}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmSectionDelete}>
              {isRtl ? 'نعم، احذف القسم' : 'Yes, delete section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function SectionForm({
  mode,
  isRtl,
  draft,
  setDraft,
}: {
  mode: 'add' | 'edit';
  isRtl: boolean;
  draft: { id: string; titleAr: string; titleEn: string };
  setDraft: Dispatch<SetStateAction<{ id: string; titleAr: string; titleEn: string }>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{isRtl ? 'معرّف القسم' : 'Section ID'}</Label>
        <Input
          dir="ltr"
          placeholder="e.g. new-arrivals"
          value={draft.id}
          onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          {isRtl ? 'حروف إنجليزية صغيرة وأرقام وشرطات فقط' : 'Lowercase letters, numbers, and hyphens only'}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{isRtl ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
        <Input value={draft.titleAr} onChange={(e) => setDraft((d) => ({ ...d, titleAr: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {mode === 'add'
            ? isRtl
              ? 'الاسم (إنجليزي — اختياري)'
              : 'Name (English — optional)'
            : isRtl
              ? 'الاسم (إنجليزي)'
              : 'Name (English)'}
        </Label>
        <Input value={draft.titleEn} onChange={(e) => setDraft((d) => ({ ...d, titleEn: e.target.value }))} />
        {mode === 'add' && (
          <p className="text-xs text-muted-foreground">
            {isRtl ? 'إن تُرك فارغاً يُنسخ من الاسم العربي' : 'If empty, the Arabic name is copied'}
          </p>
        )}
      </div>
    </div>
  );
}

function ProductImageField({
  language,
  productId,
  image,
  onImageChange,
}: {
  language: 'en' | 'ar';
  productId?: number;
  image?: string;
  onImageChange: (image: string | undefined) => void;
}) {
  const isRtl = language === 'ar';
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(image ?? '');

  useEffect(() => {
    let cancelled = false;
    if (!image) {
      setPreview('');
      return;
    }
    const refId = parseCatalogImageRef(image);
    if (refId === null || productId === undefined) {
      setPreview(image);
      return;
    }
    void resolveCatalogImage(productId, image).then((url) => {
      if (!cancelled) setPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [image, productId]);

  const showImageError = (err: unknown) => {
    const code = err instanceof Error ? err.message : '';
    if (code === 'too_large') {
      toast.error(
        isRtl
          ? `الصورة كبيرة جداً (الحد ${MAX_PRODUCT_IMAGE_MB} ميجابايت)`
          : `Image is too large (max ${MAX_PRODUCT_IMAGE_MB} MB)`,
      );
    } else if (code === 'not_image') {
      toast.error(isRtl ? 'اختر ملف صورة فقط' : 'Please choose an image file');
    } else {
      toast.error(isRtl ? 'تعذر قراءة الصورة' : 'Could not read the image');
    }
  };

  const processFile = async (file: File) => {
    setBusy(true);
    try {
      const dataUrl = await readProductImageFile(file);
      onImageChange(dataUrl);
    } catch (err) {
      showImageError(err);
    } finally {
      setBusy(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void processFile(file);
  };

  const openPicker = () => {
    if (!busy) inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {isRtl ? 'صورة المنتج' : 'Product image'}
        <span className="ms-1 text-destructive">*</span>
      </Label>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!image) openPicker();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void processFile(file);
        }}
        onClick={() => {
          if (!image && !busy) openPicker();
        }}
        className={cn(
          'overflow-hidden rounded-xl border-2 border-dashed transition-all',
          dragOver && 'border-primary bg-primary/5 ring-2 ring-primary/20',
          !dragOver && !image && 'border-border/80 bg-muted/25 hover:border-primary/35 hover:bg-muted/40',
          !dragOver && image && 'border-border/60 bg-muted/20',
          !image && !busy && 'cursor-pointer',
        )}
      >
        {busy ? (
          <div className="flex min-h-[11rem] flex-col items-center justify-center gap-2 px-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isRtl ? 'جاري تحميل الصورة…' : 'Loading image…'}
            </p>
          </div>
        ) : image ? (
          <div className="flex flex-col sm:flex-row sm:items-stretch">
            <div className="relative aspect-[4/3] w-full shrink-0 bg-muted/40 sm:aspect-square sm:w-44">
              <img src={preview || image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-3 border-t border-border/50 p-4 sm:border-s sm:border-t-0">
              <p className="text-sm text-muted-foreground">
                {isRtl ? 'تم اختيار الصورة. يمكنك استبدالها أو إزالتها.' : 'Image selected. You can replace or remove it.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPicker();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  {isRtl ? 'تغيير الصورة' : 'Change image'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageChange(undefined);
                  }}
                >
                  {isRtl ? 'إزالة' : 'Remove'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[11rem] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm">
              <ImageIcon className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isRtl ? 'اسحب الصورة هنا أو اختر ملفاً' : 'Drag an image here or choose a file'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? `JPG · PNG · WebP · GIF — حتى ${MAX_PRODUCT_IMAGE_MB} ميجابايت`
                  : `JPG · PNG · WebP · GIF — up to ${MAX_PRODUCT_IMAGE_MB} MB`}
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                openPicker();
              }}
            >
              <Upload className="h-4 w-4" />
              {isRtl ? 'اختيار صورة' : 'Choose image'}
            </Button>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_ACCEPT}
        className="sr-only"
        onChange={handleFileInput}
      />
    </div>
  );
}

function ProductForm({
  mode,
  language,
  productId,
  draft,
  setDraft,
  onCancel,
  onSave,
}: {
  mode: 'add' | 'edit';
  language: 'en' | 'ar';
  productId?: number;
  draft: Partial<CatalogProduct>;
  setDraft: Dispatch<SetStateAction<Partial<CatalogProduct>>>;
  onCancel: () => void;
  onSave: () => void;
}) {
  const isRtl = language === 'ar';
  const isAdd = mode === 'add';

  return (
    <div className="space-y-5">
      <div className={cn('grid gap-4', isAdd ? 'grid-cols-1' : 'md:grid-cols-2')}>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {isAdd ? (isRtl ? 'اسم المنتج' : 'Product name') : 'Name (en)'}
          </Label>
          <Input
            value={draft.name?.en ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, name: { en: e.target.value, ar: d.name?.ar ?? '' } }))}
          />
        </div>
        {!isAdd && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">الاسم (ar)</Label>
            <Input
              value={draft.name?.ar ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, name: { en: d.name?.en ?? '', ar: e.target.value } }))}
            />
          </div>
        )}
      </div>

      <ProductImageField
        language={language}
        productId={productId}
        image={draft.image}
        onImageChange={(image) => setDraft((d) => ({ ...d, image }))}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {isRtl ? 'سعر البوكس (د.أ) *' : 'Box price (JOD) *'}
          </Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={draft.price ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft((d) => ({
                ...d,
                price: raw === '' ? undefined : Number(raw),
              }));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{isRtl ? 'سعر الحبة (د.أ)' : 'Unit price (JOD)'}</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder={isRtl ? 'اختياري — للبيع بالحبة' : 'Optional — sell by unit'}
            value={draft.pricePerUnit ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft((d) => ({
                ...d,
                pricePerUnit: raw === '' ? undefined : Number(raw),
              }));
            }}
          />
        </div>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        {isRtl
          ? 'عند إدخال سعر الحبة يختار العميل بوكس أو حبة ويظهر السعر حسب اختياره.'
          : 'With a unit price, customers pick box or unit and see the price for their choice.'}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{isRtl ? 'المخزون' : 'Stock'}</Label>
          <Input
            type="number"
            value={draft.stockCount ?? 0}
            onChange={(e) => setDraft((d) => ({ ...d, stockCount: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {isRtl ? 'عدد الحبات في البوكس' : 'Units per box'}
          </Label>
          <Input
            type="number"
            min={1}
            placeholder={isRtl ? 'مثال: 5 (اختياري)' : 'e.g. 5 (optional)'}
            value={draft.unitsPerBox ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              setDraft((d) => ({
                ...d,
                unitsPerBox: raw === '' ? undefined : Math.max(1, Number(raw)),
              }));
            }}
          />
          {typeof draft.price === 'number' &&
            draft.price > 0 &&
            typeof draft.unitsPerBox === 'number' &&
            draft.unitsPerBox > 1 &&
            !(typeof draft.pricePerUnit === 'number' && draft.pricePerUnit > 0) && (
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? `بدون سعر حبة: ≈ ${(draft.price / draft.unitsPerBox).toFixed(2)} د.أ للحبة`
                  : `No unit price: ≈ ${(draft.price / draft.unitsPerBox).toFixed(2)} JOD per unit`}
              </p>
            )}
        </div>
      </div>

      <div className={cn('grid gap-4', isAdd ? 'grid-cols-1' : 'md:grid-cols-2')}>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            {isAdd ? (isRtl ? 'الوصف' : 'Description') : 'Description (en)'}
          </Label>
          <Textarea
            className="min-h-[100px] resize-y"
            value={draft.description?.en ?? ''}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: { en: e.target.value, ar: d.description?.ar ?? '' } }))
            }
          />
        </div>
        {!isAdd && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">الوصف (ar)</Label>
            <Textarea
              className="min-h-[100px] resize-y"
              value={draft.description?.ar ?? ''}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: { en: d.description?.en ?? '', ar: e.target.value } }))
              }
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
        <Button variant="outline" onClick={onCancel}>
          {isRtl ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button onClick={onSave}>{isRtl ? 'حفظ المنتج' : 'Save product'}</Button>
      </div>
    </div>
  );
}

export default AdminProductsPanel;
