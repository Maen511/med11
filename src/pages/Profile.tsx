import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import {
  Package,
  Heart,
  Mail,
  User,
  Phone,
  KeyRound,
  Truck,
  Shield,
  ShoppingBag,
  MapPin,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { notifyCatalogAccessPending } from '@/lib/catalogAccessToast';
import { getInvoicesForCustomer, type StoredInvoice } from '@/lib/invoices';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { formatJordanPhoneDisplay } from '@/lib/jordanPhone';
import { storeProductsPath } from '@/lib/storeNav';

function ProfileCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card shadow-sm', className)}>
      {children}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  to?: string;
}) {
  const inner = (
    <>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      </div>
    </>
  );

  const className =
    'flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-4 shadow-sm transition-colors';

  if (to) {
    return (
      <Link
        to={to}
        className={cn(className, 'hover:border-primary/35 hover:bg-muted/30')}
      >
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

function InfoRow({
  icon: Icon,
  label,
  value,
  dir,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
}) {
  return (
    <div className={cn('flex gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3.5', className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn('mt-1 break-words text-sm font-medium text-foreground', dir === 'ltr' && 'font-mono')}
          dir={dir}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ActionTile({
  to,
  icon: Icon,
  label,
  description,
  variant = 'default',
  isRtl,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  variant?: 'default' | 'outline';
  isRtl: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex min-h-[5.25rem] flex-col justify-between gap-2 rounded-xl border px-4 py-3.5 transition-colors',
        variant === 'default'
          ? 'border-primary/30 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
          : 'border-border/60 bg-card hover:border-primary/30 hover:bg-muted/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Icon
          className={cn('h-5 w-5 shrink-0', variant === 'default' ? 'opacity-95' : 'text-primary')}
          aria-hidden
        />
        <ChevronLeft
          className={cn(
            'h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:opacity-80',
            !isRtl && 'rotate-180',
          )}
          aria-hidden
        />
      </div>
      <div>
        <p className={cn('text-sm font-semibold leading-snug', variant === 'outline' && 'text-foreground')}>
          {label}
        </p>
        {description ? (
          <p
            className={cn(
              'mt-0.5 text-xs leading-snug',
              variant === 'default' ? 'text-primary-foreground/85' : 'text-muted-foreground',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function ProfileHero({
  title,
  name,
  subtitle,
  username,
  badge,
  isRtl,
}: {
  title: string;
  name: string;
  subtitle: string;
  username?: string;
  badge?: React.ReactNode;
  isRtl: boolean;
}) {
  return (
    <div className="border-b border-border/50 bg-gradient-to-br from-primary/10 via-card to-muted/20 px-5 py-6 sm:px-8 sm:py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{name}</h1>
            {badge}
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {username ? (
          <div
            className="shrink-0 rounded-xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm"
            dir="ltr"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {isRtl ? 'اسم المستخدم' : 'Username'}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-foreground">@{username}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const Profile = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { user, isAdmin, grantedSectionIds, canAccessCatalog } = useAuth();
  const { getTotalItems } = useCart();

  const reloadStats = () => {
    setInvoices(getInvoicesForCustomer(user?.email, user?.username));
    try {
      const list = JSON.parse(localStorage.getItem('med-wishlist') || '[]');
      setWishlistCount(Array.isArray(list) ? list.length : 0);
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    if (isAdmin) return;
    reloadStats();
  }, [user?.email, user?.username, isAdmin]);

  useEffect(() => {
    if (isAdmin) return;
    const st = location.state as { needCatalogAccess?: boolean; needCatalogCode?: boolean } | null;
    if (st?.needCatalogAccess || st?.needCatalogCode) {
      notifyCatalogAccessPending(language);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, language, isAdmin]);

  const isSyntheticEmail = Boolean(user?.email?.toLowerCase().endsWith('@user.local'));

  const t = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'ملفي الشخصي',
            subtitle: 'نظرة سريعة على حسابك ونشاطك',
            account: 'معلومات الحساب',
            name: 'الاسم',
            username: 'اسم المستخدم',
            phone: 'الهاتف',
            email: 'البريد الإلكتروني',
            statsOrders: 'الطلبات',
            statsWishlist: 'المفضلة',
            statsCart: 'السلة',
            adminRole: 'مسؤول المتجر',
            adminSubtitle: 'حساب إدارة المتجر',
            adminAccountSection: 'معلومات الحساب',
            adminShopSection: 'التسوق كعميل',
            adminShopHint: 'تصفّح المتجر وأضف منتجات كأي عميل',
            adminGoStore: 'فتح المتجر',
            adminAddresses: 'عناوين التوصيل',
            settings: 'الإعدادات',
            settingsHint: 'كلمة المرور والأمان',
            activity: 'النشاط',
          }
        : {
            title: 'My profile',
            subtitle: 'A quick overview of your account',
            account: 'Account details',
            name: 'Name',
            username: 'Username',
            phone: 'Phone',
            email: 'Email',
            statsOrders: 'Orders',
            statsWishlist: 'Wishlist',
            statsCart: 'Cart',
            adminRole: 'Store administrator',
            adminSubtitle: 'Store management account',
            adminAccountSection: 'Account information',
            adminShopSection: 'Shop as a customer',
            adminShopHint: 'Browse the store and add items like any customer',
            adminGoStore: 'Open store',
            adminAddresses: 'Delivery addresses',
            settings: 'Settings',
            settingsHint: 'Password and security',
            activity: 'Activity',
          },
    [language],
  );

  const isRtl = language === 'ar';
  const storeHref = storeProductsPath(grantedSectionIds, { catalogUnlocked: true });

  const accountFields = (
    <>
      <InfoRow icon={User} label={t.name} value={user?.name || '—'} />
      <InfoRow icon={KeyRound} label={t.username} value={user?.username ? `@${user.username}` : '—'} dir="ltr" />
      {user?.email && !isSyntheticEmail ? (
        <InfoRow icon={Mail} label={t.email} value={user.email} dir="ltr" className="sm:col-span-2" />
      ) : null}
      {user?.phone ? (
        <InfoRow icon={Phone} label={t.phone} value={formatJordanPhoneDisplay(user.phone)} dir="ltr" />
      ) : null}
    </>
  );

  if (isAdmin) {
    return (
      <div className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
        <main className="mx-auto w-full max-w-3xl space-y-6 pb-2">
          <ProfileCard className="overflow-hidden">
            <ProfileHero
              title={t.title}
              name={user?.name || t.title}
              subtitle={t.adminSubtitle}
              username={user?.username}
              isRtl={isRtl}
              badge={
                <Badge className="gap-1 border-primary/35 bg-primary/15 font-normal text-primary">
                  <Shield className="h-3 w-3" aria-hidden />
                  {t.adminRole}
                </Badge>
              }
            />

            <div className="px-5 py-6 sm:px-8">
              <h2 className="text-sm font-semibold text-foreground">{t.adminAccountSection}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{accountFields}</div>
            </div>

            <div className="border-t border-border/50 px-5 py-6 sm:px-8">
              <div className="mb-4 space-y-1">
                <h2 className="text-sm font-semibold text-foreground">{t.adminShopSection}</h2>
                <p className="text-xs text-muted-foreground">{t.adminShopHint}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatTile icon={ShoppingBag} label={t.statsCart} value={getTotalItems()} />
                <ActionTile
                  to={storeHref}
                  icon={ShoppingBag}
                  label={t.adminGoStore}
                  variant="default"
                  isRtl={isRtl}
                />
                <ActionTile
                  to="/addresses"
                  icon={MapPin}
                  label={t.adminAddresses}
                  variant="outline"
                  isRtl={isRtl}
                />
              </div>
            </div>
          </ProfileCard>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
      <main className="mx-auto w-full max-w-3xl space-y-6 pb-2">
        <ProfileCard className="overflow-hidden">
          <ProfileHero
            title={t.title}
            name={user?.name || t.title}
            subtitle={t.subtitle}
            username={user?.username}
            isRtl={isRtl}
          />
        </ProfileCard>

        <section aria-labelledby="profile-activity-heading">
          <h2 id="profile-activity-heading" className="mb-3 px-0.5 text-sm font-semibold text-foreground">
            {t.activity}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              icon={Package}
              label={t.statsOrders}
              value={invoices.length}
              to={canAccessCatalog ? '/orders' : undefined}
            />
            <StatTile
              icon={Heart}
              label={t.statsWishlist}
              value={wishlistCount}
              to={canAccessCatalog ? '/wishlist' : undefined}
            />
            <StatTile icon={Truck} label={t.statsCart} value={getTotalItems()} to={canAccessCatalog ? storeHref : undefined} />
          </div>
        </section>

        <ProfileCard className="p-5 sm:p-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" aria-hidden />
            {t.account}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">{accountFields}</div>
        </ProfileCard>

        <div className="grid gap-3 sm:grid-cols-2">
          <ActionTile
            to="/settings"
            icon={Settings}
            label={t.settings}
            description={t.settingsHint}
            variant="outline"
            isRtl={isRtl}
          />
          <ActionTile
            to="/addresses"
            icon={MapPin}
            label={isRtl ? 'عناوين التوصيل' : 'Delivery addresses'}
            variant="outline"
            isRtl={isRtl}
          />
        </div>
      </main>
    </div>
  );
};

export default Profile;
