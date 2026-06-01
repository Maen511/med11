import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { focusNextOnTabOrEnter } from '@/lib/authFieldFocus';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getAdminUsername } from '@/lib/adminAuth';
import { toast } from 'sonner';
import CustomerAuthWizard from '@/components/CustomerAuthWizard';
import { LOGO_URL } from '@/lib/branding';
import { AtSign, Lock, LogIn, Shield, Sparkles, UserPlus } from 'lucide-react';

function PageField({
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
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        {children}
      </div>
    </div>
  );
}

const Login = () => {
  const { language, setLanguage } = useLanguage();
  const { isLoggedIn, isAdmin, adminLogin, loginCustomer } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>('login');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminBusy, setAdminBusy] = useState(false);

  const isRtl = language === 'ar';
  const adminUsernameHint = getAdminUsername();

  useEffect(() => {
    if (!isLoggedIn) return;
    if (isAdmin) {
      navigate('/admin', { replace: true });
      return;
    }
    try {
      if (sessionStorage.getItem('med-just-registered') === '1') {
        sessionStorage.removeItem('med-just-registered');
        navigate('/addresses', { replace: true });
        return;
      }
    } catch {
      /* ignore */
    }
    navigate('/profile', { replace: true });
  }, [isLoggedIn, isAdmin, navigate]);

  const onCustomerLogin = async (e: FormEvent) => {
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
        navigate('/admin', { replace: true });
        return;
      }

      const ok = loginCustomer(u, loginPassword);
      if (ok) {
        toast.success(language === 'ar' ? 'تم تسجيل الدخول' : 'Signed in');
        setLoginUsername('');
        setLoginPassword('');
        navigate('/profile', { replace: true });
      } else {
        toast.error(
          language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة.' : 'Incorrect username or password.',
        );
      }
    } finally {
      setLoginBusy(false);
    }
  };

  const onAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!adminIdentifier.trim() || !adminPassword) {
      toast.error(language === 'ar' ? 'أدخل اسم المستخدم وكلمة المرور' : 'Enter username and password.');
      return;
    }
    setAdminBusy(true);
    try {
      if (adminLogin(adminIdentifier.trim(), adminPassword)) {
        toast.success(language === 'ar' ? 'دخول مسؤول' : 'Admin signed in');
        navigate('/admin', { replace: true });
      } else {
        toast.error(language === 'ar' ? 'بيانات الأدمن غير صحيحة' : 'Invalid admin credentials');
      }
    } finally {
      setAdminBusy(false);
    }
  };

  const pageInputClass = 'h-11 border-border/80 bg-background ps-10 text-start shadow-sm';

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'} lang={isRtl ? 'ar' : 'en'}>
      <Header language={language} onLanguageChange={setLanguage} />
      <div className="container mx-auto max-w-lg px-4 pb-20 pt-28">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border/60 bg-gradient-to-b from-muted/50 to-card px-6 py-8 text-center">
            <img
              src={LOGO_URL}
              alt={language === 'ar' ? 'الشعار' : 'Logo'}
              className="mx-auto mb-4 h-14 w-auto max-w-[200px] object-contain"
              decoding="async"
            />
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {language === 'ar' ? 'الحساب' : 'Account'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {language === 'ar'
                ? 'سجّل الدخول أو أنشئ حساباً جديداً.'
                : 'Sign in or create a new account.'}
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register' | 'admin')} className="w-full">
              <TabsList className="mb-5 grid h-auto w-full grid-cols-3 gap-0.5 rounded-full border border-border/80 bg-muted/50 p-1">
                <TabsTrigger value="login" className="gap-1.5 rounded-full py-2.5 text-xs sm:text-sm">
                  <LogIn className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
                  {language === 'ar' ? 'دخول' : 'Sign in'}
                </TabsTrigger>
                <TabsTrigger value="register" className="gap-1.5 rounded-full py-2.5 text-xs sm:text-sm">
                  <UserPlus className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
                  {language === 'ar' ? 'تسجيل' : 'Register'}
                </TabsTrigger>
                <TabsTrigger value="admin" className="gap-1.5 rounded-full py-2.5 text-xs sm:text-sm">
                  <Shield className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
                  {language === 'ar' ? 'مسؤول' : 'Admin'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0 space-y-4 outline-none data-[state=inactive]:hidden">
                <form onSubmit={onCustomerLogin} className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5">
                  <PageField
                    id="page-login-user"
                    label={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                    icon={AtSign}
                  >
                    <Input
                      id="page-login-user"
                      autoComplete="username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      onKeyDown={(e) => focusNextOnTabOrEnter(e, loginPasswordRef)}
                      enterKeyHint="next"
                      dir="ltr"
                      className={pageInputClass}
                      placeholder={language === 'ar' ? 'مثال: ahmed' : 'e.g. ahmed'}
                    />
                  </PageField>
                  <PageField
                    id="page-login-pass"
                    label={language === 'ar' ? 'كلمة المرور' : 'Password'}
                    icon={Lock}
                  >
                    <Input
                      ref={loginPasswordRef}
                      id="page-login-pass"
                      type="password"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      enterKeyHint="done"
                      dir="ltr"
                      className={pageInputClass}
                      placeholder="••••••••"
                    />
                  </PageField>
                  <Button type="submit" className="btn-primary h-11 w-full gap-2 font-semibold" disabled={loginBusy}>
                    <LogIn className="h-4 w-4 shrink-0" aria-hidden />
                    {loginBusy ? '…' : language === 'ar' ? 'دخول' : 'Sign in'}
                  </Button>
                  <p className="flex items-start gap-2 border-t border-border/60 pt-3 text-xs leading-relaxed text-muted-foreground">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {language === 'ar'
                      ? `للمسؤول: ${adminUsernameHint} وكلمة المرور 111.`
                      : `Admin: ${adminUsernameHint} / password 111.`}
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0 outline-none data-[state=inactive]:hidden">
                <CustomerAuthWizard
                  language={language}
                  showIntro
                  embedded
                  onRegistered={() => {
                    try {
                      sessionStorage.setItem('med-just-registered', '1');
                    } catch {
                      /* ignore */
                    }
                    navigate('/addresses', { replace: true });
                  }}
                />
              </TabsContent>

              <TabsContent value="admin" className="mt-0 space-y-4 outline-none data-[state=inactive]:hidden">
                <div className="flex gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <div className="text-start">
                    <p className="font-medium text-foreground">
                      {language === 'ar' ? 'دخول لوحة التحكم' : 'Control panel sign-in'}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {language === 'ar'
                        ? `المستخدم: ${adminUsernameHint} · كلمة المرور: 111`
                        : `Username: ${adminUsernameHint} · Password: 111`}
                    </p>
                  </div>
                </div>
                <form
                  onSubmit={onAdminSubmit}
                  className="space-y-4 rounded-xl border border-dashed border-primary/30 bg-muted/20 p-4 sm:p-5"
                >
                  <PageField
                    id="admin-user"
                    label={language === 'ar' ? 'اسم المستخدم' : 'Username'}
                    icon={AtSign}
                  >
                    <Input
                      id="admin-user"
                      autoComplete="username"
                      placeholder={adminUsernameHint}
                      value={adminIdentifier}
                      onChange={(e) => setAdminIdentifier(e.target.value)}
                      dir="ltr"
                      className={pageInputClass}
                    />
                  </PageField>
                  <PageField
                    id="admin-pass"
                    label={language === 'ar' ? 'كلمة المرور' : 'Password'}
                    icon={Lock}
                  >
                    <Input
                      id="admin-pass"
                      type="password"
                      autoComplete="current-password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      dir="ltr"
                      className={pageInputClass}
                    />
                  </PageField>
                  <Button type="submit" className="btn-primary h-11 w-full gap-2 font-semibold" disabled={adminBusy}>
                    <Shield className="h-4 w-4 shrink-0" aria-hidden />
                    {adminBusy ? '…' : language === 'ar' ? 'دخول لوحة التحكم' : 'Open dashboard'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            {language === 'ar' ? 'العودة للرئيسية' : 'Back to home'}
          </Link>
        </p>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
