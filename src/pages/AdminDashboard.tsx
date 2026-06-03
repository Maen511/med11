import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessAdminSettings } from '@/lib/adminPermissions';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminLayout, { type AdminNavId } from '@/layouts/AdminLayout';
import AdminProductsPanel from '@/components/admin/AdminProductsPanel';
import AdminOverviewPanel from '@/components/admin/AdminOverviewPanel';
import AdminCustomersPanel from '@/components/admin/AdminCustomersPanel';
import AdminSettingsPanel from '@/components/admin/AdminSettingsPanel';
import AdminPromotionsPanel from '@/components/admin/AdminPromotionsPanel';
import AdminInfluencerCodesPanel from '@/components/admin/AdminInfluencerCodesPanel';
import AdminBonusPanel from '@/components/admin/AdminBonusPanel';
import AdminInvoicesPanel from '@/components/admin/AdminInvoicesPanel';
import AdminOrdersPanel from '@/components/admin/AdminOrdersPanel';
import { getCatalogSections } from '@/lib/catalog';
import { hydrateCatalogSections, revokeHydratedCatalogImages } from '@/lib/catalogImages';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import { getInvoices, INVOICES_STORAGE_KEY, type StoredInvoice } from '@/lib/invoices';
import {
  formatAdminOrderNotificationBody,
  markAllAdminOrderNotificationsRead,
  resolveNotificationCustomerName,
  scanForNewAdminOrders,
  type AdminOrderNotification,
} from '@/lib/adminOrderNotifications';
import {
  formatPromoUseNotificationBody,
  markAllAdminPromoCodeUseNotificationsRead,
  scanForNewPromoCodeUses,
  type AdminPromoCodeUseNotification,
} from '@/lib/adminPromoCodeNotifications';
import {
  formatCustomerSignupNotificationBody,
  markAllAdminCustomerSignupNotificationsRead,
  scanForNewCustomerSignups,
  CUSTOMER_ACCOUNTS_KEY,
  type AdminCustomerSignupNotification,
} from '@/lib/adminCustomerSignupNotifications';
import { toast } from 'sonner';

const NAV_META: Record<
  AdminNavId,
  { titleEn: string; titleAr: string; subtitleEn: string; subtitleAr: string }
> = {
  overview: {
    titleEn: 'Executive overview',
    titleAr: 'نظرة عامة',
    subtitleEn: 'Sales and store performance at a glance.',
    subtitleAr: 'ملخص المبيعات وأداء المتجر.',
  },
  products: {
    titleEn: 'Products',
    titleAr: 'المنتجات',
    subtitleEn: 'Manage sections, products, stock, and pricing.',
    subtitleAr: 'إدارة الأقسام والمنتجات والكميات والأسعار.',
  },
  customers: {
    titleEn: 'Customer accounts',
    titleAr: 'حسابات العملاء',
    subtitleEn: 'Review sign-ups and grant full catalog access with one click.',
    subtitleAr: 'مراجعة التسجيلات ومنح وصول كامل للكتالوج بضغطة واحدة.',
  },
  invoices: {
    titleEn: 'Invoices',
    titleAr: 'الفواتير',
    subtitleEn: 'Financial records for delivered orders only.',
    subtitleAr: 'سجل مالي للطلبات المُسلَّمة فقط.',
  },
  orders: {
    titleEn: 'Order tracking',
    titleAr: 'تتبع الطلبات',
    subtitleEn: 'Update delivery progress by tapping each stage.',
    subtitleAr: 'حدّث مرحلة التوصيل بالضغط على الكرات.',
  },
  bonus: {
    titleEn: 'Bonus',
    titleAr: 'بونص',
    subtitleEn: '',
    subtitleAr: '',
  },
  promotions: {
    titleEn: 'Promotions',
    titleAr: 'الإعلانات',
    subtitleEn: 'Store promo window, image upload, and copy.',
    subtitleAr: 'نافذة الإعلان في المتجر والصورة والنصوص.',
  },
  influencers: {
    titleEn: 'Influencer codes',
    titleAr: 'أكواد الإنفلونسر',
    subtitleEn: 'Create promo codes with percentage or fixed discounts.',
    subtitleAr: 'إنشاء أكواد خصم بنسبة أو مبلغ ثابت للعملاء عند الدفع.',
  },
  settings: {
    titleEn: 'Settings',
    titleAr: 'الإعدادات',
    subtitleEn: 'Admin account password.',
    subtitleAr: 'كلمة مرور حساب المسؤول.',
  },
};

