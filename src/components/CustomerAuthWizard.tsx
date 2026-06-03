import { useRef, useState, type ReactNode } from 'react';
import { focusNextOnTabOrEnter } from '@/lib/authFieldFocus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { AtSign, Lock, Mail, User, UserCircle, UserPlus } from 'lucide-react';
import {
  buildJordanPhone,
  isValidJordanLocalPhone,
  JORDAN_PHONE_LOCAL_LENGTH,
  sanitizeJordanLocalDigits,
} from '@/lib/jordanPhone';

export const CUSTOMER_REGISTER_FORM_ID = 'customer-register-form';

type Props = {
  language: 'en' | 'ar';
  onRegistered?: () => void;
  showIntro?: boolean;
  embedded?: boolean;
  /** لوحة داكنة (نافذة الحساب) */
  darkPanel?: boolean;
  /** نموذج البوابة (نافذة الحساب من الهيدر) */
  portalLayout?: boolean;
  /** إخفاء زر الإرسال داخل النموذج (يُعرض خارج منطقة التمرير في النافذة) */
  hideSubmit?: boolean;
  formId?: string;
};

const emailLooksValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function AuthSection({
  title,
  children,
  dark,
}: {
  title: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={cn('h-px flex-1', dark ? 'bg-zinc-800' : 'bg-border')} />
        <span
          className={cn(
            'shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.14em]',
            dark ? 'text-zinc-500' : 'text-muted-foreground',
          )}
        >
          {title}
        </span>
        <span className={cn('h-px flex-1', dark ? 'bg-zinc-800' : 'bg-border')} />
      </div>
      {children}
    </div>
  );
}

function AuthField({
  id,
  label,
  icon: Icon,
  children,
  dark,
}: {
  id: string;
  label: string;
  icon: typeof User;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className={cn('block text-start text-sm font-medium', dark && 'text-zinc-400')}>
        {label}
      </Label>
      <div className="relative">
        <Icon
          className={cn(
            'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500',
            'start-3',
          )}
          aria-hidden
        />
        {children}
      </div>
    </div>
  );
}

function PortalField({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="block text-start text-sm font-medium text-zinc-50">
        {label}
      </Label>
      {children}
    </div>
  );
}

const portalInputClass =
  'h-11 border-zinc-700/80 bg-zinc-900/80 text-zinc-50 shadow-sm placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-zinc-600/40';

const inputBase = (embedded: boolean, dark: boolean, extra?: string) =>
  cn(
    'h-11 ps-10 text-start',
    embedded && dark
      ? 'border-zinc-700/80 bg-zinc-900/80 text-zinc-50 placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-zinc-600/40'
      : embedded
        ? 'border-border/70 bg-background/95 shadow-sm'
        : '',
    extra,
  );

