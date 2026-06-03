import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImageIcon,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getCatalogSections } from '@/lib/catalog';
import {
  CATALOG_PROMO_CHANGED,
  DEFAULT_CATALOG_PROMO,
  readCatalogPromoConfig,
  writeCatalogPromoConfig,
  type CatalogPromoConfig,
} from '@/lib/catalogPromo';
import {
  CATALOG_PROMO_HISTORY_CHANGED,
  deleteCatalogPromoHistoryEntry,
  pushCatalogPromoHistoryEntry,
  readCatalogPromoHistory,
  restoreCatalogPromoFromHistory,
  type CatalogPromoHistoryEntry,
} from '@/lib/catalogPromoHistory';
import {
  loadPromoImageDataUrl,
  removePromoImageDataUrl,
  savePromoImageDataUrl,
} from '@/lib/catalogPromoImage';
import { formatDateTime } from '@/lib/formatNumbers';
import { MAX_PRODUCT_IMAGE_MB, PRODUCT_IMAGE_ACCEPT, readProductImageFile } from '@/lib/productImage';

type Props = {
  language: 'en' | 'ar';
};

const AUTO_PRODUCT = 'auto';

type DialogMode = 'create' | 'edit';

const AdminPromotionsPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeConfig, setActiveConfig] = useState<CatalogPromoConfig>(() => readCatalogPromoConfig());
  const [history, setHistory] = useState<CatalogPromoHistoryEntry[]>(() => readCatalogPromoHistory());
  const [sections, setSections] = useState(() => getCatalogSections());
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('create');
  const [draft, setDraft] = useState<CatalogPromoConfig>(() => ({ ...DEFAULT_CATALOG_PROMO }));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [restoreBusyId, setRestoreBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const cfg = readCatalogPromoConfig();
    setActiveConfig(cfg);
    setHistory(readCatalogPromoHistory());
    setSections(getCatalogSections());
    if (cfg.useCustomImage) {
      setActiveImagePreview(await loadPromoImageDataUrl());
    } else {
      setActiveImagePreview(null);
    }
  }, []);

  useEffect(() => {
    void reload();
    const onPromo = () => void reload();
    const onHistory = () => setHistory(readCatalogPromoHistory());
    window.addEventListener(CATALOG_PROMO_CHANGED, onPromo);
    window.addEventListener(CATALOG_PROMO_HISTORY_CHANGED, onHistory);
    return () => {
      window.removeEventListener(CATALOG_PROMO_CHANGED, onPromo);
      window.removeEventListener(CATALOG_PROMO_HISTORY_CHANGED, onHistory);
    };
  }, [reload]);

  const productOptions = useMemo(() => {
    return sections.flatMap((sec) =>
      sec.products.map((p) => ({
        id: p.id,
        label: `${p.name?.en || p.id} (#${p.id}) — ${sec.title?.en || sec.id}`,
      })),
    );
  }, [sections]);

  const productLabelById = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of productOptions) map.set(p.id, p.label);
    return map;
  }, [productOptions]);

  const t =
    language === 'ar'
      ? {
          title: 'إعلانات المتجر',
          desc: 'إعلان فوق الفيديو في الرئيسية — العملاء يغلقونه بـ X.',
          current: 'الإعلان النشط',
          noActive: 'لا يوجد إعلان مفعّل',
          addPromo: 'إضافة إعلان',
          editPromo: 'تعديل الإعلان',
          dialogAdd: 'إعلان جديد',
          dialogEdit: 'تعديل الإعلان',
          dialogDesc: 'العنوان، الصورة، المنتج، ونص الزر. عند الحفظ يُؤرشف الإعلان السابق في الجدول.',
          enabled: 'تفعيل الإعلان',
          product: 'رابط المنتج عند النقر',
          auto: 'أول منتج في أقسام العميل',
          imageMode: 'صورة الإعلان',
          useProductImage: 'صورة المنتج',
          useCustomImage: 'صورة مرفوعة',
          upload: 'رفع صورة',
          removeImage: 'إزالة الصورة',
          imageHint: 'JPEG أو PNG أو WebP — حتى 10 ميجابايت',
          promoTitle: 'عنوان قصير',
          titleEn: 'إنجليزي',
          titleAr: 'عربي',
          cta: 'نص زر المتجر',
          ctaEn: 'إنجليزي',
          ctaAr: 'عربي',
          save: 'حفظ الإعلان',
          cancel: 'إلغاء',
          saved: 'تم حفظ الإعلان',
          saveFail: 'تعذر الحفظ',
          needImage: 'ارفع صورة أو اختر صورة المنتج',
          uploadFail: 'تعذر رفع الصورة',
          tooLarge: `الصورة أكبر من ${MAX_PRODUCT_IMAGE_MB} ميجابايت`,
          historyTitle: 'الإعلانات السابقة',
          historyDesc: 'إعلانات محفوظة سابقاً — يمكن استعادتها أو حذفها من السجل.',
          historyEmpty: 'لا توجد إعلانات سابقة بعد.',
          colDate: 'التاريخ',
          colTitle: 'العنوان',
          colStatus: 'الحالة',
          colProduct: 'المنتج',
          colImage: 'الصورة',
          colActions: 'إجراءات',
          active: 'مفعّل',
          inactive: 'معطّل',
          customImg: 'مرفوعة',
          productImg: 'منتج',
          restore: 'استعادة',
          delete: 'حذف',
          restored: 'تم استعادة الإعلان',
          restoreFail: 'تعذر الاستعادة',
          deleted: 'تم الحذف من السجل',
        }
      : {
          title: 'Store promotions',
          desc: 'Promo on the home video — customers can dismiss with X.',
          current: 'Active promotion',
          noActive: 'No active promotion',
          addPromo: 'Add promotion',
          editPromo: 'Edit promotion',
          dialogAdd: 'New promotion',
          dialogEdit: 'Edit promotion',
          dialogDesc: 'Title, image, product link, and CTA. Saving archives the previous promo in the table below.',
          enabled: 'Show promotion',
          product: 'Product on click',
          auto: 'First product in customer sections',
          imageMode: 'Promo image',
          useProductImage: 'Product image',
          useCustomImage: 'Uploaded image',
          upload: 'Upload image',
          removeImage: 'Remove image',
          imageHint: 'JPEG, PNG, or WebP — up to 10 MB',
          promoTitle: 'Short title',
          titleEn: 'English',
          titleAr: 'Arabic',
          cta: 'Store button label',
          ctaEn: 'English',
          ctaAr: 'Arabic',
          save: 'Save promotion',
          cancel: 'Cancel',
          saved: 'Promotion saved',
          saveFail: 'Could not save',
          needImage: 'Upload an image or use the product image',
          uploadFail: 'Could not upload image',
          tooLarge: `Image is larger than ${MAX_PRODUCT_IMAGE_MB} MB`,
          historyTitle: 'Previous promotions',
          historyDesc: 'Archived promos — restore to make active again or remove from history.',
          historyEmpty: 'No previous promotions yet.',
          colDate: 'Date',
          colTitle: 'Title',
          colStatus: 'Status',
          colProduct: 'Product',
          colImage: 'Image',
          colActions: 'Actions',
          active: 'On',
          inactive: 'Off',
          customImg: 'Upload',
          productImg: 'Product',
          restore: 'Restore',
          delete: 'Delete',
          restored: 'Promotion restored',
          restoreFail: 'Could not restore',
          deleted: 'Removed from history',
        };

  const openCreateDialog = () => {
    setDialogMode('create');
    setDraft({ ...DEFAULT_CATALOG_PROMO, enabled: true });
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = async () => {
    const cfg = readCatalogPromoConfig();
    setDialogMode('edit');
    setDraft({ ...cfg });
    if (cfg.useCustomImage) {
      setImagePreview(await loadPromoImageDataUrl());
    } else {
      setImagePreview(null);
    }
    setDialogOpen(true);
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadBusy(true);
    try {
      const dataUrl = await readProductImageFile(file);
      setImagePreview(dataUrl);
      setDraft((c) => ({ ...c, useCustomImage: true }));
    } catch (e) {
      const err = e instanceof Error ? e.message : '';
      if (err === 'too_large') toast.error(t.tooLarge);
      else toast.error(t.uploadFail);
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onRemoveImage = () => {
    setImagePreview(null);
    setDraft((c) => ({ ...c, useCustomImage: false }));
  };

  const onSave = async () => {
    if (draft.useCustomImage && !imagePreview) {
      toast.error(t.needImage);
      return;
    }
    setSaveBusy(true);
    try {
      const previous = readCatalogPromoConfig();
      const prevImage = previous.useCustomImage ? await loadPromoImageDataUrl() : null;
      await pushCatalogPromoHistoryEntry(previous, prevImage);

      if (draft.useCustomImage && imagePreview) {
        await savePromoImageDataUrl(imagePreview);
      } else {
        await removePromoImageDataUrl();
      }

      if (!writeCatalogPromoConfig(draft)) {
        toast.error(t.saveFail);
        return;
      }

      toast.success(t.saved);
      setDialogOpen(false);
      await reload();
    } catch {
      toast.error(t.saveFail);
    } finally {
      setSaveBusy(false);
    }
  };

  const onRestore = async (id: string) => {
    setRestoreBusyId(id);
    try {
      const ok = await restoreCatalogPromoFromHistory(id);
      if (!ok) {
        toast.error(t.restoreFail);
        return;
      }
      toast.success(t.restored);
      await reload();
    } catch {
      toast.error(t.restoreFail);
    } finally {
      setRestoreBusyId(null);
    }
  };

  const onDeleteHistory = (id: string) => {
    deleteCatalogPromoHistoryEntry(id);
    setHistory(readCatalogPromoHistory());
    toast.success(t.deleted);
  };

  const productSelectValue = draft.productId == null ? AUTO_PRODUCT : String(draft.productId);
  const activeTitle = activeConfig.title[language] || activeConfig.title.en;

  const resolveProductLabel = (productId: number | null) => {
    if (productId == null) return t.auto;
    return productLabelById.get(productId) ?? `#${productId}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1 text-start">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-primary" aria-hidden />
            {t.title}
          </CardTitle>
          <CardDescription>{t.desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/15 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/30">
                {activeConfig.useCustomImage && activeImagePreview ? (
                  <img src={activeImagePreview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-40" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-1.5 text-start">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.current}</p>
                <p className="truncate text-base font-semibold">{activeTitle || t.noActive}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={activeConfig.enabled ? 'default' : 'secondary'}>
                    {activeConfig.enabled ? t.active : t.inactive}
                  </Badge>
                  <Badge variant="outline">
                    {activeConfig.useCustomImage ? t.customImg : t.productImg}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button type="button" className="btn-primary gap-2" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" aria-hidden />
                {t.addPromo}
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => void openEditDialog()}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t.editPromo}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1 text-start">
          <CardTitle className="text-lg">{t.historyTitle}</CardTitle>
          <CardDescription>{t.historyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ScrollArea className="h-[min(420px,55vh)] rounded-xl border border-border/60 sm:mx-0">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
                <tr className="border-b text-start text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t.colDate}</th>
                  <th className="px-4 py-3 font-medium">{t.colTitle}</th>
                  <th className="px-4 py-3 font-medium">{t.colStatus}</th>
                  <th className="px-4 py-3 font-medium">{t.colProduct}</th>
                  <th className="px-4 py-3 font-medium">{t.colImage}</th>
                  <th className="px-4 py-3 font-medium">{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                      {t.historyEmpty}
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    const title = row.config.title[language] || row.config.title.en;
                    return (
                      <tr key={row.id} className="border-b border-border/40">
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {formatDateTime(row.savedAt, language, {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="max-w-[12rem] px-4 py-3">
                          <div className="flex items-center gap-3">
                            {row.config.useCustomImage && row.customImageDataUrl ? (
                              <img
                                src={row.customImageDataUrl}
                                alt=""
                                className="h-10 w-10 shrink-0 rounded-lg border object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                              </div>
                            )}
                            <span className="line-clamp-2 font-medium">{title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={row.config.enabled ? 'default' : 'secondary'}>
                            {row.config.enabled ? t.active : t.inactive}
                          </Badge>
                        </td>
                        <td className="max-w-[10rem] truncate px-4 py-3 text-muted-foreground">
                          {resolveProductLabel(row.config.productId)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.config.useCustomImage ? t.customImg : t.productImg}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 px-2"
                              disabled={restoreBusyId === row.id}
                              onClick={() => void onRestore(row.id)}
                            >
                              {restoreBusyId === row.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                              )}
                              {t.restore}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 px-2 text-destructive hover:text-destructive"
                              onClick={() => onDeleteHistory(row.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              {t.delete}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto p-0 sm:max-w-2xl">
          <DialogHeader className="space-y-1 border-b border-border/60 px-6 py-5 text-start">
            <DialogTitle>{dialogMode === 'create' ? t.dialogAdd : t.dialogEdit}</DialogTitle>
            <DialogDescription>{t.dialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 px-6 py-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <Label htmlFor="promo-enabled" className="cursor-pointer text-sm font-medium">
                {t.enabled}
              </Label>
              <Switch
                id="promo-enabled"
                checked={draft.enabled}
                onCheckedChange={(checked) => setDraft((c) => ({ ...c, enabled: checked }))}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
              <p className="text-sm font-semibold text-foreground">{t.imageMode}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={!draft.useCustomImage ? 'default' : 'outline'}
                  onClick={() => setDraft((c) => ({ ...c, useCustomImage: false }))}
                >
                  {t.useProductImage}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={draft.useCustomImage ? 'default' : 'outline'}
                  onClick={() => setDraft((c) => ({ ...c, useCustomImage: true }))}
                >
                  {t.useCustomImage}
                </Button>
              </div>

              {draft.useCustomImage ? (
                <div className="space-y-3">
                  <div className="relative mx-auto aspect-square w-full max-w-[14rem] overflow-hidden rounded-xl border border-border/60 bg-muted/30">
                    {imagePreview ? (
                      <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 opacity-50" aria-hidden />
                        <p className="text-xs">{t.imageHint}</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept={PRODUCT_IMAGE_ACCEPT}
                    className="sr-only"
                    onChange={(e) => void onPickFile(e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      disabled={uploadBusy}
                      onClick={() => fileRef.current?.click()}
                    >
                      {uploadBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Upload className="h-4 w-4" aria-hidden />
                      )}
                      {t.upload}
                    </Button>
                    {imagePreview ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={onRemoveImage}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                        {t.removeImage}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>{t.product}</Label>
              <Select
                value={productSelectValue}
                onValueChange={(v) =>
                  setDraft((c) => ({
                    ...c,
                    productId: v === AUTO_PRODUCT ? null : Number(v),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  <SelectItem value={AUTO_PRODUCT}>{t.auto}</SelectItem>
                  {productOptions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  {t.promoTitle} — {t.titleEn}
                </Label>
                <Input
                  value={draft.title.en}
                  onChange={(e) => setDraft((c) => ({ ...c, title: { ...c.title, en: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t.promoTitle} — {t.titleAr}
                </Label>
                <Input
                  value={draft.title.ar}
                  dir="rtl"
                  onChange={(e) => setDraft((c) => ({ ...c, title: { ...c.title, ar: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t.cta} — {t.ctaEn}
                </Label>
                <Input
                  value={draft.cta.en}
                  onChange={(e) => setDraft((c) => ({ ...c, cta: { ...c.cta, en: e.target.value } }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  {t.cta} — {t.ctaAr}
                </Label>
                <Input
                  value={draft.cta.ar}
                  dir="rtl"
                  onChange={(e) => setDraft((c) => ({ ...c, cta: { ...c.cta, ar: e.target.value } }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border/80 bg-muted/20 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button type="button" className="btn-primary" disabled={saveBusy} onClick={() => void onSave()}>
              {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromotionsPanel;
