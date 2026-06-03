import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AccountSettings = () => {
  const { language } = useLanguage();
  const { user, changeCustomerPassword } = useAuth();
  const isRtl = language === 'ar';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const t =
    language === 'ar'
      ? {
          title: 'الإعدادات',
          subtitle: 'إدارة أمان حسابك',
          passwordTitle: 'كلمة المرور',
          passwordDesc: 'غيّر كلمة مرور تسجيل الدخول إلى المتجر.',
          current: 'كلمة المرور الحالية',
          new: 'كلمة المرور الجديدة',
          confirm: 'تأكيد كلمة المرور',
          save: 'حفظ كلمة المرور',
          success: 'تم تحديث كلمة المرور',
          wrongCurrent: 'كلمة المرور الحالية غير صحيحة',
          tooShort: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل',
          mismatch: 'التأكيد لا يطابق كلمة المرور الجديدة',
          same: 'اختر كلمة مرور مختلفة',
        }
      : {
          title: 'Settings',
          subtitle: 'Manage your account security',
          passwordTitle: 'Password',
          passwordDesc: 'Change the password you use to sign in to the store.',
          current: 'Current password',
          new: 'New password',
          confirm: 'Confirm password',
          save: 'Save password',
          success: 'Password updated',
          wrongCurrent: 'Current password is incorrect',
          tooShort: 'Password must be at least 4 characters',
          mismatch: 'Confirmation does not match',
          same: 'Choose a different password',
        };

  const errors = {
    wrong_current: t.wrongCurrent,
    too_short: t.tooShort,
    mismatch: t.mismatch,
    same: t.same,
    not_found: t.wrongCurrent,
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = changeCustomerPassword(currentPassword, newPassword, confirmPassword);
    if (result.ok === false) {
      toast.error(errors[result.code]);
      return;
    }
    toast.success(t.success);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
          <div className="mb-5 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1 text-start">
              <h2 className="text-base font-semibold">{t.passwordTitle}</h2>
              <p className="text-sm text-muted-foreground">{t.passwordDesc}</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-current-pw">{t.current}</Label>
              <Input
                id="settings-current-pw"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                dir="ltr"
                className={cn(isRtl && 'text-start')}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-new-pw">{t.new}</Label>
              <Input
                id="settings-new-pw"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-confirm-pw">{t.confirm}</Label>
              <Input
                id="settings-confirm-pw"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                required
              />
            </div>
            <Button type="submit" className="btn-primary w-full sm:w-auto">
              {t.save}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;
