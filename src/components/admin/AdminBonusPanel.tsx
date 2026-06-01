import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gift, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getCatalogSections } from '@/lib/catalog';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import { saleModeLabel } from '@/lib/productSaleModes';
import {
  readSectionBonusConfig,
  writeSectionBonusConfig,
  SECTION_BONUS_CHANGED,
  type SectionBonusConfig,
  type SectionBonusSaleMode,
  type SectionBonusTier,
  DEFAULT_SECTION_BONUS,
  normalizeBoxTiers,
} from '@/lib/sectionBonus';

type Props = {
  language: 'en' | 'ar';
};

type TierField = 'unitTiers' | 'boxTiers';

const AdminBonusPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const [bonusConfig, setBonusConfig] = useState<SectionBonusConfig>(() => readSectionBonusConfig());
  const [sections, setSections] = useState(() => getCatalogSections());
  const [saveBusy, setSaveBusy] = useState(false);

  const reload = useCallback(() => {
    setBonusConfig(readSectionBonusConfig());
    setSections(getCatalogSections());
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(SECTION_BONUS_CHANGED, onChange);
    window.addEventListener(CATALOG_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(SECTION_BONUS_CHANGED, onChange);
      window.removeEventListener(CATALOG_CHANGED_EVENT, onChange);
    };
  }, [reload]);

  const sectionOptions = useMemo(
    () => sections.map((s) => ({ id: s.id, label: `${s.title?.en || s.id} (${s.id})` })),
    [sections],
  );

  const t =
    language === 'ar'
      ? {
          title: 'بونص',
          desc: 'يمكن تفعيل بونص الحبة وبونص البوكس معاً على نفس القسم.',
          enabled: 'تفعيل نظام البونص',
          unitEnabled: 'بونص الحبة',
          boxEnabled: 'بونص البوكس',
          section: 'القسم المستهدف',
          unitsPerBox: 'حبات في البوكس (افتراضي)',
          unitsPerBoxHint: 'بونص الحبة والبوكس منفصلان — البوكس لا يُحسب ضمن عداد الحبات.',
          unitTiersTitle: 'مستويات بونص الحبة',
          unitTiersDesc: 'مثال: 5 مدفوعة + 1 مجانية — البونص يبدأ عند 6 حبات (مجموعة كاملة).',
          boxTiersTitle: 'مستويات بونص البوكس',
          boxTiersDesc: 'مثال: 3 مدفوعة + 1 مجانية — البونص عند 4 بوكسات (مجموعة كاملة).',
          tierBuyUnit: 'حبات مدفوعة',
          tierFreeUnit: 'حبات مجانية',
          tierBuyBox: 'بوكسات مدفوعة',
          tierFreeBox: 'بوكسات مجانية',
          addTier: 'إضافة مستوى',
          removeTier: 'حذف',
          save: 'حفظ البونص',
          saved: 'تم حفظ البونص',
          saveFail: 'تعذر الحفظ',
          needTrack: 'فعّل بونص الحبة أو البوكس على الأقل.',
        }
      : {
          title: 'Bonus',
          desc: 'Unit and box bonuses can both be active on the same section.',
          enabled: 'Enable bonus system',
          unitEnabled: 'Unit bonus',
          boxEnabled: 'Box bonus',
          section: 'Target section',
          unitsPerBox: 'Units per box (default)',
          unitsPerBoxHint: 'Unit and box bonuses are separate — boxes do not count toward unit bonus.',
          unitTiersTitle: 'Unit bonus tiers',
          unitTiersDesc: 'e.g. 5 paid + 1 free — bonus starts at 6 units (full set).',
          boxTiersTitle: 'Box bonus tiers',
          boxTiersDesc: 'e.g. 3 paid + 1 free — bonus starts at 4 boxes (full set).',
          tierBuyUnit: 'Paid units',
          tierFreeUnit: 'Free units',
          tierBuyBox: 'Paid boxes',
          tierFreeBox: 'Free boxes',
          addTier: 'Add tier',
          removeTier: 'Remove',
          save: 'Save bonus',
          saved: 'Bonus saved',
          saveFail: 'Could not save',
          needTrack: 'Enable at least unit or box bonus.',
        };

  const applyBonusPatch = useCallback(
    (patch: Partial<SectionBonusConfig>, showToast = false) => {
      setBonusConfig((current) => {
        const next: SectionBonusConfig = {
          ...current,
          ...patch,
          unitTiers: normalizeBoxTiers(patch.unitTiers ?? current.unitTiers, 'unit'),
          boxTiers: normalizeBoxTiers(patch.boxTiers ?? current.boxTiers, 'box'),
        };
        const ok = writeSectionBonusConfig(next);
        if (showToast) {
          toast[ok ? 'success' : 'error'](ok ? t.saved : t.saveFail);
        }
        return next;
      });
    },
    [t.saved, t.saveFail],
  );

  const onSave = () => {
    if (bonusConfig.enabled && !bonusConfig.unitBonusEnabled && !bonusConfig.boxBonusEnabled) {
      toast.error(t.needTrack);
      return;
    }
    setSaveBusy(true);
    applyBonusPatch({}, true);
    setSaveBusy(false);
  };

  const updateTier = (field: TierField, index: number, patch: Partial<SectionBonusTier>) => {
    setBonusConfig((c) => ({
      ...c,
      [field]: c[field].map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    }));
  };

  const addTier = (field: TierField, track: SectionBonusSaleMode) => {
    setBonusConfig((c) => ({
      ...c,
      [field]: [...c[field], { buyQuantity: track === 'box' ? 3 : 5, freeQuantity: 1 }],
    }));
  };

  const removeTier = (field: TierField, index: number) => {
    setBonusConfig((c) => ({
      ...c,
      [field]: c[field].filter((_, i) => i !== index),
    }));
  };

  const renderTiers = (field: TierField, track: SectionBonusSaleMode, enabled: boolean) => {
    if (!enabled) return null;
    const tiers = bonusConfig[field];
    const isBox = track === 'box';
    return (
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isBox ? t.boxTiersTitle : t.unitTiersTitle}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isBox ? t.boxTiersDesc : t.unitTiersDesc}
          </p>
        </div>
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <div
              key={`${field}-${index}`}
              className="grid gap-3 rounded-lg border border-border/50 bg-background/60 p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label>{isBox ? t.tierBuyBox : t.tierBuyUnit}</Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.buyQuantity}
                  onChange={(e) =>
                    updateTier(field, index, {
                      buyQuantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{isBox ? t.tierFreeBox : t.tierFreeUnit}</Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.freeQuantity}
                  onChange={(e) =>
                    updateTier(field, index, {
                      freeQuantity: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive"
                  disabled={tiers.length <= 1}
                  onClick={() => removeTier(field, index)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t.removeTier}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => addTier(field, track)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t.addTier}
        </Button>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1 text-start">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" aria-hidden />
            {t.title}
          </CardTitle>
          <CardDescription>{t.desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
            <Label htmlFor="section-bonus-enabled" className="cursor-pointer text-sm font-medium">
              {t.enabled}
            </Label>
            <Switch
              id="section-bonus-enabled"
              checked={bonusConfig.enabled}
              onCheckedChange={(checked) => applyBonusPatch({ enabled: checked })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t.section}</Label>
            <Select
              value={bonusConfig.sectionId ?? DEFAULT_SECTION_BONUS.sectionId ?? ''}
              onValueChange={(val) => setBonusConfig((c) => ({ ...c, sectionId: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.section} />
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {sectionOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="unit-bonus-enabled" className="cursor-pointer text-sm font-medium">
                {saleModeLabel('unit', language)} — {t.unitEnabled}
              </Label>
              <Switch
                id="unit-bonus-enabled"
                checked={bonusConfig.unitBonusEnabled}
                onCheckedChange={(checked) => applyBonusPatch({ unitBonusEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="box-bonus-enabled" className="cursor-pointer text-sm font-medium">
                {saleModeLabel('box', language)} — {t.boxEnabled}
              </Label>
              <Switch
                id="box-bonus-enabled"
                checked={bonusConfig.boxBonusEnabled}
                onCheckedChange={(checked) => applyBonusPatch({ boxBonusEnabled: checked })}
              />
            </div>
          </div>

          {bonusConfig.unitBonusEnabled ? (
            <div className="space-y-1.5">
              <Label>{t.unitsPerBox}</Label>
              <Input
                type="number"
                min={1}
                value={bonusConfig.unitsPerBox}
                onChange={(e) =>
                  setBonusConfig((c) => ({
                    ...c,
                    unitsPerBox: Math.max(1, Number(e.target.value) || DEFAULT_SECTION_BONUS.unitsPerBox),
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">{t.unitsPerBoxHint}</p>
            </div>
          ) : null}

          {renderTiers('unitTiers', 'unit', bonusConfig.unitBonusEnabled)}
          {renderTiers('boxTiers', 'box', bonusConfig.boxBonusEnabled)}

          <Button type="button" className="btn-primary" disabled={saveBusy} onClick={onSave}>
            {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {t.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBonusPanel;
