import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { focusNextOnTabOrEnter } from '@/lib/authFieldFocus';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { CUSTOMER_REGISTER_FORM_ID } from '@/components/CustomerAuthWizard';
import { toast } from 'sonner';
import { LOGO_URL } from '@/lib/branding';
import { cn } from '@/lib/utils';
import { AtSign, Lock, LogIn, Sparkles, UserPlus } from 'lucide-react';

const CustomerAuthWizard = lazy(() => import('@/components/CustomerAuthWizard'));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ar';
};

function LoginField({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon: typeof AtSign;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="block text-start text-sm font-medium text-zinc-400">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        {children}
      </div>
    </div>
  );
}

const loginInputClass =
  'h-11 border-zinc-700/80 bg-zinc-900/80 ps-10 text-zinc-50 shadow-sm placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-zinc-600/40';

const CustomerAuthDialog = ({ open, onOpenChange, language }: Props) => {
  const navigate = useNavigate();
  const { loginCustomer, adminLogin } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [registerKey, setRegisterKey] = useState(0);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const loginUserRef = useRef<HTMLInputElement>(null);
  const isRtl = language === 'ar';

  useEffect(() => {
    if (!open) {
      setTab('login');
      setLoginUsername('');
      setLoginPassword('');
      setLoginBusy(false);
      setRegisterKey((k) => k + 1);
    }
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'login') return;
    const id = window.requestAnimationFrame(() => {
      loginUserRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, tab]);

  const goProfile = useCallback(() => {
    onOpenChange(false);
    navigate('/profile', { replace: true });
  }, [navigate, onOpenChange]);

  const goAdmin = useCallback(() => {
    onOpenChange(false);
    navigate('/admin', { replace: true });
  }, [navigate, onOpenChange]);

  const goAddressesAfterRegister = useCallback(() => {
    onOpenChange(false);
    navigate('/addresses', { replace: true });
  }, [navigate, onOpenChange]);

  const onLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUsername.trim();
    if (!u) {
      toast.error(language === 'ar' ? 'أدخل اسم المستخدم' : 'Enter your username.');
      return;
    }
    if (!loginPassword) {
      toast.error(language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password.');
      return;
    }
    setLoginBusy(true);
    try {
      if (adminLogin(u, loginPassword)) {
        toast.success(language === 'ar' ? 'دخول لوحة التحكم' : 'Admin dashboard');
        setLoginUsername('');
        setLoginPassword('');
        goAdmin();
        return;
      }
      const ok = loginCustomer(u, loginPassword);
      if (ok) {
        toast.success(language === 'ar' ? 'تم تسجيل الدخول' : 'Signed in');
        setLoginUsername('');
        setLoginPassword('');
        goProfile();
      } else {
        toast.error(
          language === 'ar'
            ? 'اسم المستخدم أو كلمة المرور غير صحيحة.'
            : 'Incorrect username or password.',
        );
      }
    } finally {
      setLoginBusy(false);
    }
  };

  const title = language === 'ar' ? 'مرحباً بك' : 'Welcome back';
  const subtitle =
    tab === 'login'
      ? language === 'ar'
        ? 'سجّل دخولك للوصول إلى حسابك والطلبات.'
        : 'Sign in to access your account and orders.'
      : language === 'ar'
        ? 'أنشئ حساباً جديداً في خطوات بسيطة.'
        : 'Create a new account in a few simple steps.';

  const registerFallback =
    language === 'ar' ? 'جاري تحميل نموذج التسجيل…' : 'Loading registration form…';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        animation="reduced"
        closeButtonClassName="text-zinc-400 hover:bg-white/10 hover:text-white opacity-90 ring-offset-zinc-950"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          'flex h-[min(92dvh,820px)] max-h-[min(92dvh,820px)] w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden border-0 p-0',
          'bg-zinc-950 text-zinc-50 shadow-xl sm:rounded-2xl',
          'ring-1 ring-white/10',
          'contain-layout',
          tab === 'register'
            ? 'max-w-[min(100%,700px)] sm:max-w-[740px]'
            : 'max-w-[min(100%,480px)] sm:max-w-[500px]',
        )}
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ar' : 'en'}
      >
        <div className="relative shrink-0 border-b border-zinc-800/80 bg-zinc-950 px-6 pb-5 pt-7">
          <div
            className={cn(
              'relative mx-auto flex w-full flex-col items-center gap-3.5',
              tab === 'register' ? 'max-w-xl' : 'max-w-sm',
            )}
          >
            <div className="flex h-[4.5rem] items-center justify-center">
              <img
                src={LOGO_URL}
                alt={language === 'ar' ? 'الشعار' : 'Logo'}
                className="h-14 w-auto max-w-[min(90%,240px)] object-contain sm:h-16"
                decoding="async"
                fetchPriority="low"
                width={240}
                height={64}
              />
            </div>
            <DialogHeader className="w-full space-y-1.5 text-center sm:text-center">
              <DialogTitle className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-[1.35rem]">
                {title}
              </DialogTitle>
              <DialogDescription className="text-pretty text-sm leading-relaxed text-zinc-400">
                {subtitle}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950 px-5 pb-4 pt-4 sm:px-6">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as 'login' | 'register')}
            className="flex min-h-0 flex-1 flex-col gap-4"
          >
            <TabsList className="grid h-auto w-full shrink-0 grid-cols-2 gap-0.5 rounded-full border border-zinc-800/90 bg-zinc-900/80 p-1">
              <TabsTrigger
                value="login"
                className={cn(
                  'flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors',
                  'text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm',
                  'data-[state=inactive]:hover:text-zinc-300',
                )}
              >
                <LogIn className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</span>
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className={cn(
                  'flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors',
                  'text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm',
                  'data-[state=inactive]:hover:text-zinc-300',
                )}
              >
                <UserPlus className="h-4 w-4 shrink-0 opacity-85" aria-hidden />
                <span>{language === 'ar' ? 'إنشاء حساب' : 'Register'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="login"
              className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-0 data-[state=inactive]:hidden"
            >
              <form
                onSubmit={onLoginSubmit}
                className="space-y-4 rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 sm:p-5"
              >
                <LoginField
                  id="auth-dialog-user"
                  label={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                  icon={AtSign}
                >
                  <Input
                    ref={loginUserRef}
                    id="auth-dialog-user"
                    autoComplete="username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    onKeyDown={(e) => focusNextOnTabOrEnter(e, loginPasswordRef)}
                    enterKeyHint="next"
                    dir="ltr"
                    className={loginInputClass}
                    placeholder={language === 'ar' ? 'أدخل اسم المستخدم' : 'Your username'}
                  />
                </LoginField>

                <LoginField
                  id="auth-dialog-pass"
                  label={language === 'ar' ? 'كلمة المرور' : 'Password'}
                  icon={Lock}
                >
                  <Input
                    ref={loginPasswordRef}
                    id="auth-dialog-pass"
                    type="password"
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    enterKeyHint="done"
                    dir="ltr"
                    className={loginInputClass}
                    placeholder="••••••••"
                  />
                </LoginField>

                <Button
                  type="submit"
                  className="btn-primary mt-1 h-11 w-full gap-2 text-base font-semibold"
                  disabled={loginBusy}
                >
                  <LogIn className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {loginBusy ? '…' : language === 'ar' ? 'دخول' : 'Sign in'}
                </Button>

                <p className="flex items-start gap-2 border-t border-zinc-800/80 pt-3 text-start text-[0.7rem] leading-relaxed text-zinc-500">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
                  {language === 'ar'
                    ? 'ليس لديك حساب؟ انتقل إلى تبويب «إنشاء حساب» أعلاه.'
                    : 'No account yet? Switch to the Register tab above.'}
                </p>
              </form>
            </TabsContent>

            {tab === 'register' ? (
              <TabsContent
                value="register"
                className="mt-0 flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-0"
              >
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-2 [content-visibility:auto]">
                  <Suspense
                    fallback={
                      <p className="py-10 text-center text-sm text-zinc-500" role="status">
                        {registerFallback}
                      </p>
                    }
                  >
                    <CustomerAuthWizard
                      key={registerKey}
                      language={language}
                      showIntro
                      embedded
                      darkPanel
                      hideSubmit
                      formId={CUSTOMER_REGISTER_FORM_ID}
                      onRegistered={goAddressesAfterRegister}
                    />
                  </Suspense>
                </div>
                <div className="shrink-0 border-t border-zinc-800/90 bg-zinc-950 px-1 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <Button
                    type="submit"
                    form={CUSTOMER_REGISTER_FORM_ID}
                    className="btn-primary h-11 w-full gap-2 text-base font-semibold"
                  >
                    <UserPlus className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    {language === 'ar' ? 'إنشاء الحساب' : 'Create account'}
                  </Button>
                </div>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerAuthDialog;
