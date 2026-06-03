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
  'customer-auth-portal__input h-12 rounded-xl border-[#c9a99a]/55 bg-[#031a20]/90 text-[#f5ebe6] shadow-none placeholder:text-[#8fa8ad] focus-visible:border-[#d2b4a9] focus-visible:ring-[#d2b4a9]/35';

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
        closeButtonClassName="text-[#e8d5cc] hover:bg-white/10 hover:text-white opacity-90 ring-offset-[#05242c]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          'customer-auth-portal flex max-h-[min(92dvh,820px)] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl',
          mode === 'register'
            ? 'max-w-[min(100%,700px)] sm:max-w-[740px]'
            : 'max-w-[min(100%,420px)] sm:max-w-[440px]',
        )}
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={isRtl ? 'ar' : 'en'}
      >
        {mode === 'login' ? (
          <div className="customer-auth-portal__login flex flex-col px-7 pb-8 pt-10 sm:px-9 sm:pb-10 sm:pt-11">
            <div className="mx-auto mb-6 flex flex-col items-center text-center">
              <img
                src={LOGO_URL}
                alt="BIOSKIN"
                className="customer-auth-portal__logo mb-4 h-16 w-auto max-w-[200px] object-contain opacity-90 sm:h-[4.25rem]"
                decoding="async"
              />
              <DialogHeader className="space-y-0 text-center">
                <DialogTitle className="customer-auth-portal__heading text-2xl font-semibold tracking-wide text-[#e8d5cc] sm:text-[1.65rem]">
                  {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {language === 'ar'
                    ? 'أدخل اسم المستخدم وكلمة المرور'
                    : 'Enter your username and password'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={onLoginSubmit} className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="auth-dialog-user"
                  className="block text-start text-sm font-bold text-white"
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
                  className="block text-start text-sm font-bold text-white"
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
                className="customer-auth-portal__submit mt-1 h-12 w-full rounded-xl border-0 text-base font-semibold shadow-none"
                disabled={loginBusy}
              >
                {loginBusy ? '…' : language === 'ar' ? 'تسجيل الدخول' : 'Login'}
              </Button>
            </form>

            <button
              type="button"
              className="customer-auth-portal__switch mt-6 w-full text-center text-sm font-medium text-white transition-colors hover:text-[#e8d5cc]"
              onClick={() => setMode('register')}
            >
              {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}
            </button>

            <Link
              to="/contact"
              className="customer-auth-portal__forgot mt-4 text-center text-xs text-[#8fa8ad] transition-colors hover:text-[#c9a99a]"
              onClick={() => onOpenChange(false)}
            >
              {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot your password?'}
            </Link>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="customer-auth-portal__register-head shrink-0 border-b border-[#0d3a44] px-6 pb-4 pt-9 text-center sm:px-8">
              <img
                src={LOGO_URL}
                alt="BIOSKIN"
                className="customer-auth-portal__logo mx-auto mb-3 h-14 w-auto max-w-[180px] object-contain opacity-90"
                decoding="async"
              />
              <h2 className="text-xl font-semibold tracking-wide text-[#e8d5cc]">
                {language === 'ar' ? 'إنشاء حساب' : 'Create account'}
              </h2>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-white transition-colors hover:text-[#e8d5cc]"
                onClick={() => setMode('login')}
              >
                {language === 'ar' ? 'لديك حساب بالفعل؟ سجّل الدخول' : 'Already have an account? Login'}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              <Suspense
                fallback={
                  <p className="py-10 text-center text-sm text-[#8fa8ad]" role="status">
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

            <div className="shrink-0 border-t border-[#0d3a44] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
              <Button
                type="submit"
                form={CUSTOMER_REGISTER_FORM_ID}
                className="customer-auth-portal__submit h-12 w-full gap-2 rounded-xl border-0 text-base font-semibold shadow-none"
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
