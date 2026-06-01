import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, Loader2, Megaphone, Trash2, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getCatalogSections } from '@/lib/catalog';
import {
  CATALOG_PROMO_CHANGED,
  readCatalogPromoConfig,
  writeCatalogPromoConfig,
  type CatalogPromoConfig,
} from '@/lib/catalogPromo';
import {
  loadPromoImageDataUrl,
  removePromoImageDataUrl,
  savePromoImageDataUrl,
} from '@/lib/catalogPromoImage';
import { MAX_PRODUCT_IMAGE_MB, PRODUCT_IMAGE_ACCEPT, readProductImageFile } from '@/lib/productImage';

type Props = {
  language: 'en' | 'ar';
};

const AUTO_PRODUCT = 'auto';

const AdminPromotionsPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const fileRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<CatalogPromoConfig>(() => readCatalogPromoConfig());
  const [sections, setSections] = useState(() => getCatalogSections());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const reload = useCallback(async () => {
    setConfig(readCatalogPromoConfig());
    setSections(getCatalogSections());
    if (readCatalogPromoConfig().useCustomImage) {
      setImagePreview(await loadPromoImageDataUrl());
    } else {
      setImagePreview(null);
    }
  }, []);

  useEffect(() => {
    void reload();
    const onChange = () => {
      void reload();
    };
    window.addEventListener(CATALOG_PROMO_CHANGED, onChange);
    return () => window.removeEventListener(CATALOG_PROMO_CHANGED, onChange);
  }, [reload]);

  const productOptions = useMemo(() => {
    return sections.flatMap((sec) =>
      sec.products.map((p) => ({
        id: p.id,
        label: `${p.name?.en || p.id} (#${p.id}) — ${sec.title?.en || sec.id}`,
      })),
    );
  }, [sections]);

  const t =
    language === 'ar'
      ? {
          title: 'إعلانات المتجر',
          desc: 'نافذة الإعلان فوق الفيديو في الرئيسية وزاوية المتجر للعملاء. يمكنهم إغلاقها بـ X.',
          enabled: 'تفعيل الإعلان',
          product: 'رابط المنتج عند النقر',
          auto: 'أول منتج في أقسام العميل',
          imageMode: 'صورة الإعلان',
          useProductImage: 'صورة المنتج من الكتالوج',
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
          saved: 'تم حفظ الإعلان',
          saveFail: 'تعذر الحفظ',
          needImage: 'ارفع صورة أو اختر صورة المنتج',
          uploadFail: 'تعذر رفع الصورة',
          tooLarge: `الصورة أكبر من ${MAX_PRODUCT_IMAGE_MB} ميجابايت`,
        }
      : {
          title: 'Store promotions',
          desc: 'Promo window on the home video and store corner for catalog customers. They can dismiss it with X.',
          enabled: 'Show promotion',
          product: 'Product link on click',
          auto: 'First product in customer sections',
          imageMode: 'Promo image',
          useProductImage: 'Product catalog image',
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
          saved: 'Promotion saved',
          saveFail: 'Could not save',
          needImage: 'Upload an image or use the product image',
          uploadFail: 'Could not upload image',
          tooLarge: `Image is larger than ${MAX_PRODUCT_IMAGE_MB} MB`,
        };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadBusy(true);
    try {
      const dataUrl = await readProductImageFile(file);
      setImagePreview(dataUrl);
      setConfig((c) => ({ ...c, useCustomImage: true }));
    } catch (e) {
      const err = e instanceof Error ? e.message : '';
      if (err === 'too_large') toast.error(t.tooLarge);
      else toast.error(t.uploadFail);
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onRemoveImage = async () => {
    setImagePreview(null);
    setConfig((c) => ({ ...c, useCustomImage: false }));
    await removePromoImageDataUrl();
  };

  const onSave = async () => {
    if (config.useCustomImage && !imagePreview) {
      toast.error(t.needImage);
      return;
    }
    setSaveBusy(true);
    try {
      if (config.useCustomImage && imagePreview) {
        await savePromoImageDataUrl(imagePreview);
      } else {
        await removePromoImageDataUrl();
      }
      if (!writeCatalogPromoConfig(config)) {
        toast.error(t.saveFail);
        return;
      }
      toast.success(t.saved);
      await reload();
    } catch {
      toast.error(t.saveFail);
    } finally {
      setSaveBusy(false);
    }
  };

  const productSelectValue = config.productId == null ? AUTO_PRODUCT : String(config.productId);

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1 text-start">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-primary" aria-hidden />
            {t.title}
          </CardTitle>
          <CardDescription>{t.desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <Label htmlFor="promo-enabled" className="cursor-pointer text-sm font-medium">
              {t.enabled}
            </Label>
            <Switch
              id="promo-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig((c) => ({ ...c, enabled: checked }))}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
            <p className="text-sm font-semibold text-foreground">{t.imageMode}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={!config.useCustomImage ? 'default' : 'outline'}
                onClick={() => setConfig((c) => ({ ...c, useCustomImage: false }))}
              >
                {t.useProductImage}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={config.useCustomImage ? 'default' : 'outline'}
                onClick={() => setConfig((c) => ({ ...c, useCustomImage: true }))}
              >
                {t.useCustomImage}
              </Button>
            </div>

            {config.useCustomImage ? (
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
                      onClick={() => void onRemoveImage()}
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
                setConfig((c) => ({
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
                value={config.title.en}
                onChange={(e) => setConfig((c) => ({ ...c, title: { ...c.title, en: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {t.promoTitle} — {t.titleAr}
              </Label>
              <Input
                value={config.title.ar}
                dir="rtl"
                onChange={(e) => setConfig((c) => ({ ...c, title: { ...c.title, ar: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {t.cta} — {t.ctaEn}
              </Label>
              <Input
                value={config.cta.en}
                onChange={(e) => setConfig((c) => ({ ...c, cta: { ...c.cta, en: e.target.value } }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                {t.cta} — {t.ctaAr}
              </Label>
              <Input
                value={config.cta.ar}
                dir="rtl"
                onChange={(e) => setConfig((c) => ({ ...c, cta: { ...c.cta, ar: e.target.value } }))}
              />
            </div>
          </div>

          <Button type="button" className="btn-primary" disabled={saveBusy} onClick={() => void onSave()}>
            {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {t.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPromotionsPanel;
