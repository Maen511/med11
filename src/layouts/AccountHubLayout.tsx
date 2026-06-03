import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { notifyCatalogAccessPending } from '@/lib/catalogAccessToast';
import { UserRound, Package, Heart, MapPin, ChevronRight, LayoutDashboard, Settings } from 'lucide-react';

const AccountHubLayout = () => {
  const { language, setLanguage } = useLanguage();
  const { canAccessCatalog, isAdmin } = useAuth();
  const isRtl = language === 'ar';

  const shortcutsTitle = isRtl ? 'اختصارات' : 'Quick links';

  const items: Array<{
    to: string;
    label: string;
    icon: typeof UserRound;
    needsCatalog?: boolean;
    end?: boolean;
  }> = isAdmin
    ? [
        { to: '/profile', label: isRtl ? 'الملف الشخصي' : 'Profile', icon: UserRound, end: true },
        { to: '/admin', label: isRtl ? 'لوحة التحكم' : 'Admin dashboard', icon: LayoutDashboard },
      ]
    : [
        { to: '/profile', label: isRtl ? 'الملف الشخصي' : 'Profile', icon: UserRound, end: true },
        { to: '/settings', label: isRtl ? 'الإعدادات' : 'Settings', icon: Settings },
        { to: '/orders', label: isRtl ? 'طلباتي' : 'My orders', icon: Package, needsCatalog: true },
        { to: '/wishlist', label: isRtl ? 'المفضلة' : 'Wishlist', icon: Heart, needsCatalog: true },
        { to: '/addresses', label: isRtl ? 'العناوين' : 'Addresses', icon: MapPin },
      ];

  const shortcutLinkClass = (isActive: boolean, dim: boolean) =>
    cn(
      'flex min-w-0 items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'border-primary/35 bg-primary text-primary-foreground shadow-sm'
        : 'border-border/80 bg-card/90 text-foreground hover:border-primary/25 hover:bg-muted/70',
      dim && !isActive && 'opacity-70'
    );

  return (
    <div className="min-h-screen overflow-x-clip bg-background" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="container mx-auto flex flex-col gap-6 px-4 pb-16 pt-24 sm:pt-28 md:flex-row md:items-start md:gap-6 lg:gap-8">
        <aside className="w-full shrink-0 md:w-56 lg:w-64 lg:max-w-[16rem]">
          <div className="luxury-card rounded-2xl border p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserRound className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {shortcutsTitle}
            </div>
            <nav
              aria-label={isRtl ? 'اختصارات الحساب' : 'Account shortcuts'}
              className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:flex md:flex-col md:gap-2"
            >
              {items.map(({ to, label, icon: Icon, needsCatalog, end }) => {
                const locked = Boolean(needsCatalog && !canAccessCatalog);
                const linkClass = cn(
                  shortcutLinkClass(false, locked),
                  'md:min-w-0 md:w-full',
                );

                const inner = (
                  <>
                    <span className="flex min-w-0 items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      <span className="truncate">{label}</span>
                    </span>
                    <ChevronRight className={cn('h-4 w-4 shrink-0 opacity-50', isRtl && 'rotate-180')} aria-hidden />
                  </>
                );

                if (locked) {
                  return (
                    <button
                      key={to}
                      type="button"
                      className={linkClass}
                      onClick={() => notifyCatalogAccessPending(language)}
                    >
                      {inner}
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={to}
                    to={to}
                    end={Boolean(end)}
                    className={({ isActive }) =>
                      cn(shortcutLinkClass(isActive, false), 'md:min-w-0 md:w-full')
                    }
                  >
                    {inner}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {/* Suspense هنا يمنع شاشة التحميل الكاملة عند تبديل صفحات الحساب (lazy) */}
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AccountHubLayout;
