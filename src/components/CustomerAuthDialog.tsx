import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { focusNextOnTabOrEnter } from '@/lib/authFieldFocus';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { CUSTOMER_REGISTER_FORM_ID } from '@/components/CustomerAuthWizard';
import { toast } from 'sonner';
import { LOGO_URL } from '@/lib/branding';
import { cn } from '@/lib/utils';
import { UserPlus } from 'lucide-react';

const CustomerAuthWizard = lazy(() => import('@/components/CustomerAuthWizard'));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'en' | 'ar';
};

const portalInputClass =
  'h-11 border-zinc-700/80 bg-zinc-900/80 text-zinc-50 shadow-sm placeholder:text-zinc-600 focus-visible:border-zinc-600 focus-visible:ring-zinc-600/40';

const CustomerAuthDialog = ({ open, onOpenChange, language }: Props) => {
  const navigate = useNavigate();
  const { loginCustomer, adminLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [registerKey, setRegisterKey] = useState(0);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const loginUserRef = useRef<HTMLInputElement>(null);
  const isRtl = language === 'ar';

  useEffect(() => {
    if (!open) {
      setMode('login');
      setLoginUsername('');
      setLoginPassword('');
      setLoginBusy(false);
      setRegisterKey((k) => k + 1);
    }
  }, [open]);

  useEffect(() => {
    if (!open || mode !== 'login') return;
    const id = window.requestAnimationFrame(() => {
      loginUserRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, mode]);

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

  const registerFallback =
    language === 'ar' ? 'جاري تحميل نموذج التسجيل…' : 'Loading registration form…';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        animation="reduced"
        closeButtonClassName="text-zinc-400 hover:bg-white/10 hover:text-white opacity-90 ring-offset-zinc-950"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          'flex max-h-[min(92dvh,820px)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden border-0 bg-zinc-950 p-0 text-zinc-50 shadow-xl ring-1 ring-white/10 sm:rounded-2xl',
          mode === 'register'
            ? 'max-w-[min(100%,700px)] sm:max-w-[740px]'
            : 'max-w-[min(100%,420px)] sm:max-w-[440px]',
        )}
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ar' : 'en'}
      >
        {mode === 'login' ? (
          <div className="flex flex-col px-7 pb-8 pt-10 sm:px-9 sm:pb-10 sm:pt-11">
            <div className="mx-auto mb-6 flex flex-col items-center text-center">
              <img
                src={LOGO_URL}
                alt="BIOSKIN"
                className="mb-4 h-16 w-auto max-w-[200px] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)] sm:h-[4.25rem]"
                decoding="async"
              />
              <DialogHeader className="space-y-0 text-center">
                <DialogTitle className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-[1.65rem]">
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {language === 'ar'
                    ? 'أدخل اسم المستخدم وكلمة المرور'
                    : 'Enter your username and password'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <form
              onSubmit={onLoginSubmit}
              className="flex flex-col gap-4 rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-4 sm:p-5"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="auth-dialog-user"
                  className="block text-start text-sm font-medium text-zinc-400"
                >
                  {language === 'ar' ? 'اسم المستخدم' : 'Username'}
                </Label>
                <Input
                  ref={loginUserRef}
                  id="auth-dialog-user"
                  autoComplete="username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  onKeyDown={(e) => focusNextOnTabOrEnter(e, loginPasswordRef)}
                  enterKeyHint="next"
                  dir="ltr"
                  className={portalInputClass}
                  placeholder={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="auth-dialog-pass"
                  className="block text-start text-sm font-medium text-zinc-400"
                >
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Label>
                <Input
                  ref={loginPasswordRef}
                  id="auth-dialog-pass"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  enterKeyHint="done"
                  dir="ltr"
                  className={portalInputClass}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="btn-primary mt-1 h-11 w-full text-base font-semibold"
                disabled={loginBusy}
              >
                {loginBusy ? '…' : language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Button>
            </form>

            <button
              type="button"
              className="mt-6 w-full text-center text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-50"
              onClick={() => setMode('register')}
            >
              {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
            </button>

            <Link
              to="/contact"
              className="mt-4 text-center text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              onClick={() => onOpenChange(false)}
            >
              {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
            </Link>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-zinc-800/80 bg-zinc-950 px-6 pb-4 pt-9 text-center sm:px-8">
              <img
                src={LOGO_URL}
                alt="BIOSKIN"
                className="mx-auto mb-3 h-14 w-auto max-w-[180px] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
                decoding="async"
              />
              <h2 className="text-xl font-semibold tracking-tight text-zinc-50">
                {language === 'ar' ? 'إنشاء حساب' : 'Create account'}
              </h2>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-zinc-300 transition-colors hover:text-zinc-50"
                onClick={() => setMode('login')}
              >
                {language === 'ar' ? 'لديك حساب بالفعل؟ سجّل الدخول' : 'Already have an account? Login'}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
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
                  showIntro={false}
                  embedded
                  darkPanel
                  hideSubmit
                  formId={CUSTOMER_REGISTER_FORM_ID}
                  onRegistered={goAddressesAfterRegister}
                />
              </Suspense>
            </div>

            <div className="shrink-0 border-t border-zinc-800/90 bg-zinc-950 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
              <Button
                type="submit"
                form={CUSTOMER_REGISTER_FORM_ID}
                className="btn-primary h-11 w-full gap-2 text-base font-semibold"
              >
                <UserPlus className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {language === 'ar' ? 'إنشاء الحساب' : 'Create account'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerAuthDialog;