const AdminDashboard = () => {
  const { isAdmin, user } = useAuth();
  const showSettingsNav = canAccessAdminSettings(user?.username);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  const [active, setActive] = useState<AdminNavId>('overview');
  const [sections, setSections] = useState(() => getCatalogSections());
  const [adminInvoices, setAdminInvoices] = useState<StoredInvoice[]>([]);

  const reload = useCallback(async () => {
    revokeHydratedCatalogImages();
    const raw = getCatalogSections();
    setSections(await hydrateCatalogSections(raw));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onCatalogChanged = () => {
      void reload();
    };
    window.addEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged);
    return () => window.removeEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged);
  }, [reload]);

  const refreshInvoices = useCallback(() => {
    setAdminInvoices(getInvoices());
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    refreshInvoices();
  }, [isAdmin, active, refreshInvoices]);

  useEffect(() => {
    if (!isAdmin) return;
    const scan = () => {
      const ordersAdded = scanForNewAdminOrders();
      const promoAdded = scanForNewPromoCodeUses();
      scanForNewCustomerSignups();
      if (ordersAdded || promoAdded) refreshInvoices();
    };
    scan();
    const interval = window.setInterval(scan, 4000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === INVOICES_STORAGE_KEY || e.key === CUSTOMER_ACCOUNTS_KEY || e.key === null) scan();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [isAdmin, refreshInvoices]);

  useEffect(() => {
    if (!isAdmin) return;
    const lang = isRtl ? 'ar' : 'en';
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ notification?: AdminOrderNotification; invoice?: StoredInvoice }>).detail;
      const n = detail?.notification;
      if (!n) return;
      const title = resolveNotificationCustomerName(n, detail?.invoice, lang);
      const body = formatAdminOrderNotificationBody(n, lang);
      toast.success(
        isRtl ? `طلب جديد من ${title}` : `New order from ${title}`,
        {
          description: body,
          action: {
            label: isRtl ? 'الطلبات' : 'Orders',
            onClick: () => setActive('orders'),
          },
        },
      );
    };
    window.addEventListener('med-admin-new-order', handler);
    return () => window.removeEventListener('med-admin-new-order', handler);
  }, [isAdmin, isRtl]);

  useEffect(() => {
    if (active === 'orders') markAllAdminOrderNotificationsRead();
  }, [active]);

  useEffect(() => {
    if (!isAdmin) return;
    const lang = isRtl ? 'ar' : 'en';
    const handler = (e: Event) => {
      const n = (e as CustomEvent<{ notification?: AdminPromoCodeUseNotification }>).detail?.notification;
      if (!n) return;
      const body = formatPromoUseNotificationBody(n, lang);
      toast.success(
        isRtl ? `تم استخدام الكود ${n.code}` : `Code ${n.code} was used`,
        {
          description: `${n.influencerName} · ${body}`,
          action: {
            label: isRtl ? 'الأكواد' : 'Codes',
            onClick: () => setActive('influencers'),
          },
        },
      );
    };
    window.addEventListener('med-admin-promo-code-used', handler);
    return () => window.removeEventListener('med-admin-promo-code-used', handler);
  }, [isAdmin, isRtl]);

  useEffect(() => {
    if (active === 'influencers') markAllAdminPromoCodeUseNotificationsRead();
  }, [active]);

  useEffect(() => {
    if (!isAdmin) return;
    const lang = isRtl ? 'ar' : 'en';
    const handler = (e: Event) => {
      const n = (e as CustomEvent<{ notification?: AdminCustomerSignupNotification }>).detail?.notification;
      if (!n) return;
      const body = formatCustomerSignupNotificationBody(n, lang);
      toast.success(
        isRtl ? `حساب جديد: ${n.name}` : `New account: ${n.name}`,
        {
          description: body,
          action: {
            label: isRtl ? 'العملاء' : 'Customers',
            onClick: () => setActive('customers'),
          },
        },
      );
    };
    window.addEventListener('med-admin-new-customer-signup', handler);
    return () => window.removeEventListener('med-admin-new-customer-signup', handler);
  }, [isAdmin, isRtl]);

  useEffect(() => {
    if (active === 'customers') markAllAdminCustomerSignupNotificationsRead();
  }, [active]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isAdmin) navigate('/login', { replace: true });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (active === 'settings' && !showSettingsNav) {
      setActive('overview');
    }
  }, [active, showSettingsNav]);

  const productSkuCount = useMemo(
    () => sections.reduce((n, s) => n + (s.products?.length ?? 0), 0),
    [sections]
  );

  if (!isAdmin) return null;

  const meta = NAV_META[active];
  const title = isRtl ? meta.titleAr : meta.titleEn;
  const subtitle = isRtl ? meta.subtitleAr : meta.subtitleEn;

  const overview = (
    <AdminOverviewPanel
      language={language}
      sections={sections}
      productSkuCount={productSkuCount}
      sectionCount={sections.length}
    />
  );

  const settingsPanel = <AdminSettingsPanel language={language} />;


  const content: Record<AdminNavId, ReactNode> = {
    overview,
    products: <AdminProductsPanel language={language} sections={sections} onReload={reload} />,
    customers: <AdminCustomersPanel language={language} />,
    invoices: <AdminInvoicesPanel language={language} invoices={adminInvoices} />,
    orders: (
      <AdminOrdersPanel language={language} invoices={adminInvoices} onRefresh={refreshInvoices} />
    ),
    bonus: <AdminBonusPanel language={language} />,
    promotions: <AdminPromotionsPanel language={language} />,
    influencers: <AdminInfluencerCodesPanel language={language} />,
    settings: settingsPanel,
  };

  return (
    <AdminLayout
      language={language}
      onLanguageChange={setLanguage}
      active={active}
      onNavigate={setActive}
      title={title}
      subtitle={subtitle}
      showSettingsNav={showSettingsNav}
    >
      {content[active]}
    </AdminLayout>
  );
};

export default AdminDashboard;

