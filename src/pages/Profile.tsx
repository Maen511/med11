import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, dir }: { icon: LucideIcon; label: string; value: string; dir?: 'ltr' | 'rtl' }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={cn('mt-1 break-words text-sm font-medium text-foreground', dir === 'ltr' && 'font-mono')} dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

const Profile = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { user, isAdmin, grantedSectionIds } = useAuth();
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
            adminGoStore: 'فتح المتجر',
            adminAddresses: 'عناوين التوصيل',
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
            adminGoStore: 'Open store',
            adminAddresses: 'Delivery addresses',
          },
    [language],
  );

  const isRtl = language === 'ar';
  const storeHref = storeProductsPath(grantedSectionIds, { catalogUnlocked: true });

  if (isAdmin) {
    return (
      <div className="w-full" dir={isRtl ? 'rtl' : 'ltr'}>
        <main className="mx-auto w-full max-w-2xl pb-2">
          <ProfileCard className="overflow-hidden">
            <div className="border-b border-border/50 bg-gradient-to-br from-primary/10 via-card to-muted/20 px-6 py-8 sm:px-8">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{user?.name || t.title}</h1>
                  <Badge className="gap-1 border-primary/35 bg-primary/15 font-normal text-primary">
                    <Shield className="h-3 w-3" aria-hidden />
                    {t.adminRole}
                  </Badge>
                </div>
                {user?.username ? (
                  <p className="font-mono text-sm text-muted-foreground" dir="ltr">
                    @{user.username}
                  </p>
                ) : null}
                <p className="text-sm text-muted-foreground">{t.adminSubtitle}</p>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-7">
              <h2 className="mb-4 text-sm font-semibold text-foreground">{t.adminAccountSection}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoRow icon={User} label={t.name} value={user?.name || '—'} />
                <InfoRow icon={KeyRound} label={t.username} value={user?.username ? `@${user.username}` : '—'} dir="ltr" />
                <InfoRow
                  icon={Mail}
                  label={t.email}
                  value={user?.email && !isSyntheticEmail ? user.email : '—'}
                  dir="ltr"
                />
                {user?.phone ? (
                  <InfoRow icon={Phone} label={t.phone} value={formatJordanPhoneDisplay(user.phone)} dir="ltr" />
                ) : null}
              </div>

              <div className="mt-6 space-y-4 border-t border-border/50 pt-6">
                <h2 className="text-sm font-semibold text-foreground">{t.adminShopSection}</h2>
                <StatTile icon={Truck} label={t.statsCart} value={getTotalItems()} />
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="gap-2">
                    <Link to={storeHref}>
                      <ShoppingBag className="h-4 w-4" aria-hidden />
                      {t.adminGoStore}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/addresses">
                      <MapPin className="h-4 w-4" aria-hidden />
                      {t.adminAddresses}
                    </Link>
                  </Button>
                </div>
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
          <div className="bg-gradient-to-br from-primary/10 via-card to-muted/25 px-6 py-8 sm:px-8">
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{user?.name || t.title}</h1>
              {user?.username ? (
                <p className="font-mono text-sm text-muted-foreground" dir="ltr">
                  @{user.username}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
        </ProfileCard>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile icon={Package} label={t.statsOrders} value={invoices.length} />
          <StatTile icon={Heart} label={t.statsWishlist} value={wishlistCount} />
          <StatTile icon={Truck} label={t.statsCart} value={getTotalItems()} />
        </div>

        <ProfileCard className="p-6 sm:p-8">
          <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
            <User className="h-5 w-5 text-primary" aria-hidden />
            {t.account}
          </h2>
          <div className="grid gap-3">
            <InfoRow icon={User} label={t.name} value={user?.name || '—'} />
            <InfoRow icon={KeyRound} label={t.username} value={user?.username ? `@${user.username}` : '—'} dir="ltr" />
            {user?.email && !isSyntheticEmail ? (
              <InfoRow icon={Mail} label={t.email} value={user.email} dir="ltr" />
            ) : null}
            {user?.phone ? (
              <InfoRow icon={Phone} label={t.phone} value={formatJordanPhoneDisplay(user.phone)} dir="ltr" />
            ) : null}
          </div>
        </ProfileCard>
      </main>
    </div>
  );
};

export default Profile;