const CustomerAuthWizard = ({
  language,
  onRegistered,
  showIntro = true,
  embedded = false,
  darkPanel = false,
  portalLayout = false,
  hideSubmit = false,
  formId = CUSTOMER_REGISTER_FORM_ID,
}: Props) => {
  const { registerCustomer } = useAuth();
  const isRtl = language === 'ar';
  const dark = Boolean(embedded && darkPanel);

  const passwordRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const onPhoneChange = (raw: string) => {
    setPhone(sanitizeJordanLocalDigits(raw));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (u.length < 2) {
      toast.error(language === 'ar' ? 'اسم المستخدم قصير جداً (حرفان على الأقل).' : 'Username is too short (at least 2 characters).');
      return;
    }
    if (/\s/.test(u)) {
      toast.error(language === 'ar' ? 'لا تستخدم المسافات في اسم المستخدم.' : 'Username cannot contain spaces.');
      return;
    }
    if (password.length < 4) {
      toast.error(language === 'ar' ? 'كلمة المرور يجب أن تكون 4 أحرف على الأقل.' : 'Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(language === 'ar' ? 'كلمتا المرور غير متطابقتين.' : 'Passwords do not match.');
      return;
    }
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first) {
      toast.error(language === 'ar' ? 'أدخل الاسم الأول.' : 'Please enter your first name.');
      return;
    }
    if (!last) {
      toast.error(language === 'ar' ? 'أدخل اسم العائلة.' : 'Please enter your last name.');
      return;
    }
    const displayName = `${first} ${last}`;
    if (!emailLooksValid(email)) {
      toast.error(language === 'ar' ? 'أدخل بريداً إلكترونياً صحيحاً.' : 'Please enter a valid email address.');
      return;
    }
    if (!isValidJordanLocalPhone(phone)) {
      toast.error(
        language === 'ar'
          ? `أدخل ${JORDAN_PHONE_LOCAL_LENGTH} أرقام تبدأ بـ 7 (مثال: 791234567).`
          : `Enter ${JORDAN_PHONE_LOCAL_LENGTH} digits starting with 7 (e.g. 791234567).`,
      );
      return;
    }

    const result = registerCustomer({
      username: u,
      password,
      name: displayName,
      email: email.trim(),
      phone: buildJordanPhone(phone),
    });

    if (result === 'username_taken') {
      toast.error(language === 'ar' ? 'اسم المستخدم مستخدم. اختر اسماً آخر.' : 'That username is already taken. Pick another one.');
      return;
    }
    if (result === 'email_taken') {
      toast.error(language === 'ar' ? 'البريد مسجّل بحساب آخر.' : 'This email is already used on another account.');
      return;
    }
    if (result === 'invalid') {
      toast.error(language === 'ar' ? 'أكمل جميع الحقول.' : 'Please complete all fields.');
      return;
    }

    toast.success(
      language === 'ar'
        ? 'تم إنشاء الحساب. سيُفعَّل الكتالوج بعد منحك الوصول من الإدارة.'
        : 'Account created. Catalog access will be enabled once the admin grants it.',
    );
    onRegistered?.();
  };

  const sectionCredentials = language === 'ar' ? 'بيانات الدخول' : 'Sign-in details';
  const sectionPersonal = language === 'ar' ? 'معلوماتك' : 'Your details';

  if (portalLayout) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
        <form
          id={formId}
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 sm:p-5"
        >
          <PortalField id="wiz-username" label={language === 'ar' ? 'اسم المستخدم' : 'User Name'}>
            <Input
              id="wiz-username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => focusNextOnTabOrEnter(e, passwordRef)}
              enterKeyHint="next"
              dir="ltr"
              placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
              className={portalInputClass}
              required
            />
          </PortalField>

          <div className="grid gap-4 sm:grid-cols-2">
            <PortalField id="wiz-first-name" label={language === 'ar' ? 'الاسم الأول' : 'First name'}>
              <Input
                id="wiz-first-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                dir={isRtl ? 'rtl' : 'ltr'}
                placeholder={language === 'ar' ? 'مثال: محمد' : 'e.g. John'}
                className={portalInputClass}
                required
              />
            </PortalField>
            <PortalField id="wiz-last-name" label={language === 'ar' ? 'اسم العائلة' : 'Last name'}>
              <Input
                id="wiz-last-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                dir={isRtl ? 'rtl' : 'ltr'}
                placeholder={language === 'ar' ? 'مثال: أحمد' : 'e.g. Smith'}
                className={portalInputClass}
                required
              />
            </PortalField>
          </div>

          <PortalField id="wiz-phone" label={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}>
            <div className="flex" dir="ltr">
              <span
                className="inline-flex shrink-0 items-center rounded-s-md border border-e-0 border-zinc-700/80 bg-zinc-900/90 px-3 font-mono text-sm font-medium text-zinc-300"
                aria-hidden
              >
                +962
              </span>
              <Input
                id="wiz-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => onPhoneChange(sanitizeJordanLocalDigits(e.target.value))}
                onKeyDown={(e) => {
                  const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                  if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
                  if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  onPhoneChange(sanitizeJordanLocalDigits(e.clipboardData.getData('text')));
                }}
                maxLength={JORDAN_PHONE_LOCAL_LENGTH}
                placeholder="791234567"
                dir="ltr"
                className={cn(portalInputClass, 'rounded-s-none ps-3 font-mono tracking-wide')}
                required
              />
            </div>
          </PortalField>

          <PortalField id="wiz-email" label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}>
            <Input
              id="wiz-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              placeholder="name@email.com"
              className={portalInputClass}
              required
            />
          </PortalField>

          <PortalField id="wiz-password" label={language === 'ar' ? 'كلمة المرور' : 'Password'}>
            <Input
              ref={passwordRef}
              id="wiz-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              enterKeyHint="next"
              dir="ltr"
              placeholder="••••••••"
              className={portalInputClass}
              required
            />
          </PortalField>

          <PortalField
            id="wiz-password-confirm"
            label={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
          >
            <Input
              id="wiz-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              enterKeyHint="done"
              dir="ltr"
              placeholder="••••••••"
              className={portalInputClass}
              required
            />
          </PortalField>

          {!hideSubmit ? (
            <Button type="submit" className="btn-primary mt-1 h-11 w-full text-base font-semibold">
              {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
            </Button>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <div className={cn(embedded ? 'space-y-4' : 'space-y-5')} dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      {showIntro && !embedded && (
        <header className="space-y-1.5 text-start">
          <h2 className="text-lg font-semibold tracking-tight">
            {language === 'ar' ? 'إنشاء حساب' : 'Create account'}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {language === 'ar'
              ? 'أكمل الخطوات أدناه. يمكنك إضافة عنوان التوصيل لاحقاً من صفحة العناوين.'
              : 'Complete the steps below. You can add a delivery address later from the addresses page.'}
          </p>
        </header>
      )}

      {embedded && showIntro ? (
        <div
          className={cn(
            'flex gap-3 rounded-xl border p-3.5 text-start',
            dark
              ? 'border-emerald-500/20 bg-emerald-500/10'
              : 'border-primary/20 bg-primary/8',
          )}
        >
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary/10 text-primary',
            )}
          >
            <UserPlus className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className={cn('text-sm font-semibold', dark ? 'text-zinc-100' : 'text-foreground')}>
              {language === 'ar' ? 'حساب جديد في دقائق' : 'New account in minutes'}
            </p>
            <p className={cn('text-xs leading-relaxed', dark ? 'text-zinc-400' : 'text-muted-foreground')}>
              {language === 'ar'
                ? 'املأ الحقول بالترتيب. عنوان التوصيل من صفحة العناوين بعد التسجيل.'
                : 'Fill in the fields in order. Add your delivery address after signing up.'}
            </p>
          </div>
        </div>
      ) : null}

      <form
        id={formId}
        onSubmit={onSubmit}
        className={cn(
          'space-y-5',
          embedded && dark
            ? 'rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 shadow-inner sm:p-5'
            : embedded
              ? 'rounded-xl border border-border/60 bg-muted/20 p-4 shadow-inner sm:p-5'
              : 'rounded-xl border bg-muted/30 p-4 sm:p-5',
        )}
      >
        <AuthSection title={sectionCredentials} dark={dark}>
          <AuthField id="wiz-username" label={language === 'ar' ? 'اسم المستخدم' : 'Username'} icon={AtSign} dark={dark}>
            <Input
              id="wiz-username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => focusNextOnTabOrEnter(e, passwordRef)}
              enterKeyHint="next"
              dir="ltr"
              placeholder={language === 'ar' ? 'مثال: ahmed' : 'e.g. ahmed'}
              className={inputBase(embedded, dark)}
              required
            />
          </AuthField>

          <div className="grid gap-3 sm:grid-cols-2">
            <AuthField id="wiz-password" label={language === 'ar' ? 'كلمة المرور' : 'Password'} icon={Lock} dark={dark}>
              <Input
                ref={passwordRef}
                id="wiz-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                enterKeyHint="next"
                dir="ltr"
                placeholder="••••••••"
                className={inputBase(embedded, dark)}
                required
              />
            </AuthField>
            <AuthField
              id="wiz-password-confirm"
              label={language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'}
              icon={Lock}
              dark={dark}
            >
              <Input
                id="wiz-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                dir="ltr"
                placeholder="••••••••"
                className={inputBase(embedded, dark)}
                required
              />
            </AuthField>
          </div>
        </AuthSection>

        <AuthSection title={sectionPersonal} dark={dark}>
          <div className="grid gap-3 sm:grid-cols-2">
            <AuthField
              id="wiz-first-name"
              label={language === 'ar' ? 'الاسم الأول' : 'First name'}
              icon={User}
              dark={dark}
            >
              <Input
                id="wiz-first-name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                dir={isRtl ? 'rtl' : 'ltr'}
                placeholder={language === 'ar' ? 'مثال: محمد' : 'e.g. John'}
                className={inputBase(embedded, dark)}
                required
              />
            </AuthField>
            <AuthField
              id="wiz-last-name"
              label={language === 'ar' ? 'اسم العائلة' : 'Last name'}
              icon={UserCircle}
              dark={dark}
            >
              <Input
                id="wiz-last-name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                dir={isRtl ? 'rtl' : 'ltr'}
                placeholder={language === 'ar' ? 'مثال: أحمد' : 'e.g. Smith'}
                className={inputBase(embedded, dark)}
                required
              />
            </AuthField>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <AuthField id="wiz-email" label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'} icon={Mail} dark={dark}>
              <Input
                id="wiz-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                placeholder="name@email.com"
                className={inputBase(embedded, dark)}
                required
              />
            </AuthField>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wiz-phone" className={cn('block text-start text-sm font-medium', dark && 'text-zinc-400')}>
              {language === 'ar' ? 'رقم الهاتف' : 'Phone'}
            </Label>
            <div className="flex" dir="ltr">
              <span
                className={cn(
                  'inline-flex shrink-0 items-center rounded-s-md border border-e-0 px-3 font-mono text-sm font-medium',
                  embedded && dark
                    ? 'border-zinc-700/80 bg-zinc-900/90 text-zinc-300'
                    : 'border-border/70 bg-muted/40 text-foreground',
                )}
                aria-hidden
              >
                +962
              </span>
              <Input
                id="wiz-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => onPhoneChange(sanitizeJordanLocalDigits(e.target.value))}
                onKeyDown={(e) => {
                  const nav = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
                  if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
                  if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault();
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  onPhoneChange(sanitizeJordanLocalDigits(e.clipboardData.getData('text')));
                }}
                maxLength={JORDAN_PHONE_LOCAL_LENGTH}
                placeholder="791234567"
                dir="ltr"
                className={cn(
                  inputBase(embedded, dark, 'rounded-s-none ps-3 font-mono tracking-wide'),
                  'flex-1',
                )}
                required
                aria-describedby="wiz-phone-hint"
              />
            </div>
            <p
              id="wiz-phone-hint"
              className={cn('text-start text-[0.7rem]', dark ? 'text-zinc-500' : 'text-muted-foreground')}
            >
              {language === 'ar'
                ? `${JORDAN_PHONE_LOCAL_LENGTH} أرقام (تبدأ بـ 7) بعد +962`
                : `${JORDAN_PHONE_LOCAL_LENGTH} digits (start with 7) after +962`}
            </p>
          </div>
        </AuthSection>

        {!hideSubmit ? (
          <Button
            type="submit"
            className={cn(
              'btn-primary w-full gap-2 font-semibold shadow-md',
              embedded ? 'h-11 text-base' : 'h-10',
            )}
          >
            <UserCircle className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {language === 'ar' ? 'إنشاء الحساب' : 'Create account'}
          </Button>
        ) : null}
      </form>
    </div>
  );
};

export default CustomerAuthWizard;
