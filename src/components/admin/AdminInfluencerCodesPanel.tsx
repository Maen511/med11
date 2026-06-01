import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bell, Filter, Loader2, Pencil, Plus, Search, Tag, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  deleteInfluencerCode,
  filterInfluencerCodesForAdmin,
  formatCodeDiscountLabel,
  formatInfluencerCodeSectionLabel,
  INFLUENCER_CODES_CHANGED,
  isInfluencerCodeExpired,
  normalizePromoCodeInput,
  readInfluencerCodes,
  toggleInfluencerCodeEnabled,
  type InfluencerCode,
  type InfluencerCodeListFilter,
  type InfluencerDiscountType,
  type InfluencerSectionScope,
  upsertInfluencerCode,
} from '@/lib/influencerCodes';
import { formatDate, formatNumber } from '@/lib/formatNumbers';
import { getCatalogSections } from '@/lib/catalog';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import { cn } from '@/lib/utils';
import { useAdminPromoCodeNotifications } from '@/hooks/useAdminPromoCodeNotifications';
import {
  formatPromoUseNotificationBody,
  resolvePromoNotificationCustomerName,
} from '@/lib/adminPromoCodeNotifications';
import { formatDateTime } from '@/lib/formatNumbers';

type Props = {
  language: 'en' | 'ar';
};

const DEFAULT_LIST_FILTER = (): InfluencerCodeListFilter => ({
  query: '',
  status: 'all',
  discountType: 'all',
  expiry: 'all',
  sectionId: 'all',
});

const emptyForm = () => ({
  id: '' as string,
  code: '',
  influencerName: '',
  discountType: 'percent' as InfluencerDiscountType,
  discountValue: '10',
  enabled: true,
  expiresAt: '',
  maxUses: '',
  sectionScope: 'all' as InfluencerSectionScope,
  sectionId: '',
});

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
    <div className={cn('space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4', className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-start">{title}</p>
      {children}
    </div>
  );
}

const AdminInfluencerCodesPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const [codes, setCodes] = useState<InfluencerCode[]>(() => readInfluencerCodes());
  const [form, setForm] = useState(emptyForm);
  const [saveBusy, setSaveBusy] = useState(false);
  const [listFilter, setListFilter] = useState<InfluencerCodeListFilter>(DEFAULT_LIST_FILTER);
  const [sections, setSections] = useState(() => getCatalogSections());
  const { notifications: promoNotifications, unreadCount: promoUnread, markAllRead: markAllPromoRead } =
    useAdminPromoCodeNotifications();
  const lang = isRtl ? 'ar' : 'en';

  const reload = useCallback(() => {
    setCodes(readInfluencerCodes());
    setSections(getCatalogSections());
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(INFLUENCER_CODES_CHANGED, onChange);
    window.addEventListener(CATALOG_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(INFLUENCER_CODES_CHANGED, onChange);
      window.removeEventListener(CATALOG_CHANGED_EVENT, onChange);
    };
  }, [reload]);

  const sectionTitleById = useMemo(() => {
    const map = new Map<string, { en: string; ar: string }>();
    for (const sec of sections) {
      map.set(sec.id, sec.title);
    }
    return map;
  }, [sections]);

  const t =
    language === 'ar'
      ? {
          pageDesc: 'أنشئ كود خصم لكل إنفلونسر — يُدخله العميل عند الدفع.',
          newCode: 'كود جديد',
          editCode: 'تعديل الكود',
          formBasic: 'البيانات الأساسية',
          formDiscount: 'الخصم',
          formScope: 'نطاق التطبيق',
          formLimits: 'الحدود والتفعيل',
          code: 'كود الخصم',
          codeHint: 'أحرف إنجليزية وأرقام فقط',
          influencer: 'اسم الإنفلونسر',
          discountType: 'نوع الخصم',
          percent: 'نسبة مئوية',
          fixed: 'مبلغ ثابت (د.أ)',
          value: 'قيمة الخصم',
          expiry: 'تاريخ الانتهاء',
          maxUses: 'حد الاستخدام',
          optional: 'اختياري',
          enabled: 'الكود مفعّل',
          save: 'حفظ الكود',
          cancel: 'إلغاء',
          list: 'الأكواد المحفوظة',
          uses: 'الاستخدام',
          noExpiry: 'بدون انتهاء',
          empty: 'لا توجد أكواد بعد. أنشئ أول كود من النموذج.',
          saved: 'تم حفظ الكود',
          deleted: 'تم حذف الكود',
          duplicate: 'هذا الكود مستخدم مسبقاً',
          invalid: 'تحقق من الحقول',
          filters: 'بحث وفلترة',
          filterSearch: 'ابحث بالكود أو اسم الإنفلونسر…',
          filterStatus: 'الحالة',
          filterStatusAll: 'الكل',
          filterStatusOn: 'مفعّل',
          filterStatusOff: 'معطّل',
          filterType: 'نوع الخصم',
          filterTypeAll: 'الكل',
          filterExpiry: 'الصلاحية',
          filterExpiryAll: 'الكل',
          filterExpiryActive: 'ساري',
          filterExpiryExpired: 'منتهي',
          clearFilters: 'مسح الفلاتر',
          showingCount: 'عرض',
          noFilterMatch: 'لا توجد أكواد تطابق البحث.',
          sectionAll: 'كل الأقسام',
          sectionOne: 'قسم واحد فقط',
          pickSection: 'اختر القسم',
          filterSection: 'القسم',
          filterSectionAll: 'كل الأقسام',
          sectionRequired: 'اختر القسم للخصم',
          statTotal: 'إجمالي الأكواد',
          statActive: 'مفعّلة',
          statUses: 'مرات الاستخدام',
          colCode: 'الكود',
          colInfluencer: 'الإنفلونسر',
          colDiscount: 'الخصم',
          colSection: 'القسم',
          colUses: 'الاستخدام',
          colStatus: 'الحالة',
          edit: 'تعديل',
          off: 'معطّل',
          expired: 'منتهي',
        }
      : {
          pageDesc: 'Create a promo code per influencer — customers enter it at checkout.',
          newCode: 'New code',
          editCode: 'Edit code',
          formBasic: 'Basic details',
          formDiscount: 'Discount',
          formScope: 'Where it applies',
          formLimits: 'Limits & status',
          code: 'Promo code',
          codeHint: 'Letters and numbers only',
          influencer: 'Influencer name',
          discountType: 'Discount type',
          percent: 'Percentage',
          fixed: 'Fixed amount (JOD)',
          value: 'Discount value',
          expiry: 'Expiry date',
          maxUses: 'Usage limit',
          optional: 'optional',
          enabled: 'Code is active',
          save: 'Save code',
          cancel: 'Cancel',
          list: 'Saved codes',
          uses: 'Usage',
          noExpiry: 'No expiry',
          empty: 'No codes yet. Create your first code using the form.',
          saved: 'Code saved',
          deleted: 'Code deleted',
          duplicate: 'This code already exists',
          invalid: 'Check the form fields',
          filters: 'Search & filters',
          filterSearch: 'Search code or influencer…',
          filterStatus: 'Status',
          filterStatusAll: 'All',
          filterStatusOn: 'Enabled',
          filterStatusOff: 'Disabled',
          filterType: 'Discount type',
          filterTypeAll: 'All',
          filterExpiry: 'Validity',
          filterExpiryAll: 'All',
          filterExpiryActive: 'Active',
          filterExpiryExpired: 'Expired',
          clearFilters: 'Clear filters',
          showingCount: 'Showing',
          noFilterMatch: 'No codes match your search.',
          sectionAll: 'All sections',
          sectionOne: 'One section only',
          pickSection: 'Select section',
          filterSection: 'Section',
          filterSectionAll: 'All sections',
          sectionRequired: 'Select a section for this code',
          statTotal: 'Total codes',
          statActive: 'Active',
          statUses: 'Total redemptions',
          colCode: 'Code',
          colInfluencer: 'Influencer',
          colDiscount: 'Discount',
          colSection: 'Section',
          colUses: 'Uses',
          colStatus: 'Status',
          edit: 'Edit',
          off: 'Off',
          expired: 'Expired',
        };

  const editing = Boolean(form.id);

  const resetForm = () => setForm(emptyForm());

  const startEdit = (row: InfluencerCode) => {
    setForm({
      id: row.id,
      code: row.code,
      influencerName: row.influencerName,
      discountType: row.discountType,
      discountValue: String(row.discountValue),
      enabled: row.enabled,
      expiresAt: row.expiresAt
        ? (() => {
            const d = new Date(row.expiresAt);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          })()
        : '',
      maxUses: row.maxUses != null ? String(row.maxUses) : '',
      sectionScope: row.sectionScope,
      sectionId: row.sectionId ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    const code = normalizePromoCodeInput(form.code);
    const influencerName = form.influencerName.trim();
    const discountValue = Number(form.discountValue);
    if (!code || !influencerName || !Number.isFinite(discountValue) || discountValue <= 0) {
      toast.error(t.invalid);
      return;
    }
    if (form.discountType === 'percent' && discountValue > 100) {
      toast.error(t.invalid);
      return;
    }
    if (form.sectionScope === 'section' && !form.sectionId.trim()) {
      toast.error(t.sectionRequired);
      return;
    }

    let expiresAt: number | null | undefined;
    if (form.expiresAt.trim()) {
      const d = new Date(`${form.expiresAt.trim()}T23:59:59`);
      if (Number.isNaN(d.getTime())) {
        toast.error(t.invalid);
        return;
      }
      expiresAt = d.getTime();
    } else {
      expiresAt = null;
    }

    let maxUses: number | null | undefined;
    if (form.maxUses.trim()) {
      const n = Math.floor(Number(form.maxUses));
      if (!Number.isFinite(n) || n < 1) {
        toast.error(t.invalid);
        return;
      }
      maxUses = n;
    } else {
      maxUses = null;
    }

    setSaveBusy(true);
    try {
      const existing = codes.find((c) => c.id === form.id);
      upsertInfluencerCode({
        id: editing ? form.id : undefined,
        code,
        influencerName,
        discountType: form.discountType,
        discountValue,
        enabled: form.enabled,
        expiresAt,
        maxUses,
        sectionScope: form.sectionScope,
        sectionId: form.sectionScope === 'section' ? form.sectionId.trim() : null,
        createdAt: existing?.createdAt,
        usedCount: existing?.usedCount,
      });
      toast.success(t.saved);
      resetForm();
      reload();
    } catch (err) {
      const msg =
        err instanceof Error && err.message === 'duplicate_code'
          ? t.duplicate
          : err instanceof Error && err.message === 'invalid_section'
            ? t.sectionRequired
            : t.invalid;
      toast.error(msg);
    } finally {
      setSaveBusy(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteInfluencerCode(id);
    toast.success(t.deleted);
    if (form.id === id) resetForm();
    reload();
  };

  const sortedCodes = useMemo(() => [...codes], [codes]);

  const filteredCodes = useMemo(
    () => filterInfluencerCodesForAdmin(sortedCodes, listFilter),
    [sortedCodes, listFilter],
  );

  const hasActiveFilters = useMemo(
    () =>
      listFilter.query.trim().length > 0 ||
      listFilter.status !== 'all' ||
      listFilter.discountType !== 'all' ||
      listFilter.expiry !== 'all' ||
      listFilter.sectionId !== 'all',
    [listFilter],
  );

  const stats = useMemo(() => {
    const active = codes.filter((c) => c.enabled && !isInfluencerCodeExpired(c)).length;
    const totalUses = codes.reduce((n, c) => n + c.usedCount, 0);
    return { total: codes.length, active, totalUses };
  }, [codes]);

  const promoAlertCopy = isRtl
    ? {
        title: 'استخدامات جديدة لأكواد الخصم',
        markRead: 'تعليم الكل كمقروء',
        recent: 'الأحدث',
      }
    : {
        title: 'New promo code uses',
        markRead: 'Mark all read',
        recent: 'Latest',
      };

  const recentUnread = promoNotifications.filter((n) => !n.read).slice(0, 5);

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <p className="text-sm text-muted-foreground text-start">{t.pageDesc}</p>

      {promoUnread > 0 ? (
        <Card className="border-violet-500/30 bg-violet-500/5 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              {promoAlertCopy.title}
              <Badge variant="secondary" className="bg-violet-500/15 text-violet-900 dark:text-violet-100">
                {promoUnread}
              </Badge>
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => markAllPromoRead()}
            >
              {promoAlertCopy.markRead}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p className="text-xs text-muted-foreground">{promoAlertCopy.recent}</p>
            <ul className="space-y-2">
              {recentUnread.map((n) => (
                <li
                  key={n.useId}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-mono font-semibold" dir="ltr">
                      {n.code}
                    </p>
                    <p className="text-xs text-muted-foreground">{n.influencerName}</p>
                    <p className="mt-0.5 text-xs">
                      {resolvePromoNotificationCustomerName(n, lang)} —{' '}
                      {formatPromoUseNotificationBody(n, lang)}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDateTime(n.createdAt, language, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.statTotal, value: formatNumber(stats.total) },
          { label: t.statActive, value: formatNumber(stats.active) },
          { label: t.statUses, value: formatNumber(stats.totalUses) },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border/60 bg-card px-4 py-3 text-start shadow-sm"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,22rem)_1fr] xl:items-start">
        <Card
          className={cn(
            'xl:sticky xl:top-4 shadow-sm',
            editing && 'ring-2 ring-primary/40 border-primary/30',
          )}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base text-start">
              <Tag className="h-5 w-5 shrink-0 text-primary" />
              {editing ? t.editCode : t.newCode}
            </CardTitle>
            {editing ? (
              <CardDescription className="text-start font-mono text-xs" dir="ltr">
                {form.code}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <FormSection title={t.formBasic}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inf-code">{t.code}</Label>
                  <Input
                    id="inf-code"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    placeholder="BIOSKIN10"
                    className="font-mono uppercase"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-muted-foreground">{t.codeHint}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inf-name">{t.influencer}</Label>
                  <Input
                    id="inf-name"
                    value={form.influencerName}
                    onChange={(e) => setForm((f) => ({ ...f, influencerName: e.target.value }))}
                    placeholder={language === 'ar' ? 'سارة' : 'Sara'}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title={t.formDiscount}>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>{t.discountType}</Label>
                  <Select
                    value={form.discountType}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, discountType: v as InfluencerDiscountType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">{t.percent}</SelectItem>
                      <SelectItem value="fixed">{t.fixed}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="inf-value">{t.value}</Label>
                  <Input
                    id="inf-value"
                    type="number"
                    min={1}
                    max={form.discountType === 'percent' ? 100 : undefined}
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title={t.formScope}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Select
                    value={form.sectionScope}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        sectionScope: v as InfluencerSectionScope,
                        sectionId: v === 'all' ? '' : f.sectionId,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.sectionAll}</SelectItem>
                      <SelectItem value="section">{t.sectionOne}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.sectionScope === 'section' ? (
                  <div className="space-y-1.5">
                    <Label>{t.pickSection}</Label>
                    <Select
                      value={form.sectionId || undefined}
                      onValueChange={(v) => setForm((f) => ({ ...f, sectionId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.pickSection} />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((sec) => (
                          <SelectItem key={sec.id} value={sec.id}>
                            {sec.title[language] || sec.title.en || sec.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
            </FormSection>

            <FormSection title={t.formLimits}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inf-expiry">
                    {t.expiry}{' '}
                    <span className="font-normal text-muted-foreground">({t.optional})</span>
                  </Label>
                  <Input
                    id="inf-expiry"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inf-max">
                    {t.maxUses}{' '}
                    <span className="font-normal text-muted-foreground">({t.optional})</span>
                  </Label>
                  <Input
                    id="inf-max"
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                    placeholder="∞"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/80 px-3 py-2.5">
                  <Label htmlFor="inf-enabled" className="cursor-pointer text-sm">
                    {t.enabled}
                  </Label>
                  <Switch
                    id="inf-enabled"
                    checked={form.enabled}
                    onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))}
                  />
                </div>
              </div>
            </FormSection>

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button
                type="button"
                className="flex-1 gap-2"
                onClick={() => void handleSave()}
                disabled={saveBusy}
              >
                {saveBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {t.save}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" className="sm:px-6" onClick={resetForm}>
                  {t.cancel}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 min-w-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base text-start">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {t.filters}
                </CardTitle>
                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setListFilter(DEFAULT_LIST_FILTER())}
                  >
                    <X className="h-3.5 w-3.5" />
                    {t.clearFilters}
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={listFilter.query}
                  onChange={(e) => setListFilter((f) => ({ ...f, query: e.target.value }))}
                  placeholder={t.filterSearch}
                  className="ps-9"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.filterStatus}</Label>
                  <Select
                    value={listFilter.status}
                    onValueChange={(v) =>
                      setListFilter((f) => ({
                        ...f,
                        status: v as InfluencerCodeListFilter['status'],
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.filterStatusAll}</SelectItem>
                      <SelectItem value="enabled">{t.filterStatusOn}</SelectItem>
                      <SelectItem value="disabled">{t.filterStatusOff}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.filterType}</Label>
                  <Select
                    value={listFilter.discountType}
                    onValueChange={(v) =>
                      setListFilter((f) => ({
                        ...f,
                        discountType: v as InfluencerCodeListFilter['discountType'],
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.filterTypeAll}</SelectItem>
                      <SelectItem value="percent">{t.percent}</SelectItem>
                      <SelectItem value="fixed">{t.fixed}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.filterExpiry}</Label>
                  <Select
                    value={listFilter.expiry}
                    onValueChange={(v) =>
                      setListFilter((f) => ({
                        ...f,
                        expiry: v as InfluencerCodeListFilter['expiry'],
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.filterExpiryAll}</SelectItem>
                      <SelectItem value="active">{t.filterExpiryActive}</SelectItem>
                      <SelectItem value="expired">{t.filterExpiryExpired}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t.filterSection}</Label>
                  <Select
                    value={listFilter.sectionId}
                    onValueChange={(v) => setListFilter((f) => ({ ...f, sectionId: v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.filterSectionAll}</SelectItem>
                      {sections.map((sec) => (
                        <SelectItem key={sec.id} value={sec.id}>
                          {sec.title[language] || sec.title.en || sec.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base text-start">{t.list}</CardTitle>
              {sortedCodes.length > 0 ? (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t.showingCount} {formatNumber(filteredCodes.length)} / {formatNumber(sortedCodes.length)}
                </span>
              ) : null}
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {sortedCodes.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground text-start">{t.empty}</p>
              ) : filteredCodes.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground text-start">{t.noFilterMatch}</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div
                      className="grid grid-cols-[minmax(7rem,1.1fr)_minmax(6rem,1fr)_5rem_minmax(5rem,0.9fr)_4.5rem_minmax(6.5rem,auto)_auto] gap-3 border-b border-border/60 bg-muted/30 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                      role="row"
                    >
                      <span className="text-start">{t.colCode}</span>
                      <span className="text-start">{t.colInfluencer}</span>
                      <span className="text-start">{t.colDiscount}</span>
                      <span className="text-start">{t.colSection}</span>
                      <span className="text-start">{t.colUses}</span>
                      <span className="text-start">{t.colStatus}</span>
                      <span className="text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</span>
                    </div>
                    <ul className="divide-y divide-border/60">
                      {filteredCodes.map((row) => {
                        const isRowEditing = form.id === row.id;
                        const expired = isInfluencerCodeExpired(row);
                        const sectionLabel = formatInfluencerCodeSectionLabel(
                          row,
                          language,
                          row.sectionId ? sectionTitleById.get(row.sectionId) ?? null : null,
                        );
                        return (
                          <li
                            key={row.id}
                            role="row"
                            className={cn(
                              'grid grid-cols-[minmax(7rem,1.1fr)_minmax(6rem,1fr)_5rem_minmax(5rem,0.9fr)_4.5rem_minmax(6.5rem,auto)_auto] gap-3 items-center px-4 py-3 text-sm transition-colors',
                              isRowEditing && 'bg-primary/5',
                              !row.enabled && 'opacity-75',
                            )}
                          >
                            <div className="min-w-0 text-start">
                              <span className="font-mono text-sm font-bold tracking-wide" dir="ltr">
                                {row.code}
                              </span>
                            </div>
                            <div className="min-w-0 truncate text-start text-muted-foreground">
                              {row.influencerName}
                            </div>
                            <div className="text-start">
                              <Badge variant="secondary" className="font-normal">
                                {formatCodeDiscountLabel(row, language)}
                              </Badge>
                            </div>
                            <div className="min-w-0 truncate text-start text-xs text-muted-foreground">
                              {sectionLabel}
                            </div>
                            <div className="text-start text-xs tabular-nums text-muted-foreground">
                              {formatNumber(row.usedCount)}
                              {row.maxUses != null ? `/${formatNumber(row.maxUses)}` : ''}
                            </div>
                            <div className="flex flex-wrap gap-1 text-start">
                              {row.enabled && !expired ? (
                                <Badge className="bg-emerald-600/90 hover:bg-emerald-600/90">
                                  {language === 'ar' ? 'نشط' : 'Active'}
                                </Badge>
                              ) : null}
                              {!row.enabled ? (
                                <Badge variant="outline">{t.off}</Badge>
                              ) : null}
                              {expired ? <Badge variant="destructive">{t.expired}</Badge> : null}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <Switch
                                checked={row.enabled}
                                onCheckedChange={(checked) => {
                                  toggleInfluencerCodeEnabled(row.id, checked);
                                  reload();
                                }}
                                aria-label={t.enabled}
                              />
                              <Button
                                type="button"
                                variant={isRowEditing ? 'default' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => startEdit(row)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">{t.edit}</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(row.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminInfluencerCodesPanel;
