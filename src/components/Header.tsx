import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Menu, X, Sun, Moon, User, LogOut, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cart from '@/components/Cart';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LOGO_URL } from '@/lib/branding';
import { notifyCatalogAccessPending } from '@/lib/catalogAccessToast';
import CustomerAuthDialog from '@/components/CustomerAuthDialog';
import { WishlistAlertsBell } from '@/components/WishlistAlertsBell';
import { storeProductsPath } from '@/lib/storeNav';

interface HeaderProps {
  language: 'en' | 'ar';
  onLanguageChange: (lang: 'en' | 'ar') => void;
  isStatic?: boolean;
}

function firstNameFromUser(user: { name?: string; username?: string } | null | undefined): string {
  const raw = (user?.name || user?.username || '').trim();
  if (!raw) return '';
  return raw.split(/\s+/)[0] ?? raw;
}

const Header = ({ language, onLanguageChange, isStatic = false }: HeaderProps) => {
  const THEME_KEY = 'med-theme';
  const LEGACY_THEME_KEY = 'derma-theme';
  const THEME_EVENT = 'med-apply-theme';
  const { setLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [accountAuthOpen, setAccountAuthOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuTop, setMobileMenuTop] = useState(0);
  const scrollRafRef = useRef(0);
  const isScrolledRef = useRef(false);
  const headerShellRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, canAccessCatalog, hasPendingCatalogCode, grantedSectionIds, logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const st = location.state as { openAuth?: boolean } | null;
    if (st?.openAuth) {
      setAccountAuthOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    toast.success(language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
    setAccountAuthOpen(true);
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  };

  const [theme, setTheme] = useState<'light'|'dark'|'system'>(() => {
    const saved = (localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY)) as 'light' | 'dark' | 'system' | null;
    return saved || 'system';
  });
  const categoriesHref = storeProductsPath(grantedSectionIds, {
    isAdmin,
    catalogUnlocked: canAccessCatalog,
  });

  const cycleTheme = () => {
    const order: Array<'light'|'dark'|'system'> = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
      localStorage.removeItem(LEGACY_THEME_KEY);
      window.dispatchEvent(new Event(THEME_EVENT));
    } catch {}
  };

  useEffect(() => {
    const onScroll = () => {
      if (scrollRafRef.current) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = 0;
        const next = window.scrollY > 8;
        if (next !== isScrolledRef.current) {
          isScrolledRef.current = next;
          setIsScrolled(next);
        }
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  const isTopTransparent = !isStatic && !isScrolled && location.pathname === '/';
  const headerSurfaceSolid = !isTopTransparent || isMobileMenuOpen;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const updateMenuTop = () => {
      const el = headerShellRef.current;
      if (!el) return;
      setMobileMenuTop(el.getBoundingClientRect().bottom + 8);
    };
    updateMenuTop();
    window.addEventListener('resize', updateMenuTop);
    return () => window.removeEventListener('resize', updateMenuTop);
  }, [isMobileMenuOpen]);

  const accountButtonClass = headerSurfaceSolid
    ? 'h-8 px-2 text-white hover:text-white/85 hover:bg-white/20 md:px-2.5'
    : 'h-8 px-2 text-white hover:text-white/80 hover:bg-white/10 md:px-2.5';

  const accountGuestLabel = language === 'en' ? 'Account' : 'الحساب';
  const accountLoggedInLabel = firstNameFromUser(user) || accountGuestLabel;

  useEffect(() => {
    const readTheme = () => {
      const saved = (localStorage.getItem(THEME_KEY) || localStorage.getItem(LEGACY_THEME_KEY)) as 'light' | 'dark' | 'system' | null;
      setTheme(saved || 'system');
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY || e.key === LEGACY_THEME_KEY) readTheme();
    };
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onSystemChange = () => readTheme();
    window.addEventListener(THEME_EVENT, readTheme as EventListener);
    window.addEventListener('storage', onStorage);
    media.addEventListener?.('change', onSystemChange);
    return () => {
      window.removeEventListener(THEME_EVENT, readTheme as EventListener);
      window.removeEventListener('storage', onStorage);
      media.removeEventListener?.('change', onSystemChange);
    };
  }, []);

  return (
    <motion.header
      className={`${isStatic ? 'relative w-full' : 'fixed inset-x-0 top-0 z-50 w-full'} transition-all duration-300 ${
        headerSurfaceSolid ? 'bg-black/75 backdrop-blur-md border-b border-white/15 shadow-md' : 'bg-transparent border-transparent shadow-none'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      dir="ltr"
    >
      <div ref={headerShellRef} className="w-full box-border px-3 sm:px-4 md:px-5 lg:px-6 py-0.5 md:py-1">
        {/* Grid: equal side columns so nav sits in true horizontal center of the bar (md+). Mobile: logo | actions. */}
        <div
          className="grid w-full grid-cols-[1fr_auto] items-center gap-x-2 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-3"
          dir="ltr"
          style={{ direction: 'ltr' }}
        >
          {/* Brand logo — far left */}
          <Link to="/" className="flex min-w-0 shrink-0 items-center justify-self-start ps-0" onClick={(e) => { if (location.pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
            <motion.div
              className={`flex items-center text-xl font-bold ${isTopTransparent ? 'text-white' : 'text-white'}`}
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src={LOGO_URL}
                alt="Logo"
                className="h-12 sm:h-[3.25rem] md:h-16 lg:h-[4.25rem] w-auto max-w-[118px] sm:max-w-[140px] md:max-w-[175px] lg:max-w-[210px] object-contain object-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.22)]"
                loading="eager"
                decoding="async"
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation — centered in the middle column of the grid */}
          <nav
            className="hidden min-w-0 flex-row items-center justify-center justify-self-center gap-x-4 text-sm font-medium lg:flex lg:gap-x-6 lg:text-[0.95rem]"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            lang={language === 'ar' ? 'ar' : 'en'}
          >
            {/* Home */}
            <motion.div
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Link
                to="/"
                className={`transition-colors relative ${isTopTransparent ? 'text-white hover:text-white/85' : 'text-white hover:text-white/80'}`}
              >
                {language === 'en' ? 'Home' : 'الرئيسية'}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-primary origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                />
              </Link>
            </motion.div>

            {canAccessCatalog && (
              <motion.div
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link
                  to={categoriesHref}
                  className={`inline-flex items-center transition-colors ${isTopTransparent ? 'text-white hover:text-white/85' : 'text-white hover:text-white/80'}`}
                >
                  <span className="relative py-1">
                    {language === 'en' ? 'Store' : 'المتجر'}
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 origin-left bg-primary"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: '100%' }}
                    />
                  </span>
                </Link>
              </motion.div>
            )}

            {/* About */}
            <motion.div
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Link
                to="/about"
                className={`transition-colors relative ${isTopTransparent ? 'text-white hover:text-white/85' : 'text-white hover:text-white/80'}`}
              >
                {language === 'en' ? 'About Us' : 'من نحن'}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-primary origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                />
              </Link>
            </motion.div>

            {/* Contact */}
            <motion.div
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/contact"
                className={`transition-colors relative ${isTopTransparent ? 'text-white hover:text-white/85' : 'text-white hover:text-white/80'}`}
              >
                {language === 'en' ? 'Contact' : 'اتصل بنا'}
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 bg-primary origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                />
              </Link>
            </motion.div>
          </nav>

          {/* Utilities: far right */}
          <div className="flex min-w-0 shrink-0 flex-row items-center justify-end justify-self-end gap-0.5 sm:gap-1 md:gap-1.5 text-xs md:text-sm" dir="ltr" style={{ direction: 'ltr' }}>
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={cycleTheme}
              className={isTopTransparent ? 'h-8 px-1.5 md:px-2 text-white hover:text-white/85 hover:bg-white/20' : 'h-8 px-1.5 md:px-2 text-white hover:text-white/80 hover:bg-white/10'}
              aria-label={language === 'en' ? 'Toggle theme' : 'تبديل النمط'}
              title={theme}
            >
              {theme === 'dark' ? (
                <Moon className="w-4 h-4" />
              ) : theme === 'light' ? (
                <Sun className="w-4 h-4" />
              ) : (
                // system icon: combine sun/moon subtly
                <span className="relative inline-flex w-4 h-4 items-center justify-center">
                  <Sun className="w-3.5 h-3.5 opacity-80" />
                  <Moon className="w-2.5 h-2.5 absolute -right-0.5 -bottom-0.5 opacity-80" />
                </span>
              )}
            </Button>
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { const next = language === 'en' ? 'ar' : 'en'; onLanguageChange(next); setLanguage(next); }}
              className={isTopTransparent ? 'h-8 px-2 text-white hover:text-white/85 hover:bg-white/20' : 'h-8 px-2 text-white hover:text-white/80 hover:bg-white/10'}
              aria-label={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
            >
              <Globe className="h-4 w-4" />
            </Button>

            {canAccessCatalog ? (
              <WishlistAlertsBell language={language} buttonClassName={accountButtonClass} />
            ) : null}

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={accountButtonClass}
                    aria-label={
                      language === 'en'
                        ? `Account menu, ${accountLoggedInLabel}`
                        : `قائمة ${accountLoggedInLabel}`
                    }
                  >
                    <User className="h-4 w-4 md:me-1" />
                    <span className="hidden max-w-[8rem] truncate md:inline">{accountLoggedInLabel}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {user?.name ? (
                    <>
                      <DropdownMenuLabel className="font-normal">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        {user.username ? (
                          <p className="truncate text-xs text-muted-foreground">{user.username}</p>
                        ) : null}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuItem
                    onClick={() => navigate('/profile')}
                    className="cursor-pointer gap-2"
                  >
                    <User className="h-4 w-4 opacity-70" />
                    {isAdmin
                      ? language === 'en'
                        ? 'My profile'
                        : 'ملفي الشخصي'
                      : hasPendingCatalogCode
                        ? language === 'en'
                          ? 'Catalog access status'
                          : 'حالة وصول الكتالوج'
                        : language === 'en'
                          ? 'My profile'
                          : 'ملفي الشخصي'}
                  </DropdownMenuItem>
                  {isAdmin ? (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="cursor-pointer gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4 opacity-70" />
                      {language === 'en' ? 'Admin dashboard' : 'لوحة التحكم'}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {language === 'en' ? 'Log out' : 'تسجيل الخروج'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAccountAuthOpen(true)}
                className={accountButtonClass}
                aria-label={language === 'en' ? 'Sign in' : 'تسجيل الدخول'}
                title={language === 'en' ? 'Sign in' : 'تسجيل الدخول'}
              >
                <User className="h-4 w-4 md:me-1" />
                <span className="hidden md:inline">{language === 'en' ? 'Account' : 'الحساب'}</span>
              </Button>
            )}

            {/* السلة بعد تفعيل الكتالوج على كل الصفحات (الملف، الطلبات، إلخ) */}
            {canAccessCatalog ? <Cart language={language} /> : null}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 lg:hidden ${headerSurfaceSolid ? 'text-white hover:text-white/85 hover:bg-white/20' : 'text-white hover:text-white/80 hover:bg-white/10'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

      </div>

      {/* Mobile drawer — fixed overlay (does not stretch header / break hero layout) */}
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[55] bg-black/55 lg:hidden"
              aria-label={language === 'en' ? 'Close menu' : 'إغلاق القائمة'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              className="fixed inset-x-3 z-[56] mx-auto max-h-[min(70vh,24rem)] max-w-md overflow-y-auto rounded-xl border border-border bg-background p-3 shadow-2xl lg:hidden"
              style={{ top: mobileMenuTop }}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
              lang={language === 'ar' ? 'ar' : 'en'}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex flex-col gap-1">
                <Link
                  to="/"
                  className="block rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (location.pathname === '/') {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  {language === 'en' ? 'Home' : 'الرئيسية'}
                </Link>

                {canAccessCatalog ? (
                  <Link
                    to={categoriesHref}
                    className="block rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {language === 'en' ? 'Store' : 'المتجر'}
                  </Link>
                ) : null}

                <Link
                  to="/about"
                  className="block rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {language === 'en' ? 'About Us' : 'من نحن'}
                </Link>

                <Link
                  to="/contact"
                  className="block rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {language === 'en' ? 'Contact' : 'اتصل بنا'}
                </Link>

                <div className="my-1 h-px bg-border" aria-hidden />

                {!isLoggedIn ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-start text-foreground transition-colors hover:bg-secondary hover:text-primary"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setAccountAuthOpen(true);
                    }}
                  >
                    <User className="h-4 w-4 shrink-0 opacity-70" />
                    {language === 'en' ? 'Sign in / Register' : 'تسجيل الدخول / إنشاء حساب'}
                  </button>
                ) : null}

                {canAccessCatalog ? (
                  <Link
                    to="/wishlist"
                    className="block rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {language === 'en' ? 'Wishlist' : 'المفضلة'}
                  </Link>
                ) : null}

                {canAccessCatalog && isLoggedIn ? (
                  <Link
                    to="/addresses"
                    className="block rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {language === 'en' ? 'Delivery Address' : 'عنوان التوصيل'}
                  </Link>
                ) : null}

                {isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      className="block rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {language === 'en' ? 'My profile' : 'ملفي الشخصي'}
                    </Link>
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-foreground transition-colors hover:bg-secondary hover:text-primary"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4 shrink-0 opacity-70" />
                        {language === 'en' ? 'Admin dashboard' : 'لوحة التحكم'}
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-start text-destructive transition-colors hover:bg-destructive/10"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      {language === 'en' ? 'Log out' : 'تسجيل الخروج'}
                    </button>
                  </>
                ) : null}
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
      {accountAuthOpen ? (
        <CustomerAuthDialog open onOpenChange={setAccountAuthOpen} language={language} />
      ) : null}
    </motion.header>
  );
};

export default Header;