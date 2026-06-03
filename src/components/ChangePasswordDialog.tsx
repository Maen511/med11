import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type ChangePasswordErrorCode =
  | 'wrong_current'
  | 'too_short'
  | 'mismatch'
  | 'same'
  | 'not_found';

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; code: ChangePasswordErrorCode };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ar';
  onSubmit: (currentPassword: string, newPassword: string, confirmPassword: string) => ChangePasswordResult;
  onSuccess?: () => void;
};

const ChangePasswordDialog = ({ open, onOpenChange, language, onSubmit, onSuccess }: Props) => {
  const isRtl = language === 'ar';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const t =
    language === 'ar'
      ? {
          title: 'تغيير كلمة المرور',
          desc: 'أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة.',
          current: 'كلمة المرور الحالية',
          new: 'كلمة المرور الجديدة',
          confirm: 'تأكيد كلمة المرور',
          save: 'حفظ',
          cancel: 'إلغاء',
          wrongCurrent: 'كلمة المرور الحالية غير صحيحة',
          tooShort: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل',
          mismatch: 'التأكيد لا يطابق كلمة المرور الجديدة',
          same: 'اختر كلمة مرور مختلفة',
        }
      : {
          title: 'Change password',
          desc: 'Enter your current password, then choose a new one.',
          current: 'Current password',
          new: 'New password',
          confirm: 'Confirm password',
          save: 'Save',
          cancel: 'Cancel',
          wrongCurrent: 'Current password is incorrect',
          tooShort: 'Password must be at least 4 characters',
          mismatch: 'Confirmation does not match',
          same: 'Choose a different password',
        };

  const errors: Record<ChangePasswordErrorCode, string> = {
    wrong_current: t.wrongCurrent,
    too_short: t.tooShort,
    mismatch: t.mismatch,
    same: t.same,
    not_found: t.wrongCurrent,
  };

  useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = onSubmit(currentPassword, newPassword, confirmPassword);
    if (result.ok === false) {
      setError(errors[result.code]);
      return;
    }
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.desc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="change-pw-current">{t.current}</Label>
            <Input
              id="change-pw-current"
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
            <Label htmlFor="change-pw-new">{t.new}</Label>
            <Input
              id="change-pw-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              dir="ltr"
              minLength={4}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="change-pw-confirm">{t.confirm}</Label>
            <Input
              id="change-pw-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              dir="ltr"
              minLength={4}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button type="submit" className="btn-primary">
              {t.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
