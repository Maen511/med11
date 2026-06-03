import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  FileText,
  Settings,
  Megaphone,
  Gift,
  Tag,
  Store,
  Globe,
  LogOut,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LOGO_URL } from '@/lib/branding';
import { formatDate } from '@/lib/formatNumbers';
import { cn } from '@/lib/utils';
import ThemeModeToggle from '@/components/ThemeModeToggle';
import AdminNavUnreadBadge from '@/components/admin/AdminNavUnreadBadge';
import { useAdminOrderNotifications } from '@/hooks/useAdminOrderNotifications';
import { useAdminPromoCodeNotifications } from '@/hooks/useAdminPromoCodeNotifications';
import { useAdminCustomerSignupNotifications } from '@/hooks/useAdminCustomerSignupNotifications';
import { storeProductsPath } from '@/lib/storeNav';

export type AdminNavId =
  | 'overview'
  | 'products'
  | 'customers'
  | 'invoices'
  | 'orders'
  | 'bonus'
  | 'promotions'
  | 'influencers'
  | 'settings';

type NavItem = {
  id: AdminNavId;
  icon: typeof LayoutDashboard;
  labelEn: string;
  labelAr: string;
};

const NAV: NavItem[] = [
  { id: 'overview', icon: LayoutDashboard, labelEn: 'Overview', labelAr: 'نظرة عامة' },
  { id: 'customers', icon: Users, labelEn: 'Customers', labelAr: 'العملاء' },
  { id: 'products', icon: Package, labelEn: 'Products', labelAr: 'المنتجات' },
  { id: 'orders', icon: ShoppingBag, labelEn: 'Orders', labelAr: 'الطلبات' },
  { id: 'invoices', icon: FileText, labelEn: 'Invoices', labelAr: 'الفواتير' },
  { id: 'bonus', icon: Gift, labelEn: 'Bonus', labelAr: 'بونص' },
  { id: 'promotions', icon: Megaphone, labelEn: 'Promotions', labelAr: 'الإعلانات' },
  { id: 'influencers', icon: Tag, labelEn: 'Influencer codes', labelAr: 'أكواد الإنفلونسر' },
  { id: 'settings', icon: Settings, labelEn: 'Settings', labelAr: 'الإعدادات' },
];

type Props = {
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  active: AdminNavId;
  onNavigate: (id: AdminNavId) => void;
  title: string;
  subtitle?: string;
  showSettingsNav?: boolean;
  children: ReactNode;
};

const AdminLayout = ({
  language,
  onLanguageChange,
  active,
  onNavigate,
  title,
  subtitle,
  showSettingsNav = true,
  children,
}: Props) => {
  const isRtl = language === 'ar';
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount: ordersUnread } = useAdminOrderNotifications();
  const { unreadCount: promoUnread } = useAdminPromoCodeNotifications();
  const { unreadCount: customersUnread } = useAdminCustomerSignupNotifications();
  const storeHref = useMemo(() => storeProductsPath([], { isAdmin: true }), []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [active]);

  const handleNavigate = (id: AdminNavId) => {
    onNavigate(id);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true, state: { openAuth: true } });
  };

  return (
    <motion.div
      className="min-h-screen overflow-x-clip bg-[hsl(40_6%_94%)] dark:bg-[hsl(0_0%_6%)]"
      dir={isRtl ? 'rtl' : 'ltr'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,hsl(var(--primary)/0.06),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_100%,hsl(var(--accent)/0.08),transparent_50%)]"
        aria-hidden
      />

      {sidebarOpen ? (
        <button
          type="button"
          aria-label={isRtl ? 'إغلاق القائمة' : 'Close menu'}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 z-40 flex w-[min(17.5rem,88vw)] flex-col border-border/60 bg-zinc-950 text-zinc-100 shadow-2xl transition-transform duration-300 ease-out lg:translate-x-0',
          isRtl ? 'right-0 border-l' : 'left-0 border-r',
          sidebarOpen
            ? 'translate-x-0'
            : isRtl
              ? 'translate-x-full lg:translate-x-0'
              : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="space-y-4 border-b border-white/10 px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={LOGO_URL}
                alt="DermaCure"
                className="h-10 w-auto max-w-[120px] object-contain brightness-0 invert"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-wide text-white">
                  {isRtl ? 'لوحة التحكم' : 'Control Center'}
                </p>
                <p className="truncate text-[11px] text-zinc-400">DermaCure</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-zinc-300 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label={isRtl ? 'إغلاق القائمة' : 'Close menu'}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2.5 text-xs">
            <p className="font-medium text-zinc-200">{user?.name || 'Admin'}</p>
            <p className="truncate text-zinc-500">{user?.email || 'admin@company.com'}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {NAV.filter((item) => item.id !== 'settings' || showSettingsNav).map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const unreadBadge =
              item.id === 'orders'
                ? { count: ordersUnread, variant: 'orders' as const }
                : item.id === 'influencers'
                  ? { count: promoUnread, variant: 'promo' as const }
                  : item.id === 'customers'
                    ? { count: customersUnread, variant: 'customers' as const }
                    : null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/12 text-white shadow-inner'
                    : 'text-zinc-400 hover:bg-white/6 hover:text-zinc-100'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-emerald-400')} />
                <span className="min-w-0 flex-1 truncate text-start">
                  {isRtl ? item.labelAr : item.labelEn}
                </span>
                {unreadBadge ? (
                  <AdminNavUnreadBadge count={unreadBadge.count} variant={unreadBadge.variant} />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to="/" onClick={() => setSidebarOpen(false)}>
              <Home className="h-4 w-4" />
              {isRtl ? 'الصفحة الرئيسية' : 'Home'}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            onClick={() => onLanguageChange(language === 'en' ? 'ar' : 'en')}
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-300 hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to={storeHref}>
              <Store className="h-4 w-4" />
              {isRtl ? 'المتجر' : 'Storefront'}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-zinc-400 hover:bg-red-500/15 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {isRtl ? 'خروج' : 'Sign out'}
          </Button>
        </div>
      </aside>

      <div className={cn('min-h-screen min-w-0', isRtl ? 'lg:mr-[17.5rem]' : 'lg:ml-[17.5rem]')}>
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3 sm:items-end sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <Button
                variant="outline"
                size="icon"
                className="mt-0.5 shrink-0 lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label={isRtl ? 'فتح القائمة' : 'Open menu'}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <motion.div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl md:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
              </motion.div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              <ThemeModeToggle language={language} />
              <div className="hidden rounded-full border border-border/60 bg-muted/40 px-4 py-1.5 text-xs font-medium text-muted-foreground sm:block">
                {formatDate(new Date(), language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              </div>
          </div>
        </header>

        <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </motion.div>
  );
};

export default AdminLayout;
