import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Gift, History, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import { formatDateTime } from '@/lib/formatNumbers';
import { saleModeLabel } from '@/lib/productSaleModes';
import {
  readSectionBonusConfig,
  writeSectionBonusConfig,
  readLastUsedSectionBonusConfig,
  restoreLastUsedSectionBonusConfig,
  writeLastUsedSectionBonusConfig,
  clearLastUsedSectionBonusConfig,
  SECTION_BONUS_CHANGED,
  sectionBonusLabels,
  cloneSectionBonusConfig,
  type SectionBonusConfig,
  type SectionBonusSaleMode,
  type SectionBonusTier,
  DEFAULT_SECTION_BONUS,
  normalizeBoxTiers,
} from '@/lib/sectionBonus';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
};

type TierField = 'unitTiers' | 'boxTiers';

function normalizeConfig(config: SectionBonusConfig): SectionBonusConfig {
  return {
    ...config,
    unitTiers: normalizeBoxTiers(config.unitTiers, 'unit'),
    boxTiers: normalizeBoxTiers(config.boxTiers, 'box'),
  };
}

function isInvalidEnabledState(config: SectionBonusConfig): boolean {
  return config.enabled && !config.unitBonusEnabled && !config.boxBonusEnabled;
}

function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-start', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function sectionLabel(
  sectionId: string | null,
  sections: ReturnType<typeof getCatalogSections>,
  language: 'en' | 'ar',
): string {
  if (!sectionId) return '—';
  const sec = sections.find((s) => s.id === sectionId);
  if (!sec) return sectionId;
  return sec.title[language] || sec.title.en || sectionId;
}

const AdminBonusPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const [bonusConfig, setBonusConfig] = useState<SectionBonusConfig>(() => readSectionBonusConfig());
  const [lastUsed, setLastUsed] = useState(() => readLastUsedSectionBonusConfig());
  const [sections, setSections] = useState(() => getCatalogSections());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSource, setDialogSource] = useState<'current' | 'lastUsed'>('current');
  const [draft, setDraft] = useState<SectionBonusConfig>(() => cloneSectionBonusConfig(readSectionBonusConfig()));
  const [saveBusy, setSaveBusy] = useState(false);

  const reload = useCallback(() => {
    setBonusConfig(readSectionBonusConfig());
    setLastUsed(readLastUsedSectionBonusConfig());
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
    () =>
      sections.map((s) => ({
        id: s.id,
        label: s.title[language] || s.title.en || s.id,
      })),
    [sections, language],
  );

  const t =
    language === 'ar'
      ? {
          setupBonus: 'إعداد البونص',
          editBonus: 'تعديل البونص',
          dialogTitle: 'إعداد بونص القسم',
          dialogDesc: 'فعّل البونص، اختر القسم، وحدّد مستويات الحبة والبوكس.',
          statStatus: 'الحالة',
          statSection: 'القسم',
          statTracks: 'المسارات',
          active: 'مفعّل',
          inactive: 'معطّل',
          currentTitle: 'البونص الحالي',
          currentDesc: 'ما يظهر للعملاء في المتجر الآن.',
          lastUsedTitle: 'آخر بونص مستخدم',
          lastUsedDesc: 'آخر إعداد كان مفعّلاً — أعد استخدامه بضغطة واحدة.',
          lastUsedEmpty: 'لا يوجد بونص سابق محفوظ بعد.',
          lastUsedAt: 'آخر استخدام',
          restore: 'إعادة الاستخدام',
          editLastUsed: 'تعديل',
          deleteLastUsed: 'حذف',
          deletedLastUsed: 'تم حذف آخر بونص محفوظ',
          lastUsedDialogTitle: 'تعديل آخر بونص محفوظ',
          lastUsedDialogDesc: 'عدّل الإعداد المحفوظ ثم احفظ لتفعيله في المتجر وتحديث النسخة المحفوظة.',
          restored: 'تم تفعيل آخر بونص محفوظ',
          restoreFail: 'لا يوجد بونص سابق',
          enabled: 'تفعيل نظام البونص',
          unitEnabled: 'بونص الحبة',
          boxEnabled: 'بونص البوكس',
          section: 'القسم المستهدف',
          formGeneral: 'عام',
          formTracks: 'المسارات',
          unitsPerBox: 'حبات في البوكس',
          unitsPerBoxHint: 'البوكس لا يُحسب ضمن عداد الحبات.',
          unitTiersTitle: 'مستويات الحبة',
          boxTiersTitle: 'مستويات البوكس',
          tierBuyUnit: 'مدفوعة',
          tierFreeUnit: 'مجانية',
          tierBuyBox: 'بوكس مدفوع',
          tierFreeBox: 'بوكس مجاني',
          addTier: 'مستوى',
          removeTier: 'حذف',
          save: 'حفظ',
          cancel: 'إلغاء',
          saving: 'جارٍ الحفظ…',
          saved: 'تم حفظ البونص',
          disabled: 'تم إيقاف البونص',
          saveFail: 'تعذر الحفظ',
          needTrack: 'فعّل بونص الحبة أو البوكس على الأقل.',
          noSection: 'اختر قسماً',
        }
      : {
          setupBonus: 'Set up bonus',
          editBonus: 'Edit bonus',
          dialogTitle: 'Section bonus setup',
          dialogDesc: 'Enable the bonus, pick a section, and set unit/box tiers.',
          statStatus: 'Status',
          statSection: 'Section',
          statTracks: 'Tracks',
          active: 'Active',
          inactive: 'Off',
          currentTitle: 'Current bonus',
          currentDesc: 'What customers see in the store right now.',
          lastUsedTitle: 'Last used bonus',
          lastUsedDesc: 'Last active setup — re-apply it with one click.',
          lastUsedEmpty: 'No previous bonus saved yet.',
          lastUsedAt: 'Last used',
          restore: 'Use again',
          editLastUsed: 'Edit',
          deleteLastUsed: 'Delete',
          deletedLastUsed: 'Saved last bonus removed',
          lastUsedDialogTitle: 'Edit last used bonus',
          lastUsedDialogDesc: 'Change the saved setup, then save to apply it in the store and update the snapshot.',
          restored: 'Last saved bonus is active again',
          restoreFail: 'No previous bonus to restore',
          enabled: 'Enable bonus system',
          unitEnabled: 'Unit bonus',
          boxEnabled: 'Box bonus',
          section: 'Target section',
          formGeneral: 'General',
          formTracks: 'Tracks',
          unitsPerBox: 'Units per box',
          unitsPerBoxHint: 'Boxes do not count toward unit bonus.',
          unitTiersTitle: 'Unit tiers',
          boxTiersTitle: 'Box tiers',
          tierBuyUnit: 'Paid',
          tierFreeUnit: 'Free',
          tierBuyBox: 'Paid boxes',
          tierFreeBox: 'Free boxes',
          addTier: 'Tier',
          removeTier: 'Remove',
          save: 'Save',
          cancel: 'Cancel',
          saving: 'Saving…',
          saved: 'Bonus saved',
          disabled: 'Bonus disabled',
          saveFail: 'Could not save',
          needTrack: 'Enable at least unit or box bonus.',
          noSection: 'Pick a section',
        };

  const trackSummary = (config: SectionBonusConfig) => {
    const parts: string[] = [];
    if (config.unitBonusEnabled) parts.push(saleModeLabel('unit', language));
    if (config.boxBonusEnabled) parts.push(saleModeLabel('box', language));
    return parts.length > 0 ? parts.join(' · ') : '—';
  };

  const openDialog = () => {
    setDialogSource('current');
    setDraft(cloneSectionBonusConfig(bonusConfig));
    setDialogOpen(true);
  };

  const openLastUsedDialog = () => {
    if (!lastUsed) return;
    setDialogSource('lastUsed');
    setDraft(cloneSectionBonusConfig(lastUsed.config));
    setDialogOpen(true);
  };

  const handleDeleteLastUsed = () => {
    if (!lastUsed) return;
    if (clearLastUsedSectionBonusConfig()) {
      reload();
      toast.success(t.deletedLastUsed);
    } else {
      toast.error(t.saveFail);
    }
  };

  const persistConfig = (next: SectionBonusConfig, closeDialog = false) => {
    const normalized = normalizeConfig(next);
    if (isInvalidEnabledState(normalized)) {
      toast.error(t.needTrack);
      return false;
    }
    if (normalized.enabled && !normalized.sectionId) {
      toast.error(t.noSection);
      return false;
    }
    const ok = writeSectionBonusConfig(normalized);
    if (!ok) {
      toast.error(t.saveFail);
      return false;
    }
    reload();
    if (closeDialog) setDialogOpen(false);
    return true;
  };

  const handleSave = () => {
    setSaveBusy(true);
    try {
      const normalized = normalizeConfig(draft);
      if (isInvalidEnabledState(normalized)) {
        toast.error(t.needTrack);
        return;
      }
      if (normalized.enabled && !normalized.sectionId) {
        toast.error(t.noSection);
        return;
      }
      const ok =
        dialogSource === 'lastUsed'
          ? writeSectionBonusConfig(normalized) && writeLastUsedSectionBonusConfig(normalized)
          : persistConfig(normalized, false);
      if (!ok) {
        toast.error(t.saveFail);
        return;
      }
      reload();
      setDialogOpen(false);
      toast.success(normalized.enabled ? t.saved : t.disabled);
    } finally {
      setSaveBusy(false);
    }
  };

  const handleRestore = () => {
    if (!lastUsed) {
      toast.error(t.restoreFail);
      return;
    }
    if (restoreLastUsedSectionBonusConfig()) {
      reload();
      toast.success(t.restored);
    } else {
      toast.error(t.saveFail);
    }
  };

  const toggleEnabledOnPage = (checked: boolean) => {
    const next = { ...bonusConfig, enabled: checked };
    if (isInvalidEnabledState(next)) {
      toast.error(t.needTrack);
      return;
    }
    if (checked && !next.sectionId) {
      openDialog();
      return;
    }
    if (persistConfig(next)) {
      toast.success(checked ? t.saved : t.disabled);
    }
  };

  const updateTier = (field: TierField, index: number, patch: Partial<SectionBonusTier>) => {
    setDraft((c) => ({
      ...c,
      [field]: c[field].map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    }));
  };

  const addTier = (field: TierField, track: SectionBonusSaleMode) => {
    setDraft((c) => ({
      ...c,
      [field]: [...c[field], { buyQuantity: track === 'box' ? 3 : 5, freeQuantity: 1 }],
    }));
  };

  const removeTier = (field: TierField, index: number) => {
    setDraft((c) => ({
      ...c,
      [field]: c[field].filter((_, i) => i !== index),
    }));
  };

  const renderTierRows = (field: TierField, track: SectionBonusSaleMode) => {
    const tiers = draft[field];
    const isBox = track === 'box';
    return (
      <div className="space-y-2">
        {tiers.map((tier, index) => (
          <div
            key={`${field}-${index}`}
            className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-md border border-border/50 bg-background/70 p-2"
          >
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isBox ? t.tierBuyBox : t.tierBuyUnit}</Label>
              <Input
                type="number"
                min={1}
                className="h-8"
                value={tier.buyQuantity}
                onChange={(e) =>
                  updateTier(field, index, {
                    buyQuantity: Math.max(1, Number(e.target.value) || 1),
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{isBox ? t.tierFreeBox : t.tierFreeUnit}</Label>
              <Input
                type="number"
                min={1}
                className="h-8"
                value={tier.freeQuantity}
                onChange={(e) =>
                  updateTier(field, index, {
                    freeQuantity: Math.max(1, Number(e.target.value) || 1),
                  })
                }
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              disabled={tiers.length <= 1}
              aria-label={t.removeTier}
              onClick={() => removeTier(field, index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => addTier(field, track)}
        >
          <Plus className="h-3.5 w-3.5" />
          {t.addTier}
        </Button>
      </div>
    );
  };

  const currentLabels = sectionBonusLabels(bonusConfig, language);
  const lastLabels = lastUsed ? sectionBonusLabels(lastUsed.config, language) : [];

  const formBody = (
    <div className="grid gap-4 md:grid-cols-2 md:items-stretch">
      <FormSection title={t.formGeneral} className="h-full">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/80 px-3 py-2">
            <Label htmlFor="bonus-dialog-enabled" className="cursor-pointer text-sm">
              {t.enabled}
            </Label>
            <Switch
              id="bonus-dialog-enabled"
              checked={draft.enabled}
              onCheckedChange={(checked) => setDraft((c) => ({ ...c, enabled: checked }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t.section}</Label>
            <Select
              value={draft.sectionId ?? DEFAULT_SECTION_BONUS.sectionId ?? ''}
              onValueChange={(val) => setDraft((c) => ({ ...c, sectionId: val }))}
            >
              <SelectTrigger className="h-9">
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
          {draft.unitBonusEnabled ? (
            <div className="space-y-1.5">
              <Label>{t.unitsPerBox}</Label>
              <Input
                type="number"
                min={1}
                className="h-9"
                value={draft.unitsPerBox}
                onChange={(e) =>
                  setDraft((c) => ({
                    ...c,
                    unitsPerBox: Math.max(1, Number(e.target.value) || DEFAULT_SECTION_BONUS.unitsPerBox),
                  }))
                }
              />
              <p className="text-[11px] text-muted-foreground">{t.unitsPerBoxHint}</p>
            </div>
          ) : null}
        </div>
      </FormSection>

      <FormSection title={t.formTracks} className="h-full">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/80 px-3 py-2">
            <Label htmlFor="unit-bonus-dialog" className="cursor-pointer text-sm">
              {saleModeLabel('unit', language)} — {t.unitEnabled}
            </Label>
            <Switch
              id="unit-bonus-dialog"
              checked={draft.unitBonusEnabled}
              onCheckedChange={(checked) => setDraft((c) => ({ ...c, unitBonusEnabled: checked }))}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/80 px-3 py-2">
            <Label htmlFor="box-bonus-dialog" className="cursor-pointer text-sm">
              {saleModeLabel('box', language)} — {t.boxEnabled}
            </Label>
            <Switch
              id="box-bonus-dialog"
              checked={draft.boxBonusEnabled}
              onCheckedChange={(checked) => setDraft((c) => ({ ...c, boxBonusEnabled: checked }))}
            />
          </div>
        </div>
      </FormSection>

      {draft.unitBonusEnabled ? (
        <FormSection title={t.unitTiersTitle} className="h-full">
          {renderTierRows('unitTiers', 'unit')}
        </FormSection>
      ) : null}

      {draft.boxBonusEnabled ? (
        <FormSection title={t.boxTiersTitle} className={cn('h-full', !draft.unitBonusEnabled && 'md:col-span-2')}>
          {renderTierRows('boxTiers', 'box')}
        </FormSection>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <div className="flex justify-end">
        <Button type="button" className="btn-primary shrink-0 gap-2" onClick={openDialog}>
          <Plus className="h-4 w-4" aria-hidden />
          {bonusConfig.enabled ? t.editBonus : t.setupBonus}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-start shadow-sm">
          <p className="text-xs text-muted-foreground">{t.statStatus}</p>
          <p className="mt-1 text-lg font-semibold">{bonusConfig.enabled ? t.active : t.inactive}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-start shadow-sm">
          <p className="text-xs text-muted-foreground">{t.statSection}</p>
          <p className="mt-1 truncate text-sm font-semibold">
            {sectionLabel(bonusConfig.sectionId, sections, language)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card px-4 py-3 text-start shadow-sm">
          <p className="text-xs text-muted-foreground">{t.statTracks}</p>
          <p className="mt-1 truncate text-sm font-semibold">{trackSummary(bonusConfig)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-3 text-start">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gift className="h-4 w-4 text-primary" />
                {t.currentTitle}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="bonus-page-enabled" className="text-xs text-muted-foreground">
                  {t.enabled}
                </Label>
                <Switch id="bonus-page-enabled" checked={bonusConfig.enabled} onCheckedChange={toggleEnabledOnPage} />
              </div>
            </div>
            <CardDescription>{t.currentDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-start">
            <p className="text-sm font-medium">{sectionLabel(bonusConfig.sectionId, sections, language)}</p>
            <p className="text-xs text-muted-foreground">{trackSummary(bonusConfig)}</p>
            {currentLabels.length > 0 ? (
              <ul className="space-y-1">
                {currentLabels.map((line) => (
                  <li key={line}>
                    <Badge variant="secondary" className="font-normal">
                      {line}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            <Button type="button" variant="outline" size="sm" className="mt-2 gap-2" onClick={openDialog}>
              <Pencil className="h-4 w-4" />
              {t.editBonus}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-1 pb-3 text-start">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" />
              {t.lastUsedTitle}
            </CardTitle>
            <CardDescription>{t.lastUsedDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-start">
            {lastUsed ? (
              <>
                <p className="text-[11px] text-muted-foreground">
                  {t.lastUsedAt}:{' '}
                  {formatDateTime(new Date(lastUsed.savedAt), language, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="text-sm font-medium">{sectionLabel(lastUsed.config.sectionId, sections, language)}</p>
                <p className="text-xs text-muted-foreground">{trackSummary(lastUsed.config)}</p>
                <ul className="space-y-1">
                  {lastLabels.map((line) => (
                    <li key={line}>
                      <Badge variant="outline" className="font-normal">
                        {line}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" className="gap-2" onClick={handleRestore}>
                    <History className="h-4 w-4" />
                    {t.restore}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openLastUsedDialog}>
                    <Pencil className="h-4 w-4" />
                    {t.editLastUsed}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 text-destructive hover:text-destructive"
                    onClick={handleDeleteLastUsed}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.deleteLastUsed}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t.lastUsedEmpty}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-[min(52rem,96vw)] gap-0 overflow-visible p-0 sm:max-w-4xl"
          dir={isRtl ? 'rtl' : 'ltr'}
          lang={isRtl ? 'ar' : 'en'}
        >
          <DialogHeader className="space-y-1 border-b border-border/60 px-5 py-4 text-start sm:px-6">
            <DialogTitle className="flex items-center gap-2 text-start">
              <Gift className="h-5 w-5 text-primary" aria-hidden />
              {dialogSource === 'lastUsed' ? t.lastUsedDialogTitle : t.dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-start">
              {dialogSource === 'lastUsed' ? t.lastUsedDialogDesc : t.dialogDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4 sm:px-6">{formBody}</div>
          <DialogFooter className="gap-2 border-t border-border/60 bg-muted/15 px-5 py-4 sm:justify-end sm:px-6">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={saveBusy}>
              {t.cancel}
            </Button>
            <Button type="button" className="gap-2" onClick={() => void handleSave()} disabled={saveBusy}>
              {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saveBusy ? t.saving : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBonusPanel;
