import { useEffect, useRef, useState, type ReactNode } from 'react';
import { focusNextOnTabOrEnter } from '@/lib/authFieldFocus';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { addAdminAccount, type AddAdminAccountResult } from '@/lib/adminAccounts';
import { AtSign, Lock, Mail, Shield, User, UserCircle, UserPlus } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ar';
  onAdded?: () => void;
};

function Field({
  id,
  label,
  icon: Icon,
  children,
  hint,
}: {
  id: string;
  label: string;
  icon: typeof User;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-start text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Icon
          className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        {children}
      </div>
      {hint ? <p className="text-start text-[0.7rem] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const inputClass = 'h-11 ps-10';

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

const AddAdminDialog = ({ open, onOpenChange, language, onAdded }: Props) => {
  const isRtl = language === 'ar';
  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const t =
    language === 'ar'
      ? {
          title: 'إضافة مسؤول',
          subtitle: 'أنشئ حساب أدمن جديد يستطيع الدخول إلى لوحة التحكم.',
          credentials: 'بيانات الدخول',
          profile: 'معلومات إضافية',
          username: 'اسم المستخدم',
          usernamePh: 'مثال: admin2',
          email: 'البريد الإلكتروني',
          emailPh: 'name@company.com',
          emailHint: 'اختياري — للتواصل أو استعادة الحساب لاحقاً',
          displayName: 'الاسم المعروض',
          displayNamePh: 'مثال: أحمد',
          displayHint: 'اختياري — يظهر في القائمة',
          password: 'كلمة المرور',
          confirm: 'تأكيد كلمة المرور',
          cancel: 'إلغاء',
          submit: 'إضافة المسؤول',
          success: 'تمت إضافة المسؤول',
          usernameRequired: 'أدخل اسم المستخدم',
          usernameTaken: 'اسم المستخدم مستخدم مسبقاً',
          emailTaken: 'البريد مستخدم مسبقاً',
          tooShort: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل',
          mismatch: 'التأكيد لا يطابق كلمة المرور',
        }
      : {
          title: 'Add admin',
          subtitle: 'Create a new dashboard account with admin access.',
          credentials: 'Sign-in details',
          profile: 'Optional info',
          username: 'Username',
          usernamePh: 'e.g. admin2',
          email: 'Email',
          emailPh: 'name@company.com',
          emailHint: 'Optional — for contact or recovery later',
          displayName: 'Display name',
          displayNamePh: 'e.g. John',
          displayHint: 'Optional — shown in the admin list',
          password: 'Password',
          confirm: 'Confirm password',
          cancel: 'Cancel',
          submit: 'Add admin',
          success: 'Admin added',
          usernameRequired: 'Enter a username',
          usernameTaken: 'Username is already taken',
          emailTaken: 'Email is already in use',
          tooShort: 'Password must be at least 4 characters',
          mismatch: 'Confirmation does not match',
        };

  const addErrors: Record<Exclude<AddAdminAccountResult, { ok: true }>['code'], string> = {
    username_required: t.usernameRequired,
    username_taken: t.usernameTaken,
    email_taken: t.emailTaken,
    password_short: t.tooShort,
    password_mismatch: t.mismatch,
  };

  const reset = () => {
    setUsername('');
    setEmail('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setBusy(false);
  };

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    const id = window.requestAnimationFrame(() => {
      usernameRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = addAdminAccount({
        username,
        email,
        name,
        password,
        confirmPassword,
      });
      if (result.ok === false) {
        toast.error(addErrors[result.code]);
        return;
      }
      toast.success(t.success);
      onAdded?.();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        animation="reduced"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          'gap-0 overflow-hidden p-0 sm:max-w-[min(100%,520px)]',
          'border-border/80 shadow-xl sm:rounded-2xl',
        )}
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ar' : 'en'}
      >
        <div className="border-b border-border/80 bg-muted/30 px-6 pb-5 pt-6">
          <div className="flex items-start gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-sm ring-1 ring-primary/20"
              aria-hidden
            >
              <Shield className="h-6 w-6" />
            </span>
            <DialogHeader className="space-y-1.5 p-0 text-start">
              <DialogTitle className="text-xl font-semibold tracking-tight">{t.title}</DialogTitle>
              <DialogDescription className="text-pretty text-sm leading-relaxed">
                {t.subtitle}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="max-h-[min(60dvh,420px)] space-y-5 overflow-y-auto overscroll-contain px-6 py-5">
            <SectionTitle>{t.credentials}</SectionTitle>

            <Field id="add-admin-username" label={t.username} icon={AtSign}>
              <Input
                ref={usernameRef}
                id="add-admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => focusNextOnTabOrEnter(e, passwordRef)}
                autoComplete="off"
                dir="ltr"
                placeholder={t.usernamePh}
                className={inputClass}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="add-admin-password" label={t.password} icon={Lock}>
                <Input
                  ref={passwordRef}
                  id="add-admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  dir="ltr"
                  placeholder="••••••••"
                  className={inputClass}
                  required
                  minLength={4}
                />
              </Field>
              <Field id="add-admin-confirm" label={t.confirm} icon={Lock}>
                <Input
                  id="add-admin-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  dir="ltr"
                  placeholder="••••••••"
                  className={inputClass}
                  required
                  minLength={4}
                />
              </Field>
            </div>

            <SectionTitle>{t.profile}</SectionTitle>

            <Field id="add-admin-email" label={t.email} icon={Mail} hint={t.emailHint}>
              <Input
                id="add-admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                dir="ltr"
                placeholder={t.emailPh}
                className={inputClass}
              />
            </Field>

            <Field id="add-admin-name" label={t.displayName} icon={UserCircle} hint={t.displayHint}>
              <Input
                id="add-admin-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                dir={isRtl ? 'rtl' : 'ltr'}
                placeholder={t.displayNamePh}
                className={inputClass}
              />
            </Field>
          </div>

          <DialogFooter className="gap-2 border-t border-border/80 bg-muted/20 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              {t.cancel}
            </Button>
            <Button type="submit" className="gap-2" disabled={busy}>
              <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
              {busy ? '…' : t.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAdminDialog;
