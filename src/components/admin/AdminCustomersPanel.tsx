import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Mail, Phone, Search, Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  deleteCustomerAccount,
  grantFullCustomerAccess,
  hasFullCatalogAccess,
  listCustomerAccounts,
  type CustomerAccountSnapshot,
} from '@/lib/customerAccounts';
import { cn } from '@/lib/utils';
import { useAdminCustomerSignupNotifications } from '@/hooks/useAdminCustomerSignupNotifications';
import { formatCustomerSignupNotificationBody } from '@/lib/adminCustomerSignupNotifications';
import { formatDateTime } from '@/lib/formatNumbers';

type Props = {
  language: 'en' | 'ar';
};

type AccessFilter = 'all' | 'full' | 'pending';
type SortKey = 'name-asc' | 'name-desc' | 'username-asc';

function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.trim().slice(0, 2) || '?').toUpperCase();
}

function hasAccess(row: CustomerAccountSnapshot): boolean {
  return hasFullCatalogAccess(row);
}

const AdminCustomersPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const [accounts, setAccounts] = useState<CustomerAccountSnapshot[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<CustomerAccountSnapshot | null>(null);
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name-asc');
  const { notifications: signupNotifications, unreadCount: signupUnread, markAllRead: markSignupsRead } =
    useAdminCustomerSignupNotifications();
  const lang = isRtl ? 'ar' : 'en';

  const reload = useCallback(() => {
    setAccounts(listCustomerAccounts());
  }, []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener('med-customer-accounts-changed', onChange);
    return () => window.removeEventListener('med-customer-accounts-changed', onChange);
  }, [reload]);

  const t = useMemo(
    () =>
      isRtl
        ? {
            title: 'حسابات العملاء',
            subtitle: 'منح وصول كامل للكتالوج أو حذف حساب العميل.',
            empty: 'لا يوجد عملاء مسجلون بعد. عندما ينشئ أحدهم حساباً سيظهر هنا.',
            search: 'بحث بالاسم أو المستخدم أو البريد أو الهاتف…',
            filterAll: 'الكل',
            filterFull: 'وصول كامل',
            filterPending: 'بانتظار التفعيل',
            sortLabel: 'ترتيب',
            sortNameAsc: 'الاسم (أ–ي)',
            sortNameDesc: 'الاسم (ي–أ)',
            sortUsername: 'اسم المستخدم',
            clearFilters: 'مسح الفلاتر',
            results: 'نتيجة',
            noResults: 'لا توجد حسابات مطابقة للفلاتر.',
            customer: 'العميل',
            contact: 'التواصل',
            access: 'الوصول',
            actions: 'إجراءات',
            fullAccess: 'وصول كامل',
            noAccess: 'بانتظار التفعيل',
            grantFull: 'منح وصول كامل',
            deleteAccount: 'حذف',
            total: 'إجمالي العملاء',
            active: 'مفعّل',
            pending: 'بانتظار',
          }
        : {
            title: 'Customer accounts',
            subtitle: 'Grant full catalog access or permanently delete a customer account.',
            empty: 'No registered customers yet. When someone signs up, they will appear here.',
            search: 'Search by name, username, email, or phone…',
            filterAll: 'All',
            filterFull: 'Full access',
            filterPending: 'Pending',
            sortLabel: 'Sort',
            sortNameAsc: 'Name (A–Z)',
            sortNameDesc: 'Name (Z–A)',
            sortUsername: 'Username',
            clearFilters: 'Clear filters',
            results: 'results',
            noResults: 'No accounts match your filters.',
            customer: 'Customer',
            contact: 'Contact',
            access: 'Access',
            actions: 'Actions',
            fullAccess: 'Full access',
            noAccess: 'Pending',
            grantFull: 'Grant full access',
            deleteAccount: 'Delete',
            total: 'Total customers',
            active: 'Active',
            pending: 'Pending',
          },
    [isRtl],
  );

  const accessFilters: Array<{ id: AccessFilter; label: string }> = [
    { id: 'all', label: t.filterAll },
    { id: 'full', label: t.filterFull },
    { id: 'pending', label: t.filterPending },
  ];

  const stats = useMemo(() => {
    let full = 0;
    for (const row of accounts) {
      if (hasAccess(row)) full += 1;
    }
    return { total: accounts.length, full, pending: accounts.length - full };
  }, [accounts]);

  const hasActiveFilters = search.trim().length > 0 || accessFilter !== 'all';

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = accounts.filter((row) => {
      const active = hasAccess(row);
      if (accessFilter === 'full' && !active) return false;
      if (accessFilter === 'pending' && active) return false;
      if (!q) return true;
      const haystack = [
        row.user.name,
        row.user.username,
        row.user.email,
        row.user.phone,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      if (sortKey === 'username-asc') {
        return a.user.username.localeCompare(b.user.username, undefined, { sensitivity: 'base' });
      }
      const cmp = a.user.name.localeCompare(b.user.name, isRtl ? 'ar' : 'en', { sensitivity: 'base' });
      return sortKey === 'name-desc' ? -cmp : cmp;
    });

    return rows;
  }, [accounts, search, accessFilter, sortKey, isRtl]);

  const grantFull = (username: string) => {
    const result = grantFullCustomerAccess(username);
    if (!result) {
      toast.error(isRtl ? 'تعذّر منح الوصول' : 'Could not grant access');
      return;
    }
    toast.success(
      isRtl
        ? 'تم منح وصول كامل — يعمل عند تسجيل دخول العميل'
        : 'Full access granted — active on next login',
    );
    reload();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const username = deleteTarget.user.username;
    const ok = deleteCustomerAccount(username);
    setDeleteTarget(null);
    if (!ok) {
      toast.error(isRtl ? 'تعذّر حذف الحساب' : 'Could not delete account');
      return;
    }
    toast.success(isRtl ? 'تم حذف حساب العميل' : 'Customer account deleted');
    reload();
  };

  const renderAccessBadge = (row: CustomerAccountSnapshot) => {
    if (hasAccess(row)) {
      return (
        <Badge className="gap-1 bg-emerald-600/90 hover:bg-emerald-600/90">
          <UserCheck className="h-3 w-3" />
          {t.fullAccess}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1 text-amber-700 dark:text-amber-300">
        <UserX className="h-3 w-3" />
        {t.noAccess}
      </Badge>
    );
  };

  const signupAlert = isRtl
    ? { title: 'تسجيلات جديدة', markRead: 'تعليم الكل كمقروء', recent: 'الأحدث' }
    : { title: 'New sign-ups', markRead: 'Mark all read', recent: 'Latest' };
  const recentUnreadSignups = signupNotifications.filter((n) => !n.read).slice(0, 5);

  return (
    <>
      {signupUnread > 0 ? (
        <Card className="mb-4 border-sky-500/30 bg-sky-500/5 shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              {signupAlert.title}
              <Badge variant="secondary" className="bg-sky-500/15 text-sky-900 dark:text-sky-100">
                {signupUnread}
              </Badge>
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => markSignupsRead()}>
              {signupAlert.markRead}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <p className="text-xs text-muted-foreground">{signupAlert.recent}</p>
            <ul className="space-y-2">
              {recentUnreadSignups.map((n) => (
                <li
                  key={n.userId}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{n.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCustomerSignupNotificationBody(n, lang)}
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

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4 border-b border-border/50 bg-muted/15 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-xl">{t.title}</CardTitle>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>

          {accounts.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <StatPill icon={Users} label={t.total} value={stats.total} />
              <StatPill icon={UserCheck} label={t.active} value={stats.full} tone="success" />
              <StatPill icon={UserX} label={t.pending} value={stats.pending} tone="warning" />
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          {accounts.length === 0 ? (
            <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">{t.empty}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="ps-9"
                      placeholder={t.search}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                    <SelectTrigger className="w-full lg:w-[11rem]">
                      <SelectValue placeholder={t.sortLabel} />
                    </SelectTrigger>
                    <SelectContent dir={isRtl ? 'rtl' : 'ltr'}>
                      <SelectItem value="name-asc">{t.sortNameAsc}</SelectItem>
                      <SelectItem value="name-desc">{t.sortNameDesc}</SelectItem>
                      <SelectItem value="username-asc">{t.sortUsername}</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        setSearch('');
                        setAccessFilter('all');
                      }}
                    >
                      {t.clearFilters}
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {accessFilters.map((f) => (
                    <Button
                      key={f.id}
                      type="button"
                      size="sm"
                      variant={accessFilter === f.id ? 'default' : 'outline'}
                      onClick={() => setAccessFilter(f.id)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  {filteredAccounts.length} {t.results}
                </p>
              </div>

              {filteredAccounts.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/15 px-4 py-10 text-center text-sm text-muted-foreground">
                  {t.noResults}
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_auto_auto] gap-4 border-b border-border/60 bg-muted/25 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
                    <span>{t.customer}</span>
                    <span>{t.contact}</span>
                    <span>{t.access}</span>
                    <span className="text-end">{t.actions}</span>
                  </div>

                  <ul className="divide-y divide-border/60">
                    {filteredAccounts.map((row) => {
                      const username = row.user.username;
                      const key = username.trim().toLowerCase();
                      const fullAccess = hasFullCatalogAccess(row);

                      return (
                        <li
                          key={key}
                          className="grid gap-4 px-4 py-4 transition-colors hover:bg-muted/10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_auto_auto] lg:items-center"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                              {customerInitials(row.user.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{row.user.name}</p>
                              <p className="truncate font-mono text-sm text-muted-foreground" dir="ltr">
                                @{username}
                              </p>
                            </div>
                          </div>

                          <div className="min-w-0 space-y-1 text-sm text-muted-foreground lg:ps-0 ps-14">
                            <p className="flex min-w-0 items-center gap-2 truncate" dir="ltr">
                              <Mail className="h-3.5 w-3.5 shrink-0 opacity-60" />
                              <span className="truncate">{row.user.email || '—'}</span>
                            </p>
                            <p className="flex min-w-0 items-center gap-2 truncate" dir="ltr">
                              <Phone className="h-3.5 w-3.5 shrink-0 opacity-60" />
                              <span className="truncate">{row.user.phone || '—'}</span>
                            </p>
                          </div>

                          <div className="flex items-center ps-14 lg:ps-0">{renderAccessBadge(row)}</div>

                          <div className="flex flex-wrap items-center gap-2 ps-14 lg:justify-end lg:ps-0">
                            <Button
                              type="button"
                              size="sm"
                              className="gap-1"
                              disabled={fullAccess}
                              onClick={() => grantFull(username)}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t.grantFull}</span>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setDeleteTarget(row)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{t.deleteAccount}</span>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'حذف حساب العميل؟' : 'Delete customer account?'}</DialogTitle>
            <DialogDescription>
              {isRtl ? (
                <>
                  سيتم حذف حساب <span className="font-medium text-foreground">{deleteTarget?.user.name}</span>{' '}
                  (<span dir="ltr">@{deleteTarget?.user.username}</span>) نهائياً. لن يتمكن من تسجيل الدخول مرة
                  أخرى إلا بإنشاء حساب جديد.
                </>
              ) : (
                <>
                  This will permanently delete{' '}
                  <span className="font-medium text-foreground">{deleteTarget?.user.name}</span> (
                  <span dir="ltr">@{deleteTarget?.user.username}</span>). They cannot sign in again unless they
                  register a new account.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              {isRtl ? 'نعم، احذف' : 'Yes, delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

function StatPill({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning';
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3',
        tone === 'success' && 'border-emerald-500/25 bg-emerald-500/5',
        tone === 'warning' && 'border-amber-500/25 bg-amber-500/5',
        tone === 'default' && 'border-border/60 bg-background/80',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          tone === 'success' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
          tone === 'warning' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
          tone === 'default' && 'bg-muted/60 text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default AdminCustomersPanel;
