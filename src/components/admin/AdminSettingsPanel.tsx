import { useCallback, useEffect, useState } from 'react';
import { Lock, UserPlus, Users, Trash2, Shield, LayoutTemplate } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AddAdminDialog from '@/components/admin/AddAdminDialog';
import EditFooterDialog from '@/components/admin/EditFooterDialog';
import { canAccessAdminSettings } from '@/lib/adminPermissions';
import {
  ADMIN_ACCOUNTS_CHANGED,
  changeAdminPasswordForSession,
  listAllAdminAccounts,
  PRIMARY_ADMIN_ID,
  removeAdminAccount,
  resolveAdminAccountForSession,
  type AdminAccountRecord,
} from '@/lib/adminAccounts';

type Props = {
  language: 'en' | 'ar';
};

const AdminSettingsPanel = ({ language }: Props) => {
  const isRtl = language === 'ar';
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminAccountRecord[]>([]);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);

  const reload = useCallback(() => setAdmins(listAllAdminAccounts()), []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(ADMIN_ACCOUNTS_CHANGED, onChange);
    return () => window.removeEventListener(ADMIN_ACCOUNTS_CHANGED, onChange);
  }, [reload]);

  const sessionAdmin = user?.username ? resolveAdminAccountForSession(user.username) : null;
  const isPrimaryAdmin = canAccessAdminSettings(user?.username);

  if (!isPrimaryAdmin) {
    return null;
  }

  const t =
    language === 'ar'
      ? {
          passwordTitle: 'كلمة المرور',
          passwordDesc: 'غيّر كلمة مرور حسابك الحالي في لوحة التحكم.',
          changePassword: 'تغيير كلمة المرور',
          passwordSuccess: 'تم تحديث كلمة المرور',
          adminsTitle: 'مسؤولون إضافيون',
          adminsDesc: 'أضف حسابات أدمن أخرى تستطيع الدخول للوحة التحكم.',
          addBtn: 'إضافة مسؤول',
          listTitle: 'قائمة المسؤولين',
          primary: 'رئيسي',
          additional: 'إضافي',
          remove: 'حذف',
          removed: 'تم حذف المسؤول',
          cannotRemovePrimary: 'لا يمكن حذف الحساب الرئيسي',
          loggedInAs: 'مسجّل الدخول كـ',
          footerTitle: 'فوتر المتجر',
          footerDesc: 'التواصل، الدعم، العنوان، وساعات العمل في أسفل الصفحات.',
          editFooter: 'تعديل الفوتر',
        }
      : {
          passwordTitle: 'Password',
          passwordDesc: 'Change the password for your current dashboard account.',
          changePassword: 'Change password',
          passwordSuccess: 'Password updated',
          adminsTitle: 'Additional admins',
          adminsDesc: 'Add more admin accounts that can access the dashboard.',
          addBtn: 'Add admin',
          listTitle: 'Admin accounts',
          primary: 'Primary',
          additional: 'Additional',
          remove: 'Remove',
          removed: 'Admin removed',
          cannotRemovePrimary: 'Cannot remove the primary account',
          loggedInAs: 'Signed in as',
          footerTitle: 'Store footer',
          footerDesc: 'Contact, support, address, and hours shown at the bottom of pages.',
          editFooter: 'Edit footer',
        };

  const handleRemove = (id: string) => {
    if (id === PRIMARY_ADMIN_ID) {
      toast.error(t.cannotRemovePrimary);
      return;
    }
    if (removeAdminAccount(id)) {
      reload();
      toast.success(t.removed);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      {sessionAdmin ? (
        <p className="text-sm text-muted-foreground">
          {t.loggedInAs}{' '}
          <span className="font-medium text-foreground">{sessionAdmin.username}</span>
          {sessionAdmin.id === PRIMARY_ADMIN_ID ? (
            <Badge variant="secondary" className="ms-2">
              {t.primary}
            </Badge>
          ) : null}
        </p>
      ) : null}

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1 text-start sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" aria-hidden />
              {t.passwordTitle}
            </CardTitle>
            <CardDescription>{t.passwordDesc}</CardDescription>
          </div>
          <Button type="button" className="mt-3 shrink-0 gap-2 sm:mt-0" onClick={() => setPasswordOpen(true)}>
            <Lock className="h-4 w-4" aria-hidden />
            {t.changePassword}
          </Button>
        </CardHeader>
      </Card>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        language={language}
        onSubmit={(current, newPw, confirm) => {
          if (!user?.username) return { ok: false as const, code: 'not_found' as const };
          return changeAdminPasswordForSession(user.username, current, newPw, confirm);
        }}
        onSuccess={() => {
          reload();
          toast.success(t.passwordSuccess);
        }}
      />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1 text-start sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" aria-hidden />
              {t.footerTitle}
            </CardTitle>
            <CardDescription>{t.footerDesc}</CardDescription>
          </div>
          <Button type="button" variant="outline" className="mt-3 shrink-0 gap-2 sm:mt-0" onClick={() => setFooterOpen(true)}>
            <LayoutTemplate className="h-4 w-4" aria-hidden />
            {t.editFooter}
          </Button>
        </CardHeader>
      </Card>

      <EditFooterDialog open={footerOpen} onOpenChange={setFooterOpen} language={language} />

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-1 text-start sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" aria-hidden />
              {t.adminsTitle}
            </CardTitle>
            <CardDescription>{t.adminsDesc}</CardDescription>
          </div>
          <Button type="button" className="mt-3 shrink-0 gap-2 sm:mt-0" onClick={() => setAddAdminOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {t.addBtn}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-muted-foreground" />
              {t.listTitle}
            </h3>
            <ul className="divide-y rounded-lg border border-border/60">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{admin.username}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {admin.name}
                      {admin.email ? ` · ${admin.email}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={admin.id === PRIMARY_ADMIN_ID ? 'default' : 'outline'}>
                      {admin.id === PRIMARY_ADMIN_ID ? t.primary : t.additional}
                    </Badge>
                    {admin.id !== PRIMARY_ADMIN_ID ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label={t.remove}
                        onClick={() => handleRemove(admin.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <AddAdminDialog
        open={addAdminOpen}
        onOpenChange={setAddAdminOpen}
        language={language}
        onAdded={reload}
      />
    </div>
  );
};

export default AdminSettingsPanel;
