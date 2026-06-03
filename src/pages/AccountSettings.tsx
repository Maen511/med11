import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

const AccountSettings = () => {
  const { language } = useLanguage();
  const { user, changeCustomerPassword } = useAuth();
  const isRtl = language === 'ar';
  const [passwordOpen, setPasswordOpen] = useState(false);

  const t =
    language === 'ar'
      ? {
          title: 'الإعدادات',
          subtitle: 'إدارة أمان حسابك',
          passwordTitle: 'كلمة المرور',
          passwordDesc: 'غيّر كلمة مرور تسجيل الدخول إلى المتجر.',
          changeBtn: 'تغيير كلمة المرور',
          success: 'تم تحديث كلمة المرور',
        }
      : {
          title: 'Settings',
          subtitle: 'Manage your account security',
          passwordTitle: 'Password',
          passwordDesc: 'Change the password you use to sign in to the store.',
          changeBtn: 'Change password',
          success: 'Password updated',
        };

  return (
    <div className="w-full" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <main className="mx-auto w-full max-w-xl pb-2">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          {user?.username ? (
            <p className="font-mono text-xs text-muted-foreground" dir="ltr">
              @{user.username}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Lock className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1 text-start">
                <h2 className="text-base font-semibold">{t.passwordTitle}</h2>
                <p className="text-sm text-muted-foreground">{t.passwordDesc}</p>
              </div>
            </div>
            <Button type="button" className="btn-primary shrink-0 gap-2" onClick={() => setPasswordOpen(true)}>
              <Lock className="h-4 w-4" aria-hidden />
              {t.changeBtn}
            </Button>
          </div>
        </div>
      </main>

      <ChangePasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        language={language}
        onSubmit={changeCustomerPassword}
        onSuccess={() => toast.success(t.success)}
      />
    </div>
  );
};

export default AccountSettings;
