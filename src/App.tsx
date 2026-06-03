import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import SplashScreen from "@/components/SplashScreen";
import PageLoadingFallback from "@/components/PageLoadingFallback";
import CatalogPromoCorner from "@/components/CatalogPromoCorner";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getCatalogSections, saveCatalogSections, recordPageView } from "@/lib/catalog";
import { applyBioskinCatalog2026 } from "@/lib/bioskinCatalogImport";
import { migrateCatalogImagesToIndexedDB } from "@/lib/catalogImages";
import { CATALOG_CHANGED_EVENT } from "@/lib/catalogEvents";
import { syncFullAccessSectionGrants } from "@/lib/customerAccounts";
import { RequireAuth, RequireCatalogAccess, RequireCustomerAccount } from "@/components/RequireAuth";
import AccountHubLayout from "@/layouts/AccountHubLayout";

const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ProductCategory = lazy(() => import("./pages/ProductCategory"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Login = lazy(() => import("./pages/Login"));
const Orders = lazy(() => import("./pages/Orders"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Reservations = lazy(() => import("./pages/Reservations"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const isProductCategoryListingPath = (path: string | null): path is string => {
  if (!path || !path.startsWith("/products/")) return false;
  const rest = path.slice("/products/".length);
  return rest.length > 0 && !rest.includes("/");
};

const ACCOUNT_HUB_PATHS = new Set(["/profile", "/settings", "/orders", "/wishlist", "/addresses"]);
const isAccountHubPath = (path: string | null): boolean =>
  Boolean(path && ACCOUNT_HUB_PATHS.has(path));

const SPLASH_SEEN_KEY = 'med-splash-seen';

const RoutesWithSplash = () => {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const prevPathRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const next = location.pathname;
    const prev = prevPathRef.current;
    prevPathRef.current = next;

    let splashAlreadySeen = false;
    try {
      splashAlreadySeen = sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
    } catch {
      /* ignore */
    }

    if (splashAlreadySeen) {
      setShowSplash(false);
      return;
    }

    // Moving between category pages (e.g. packages ↔ new-arrivals): no splash
    if (isProductCategoryListingPath(prev) && isProductCategoryListingPath(next)) {
      setShowSplash(false);
      return;
    }

    // Profile ↔ orders ↔ wishlist ↔ addresses: no splash (same shell)
    if (isAccountHubPath(prev) && isAccountHubPath(next)) {
      setShowSplash(false);
      return;
    }

    setShowSplash(true);
    const timer = window.setTimeout(() => {
      setShowSplash(false);
      try {
        sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      } catch {
        /* ignore */
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  // After splash hides, force scroll to very top (especially on mobile first load/refresh)
  useEffect(() => {
    if (!showSplash && location.pathname === '/') {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch {
        window.scrollTo(0, 0);
      }
    }
  }, [showSplash, location.pathname]);

  // Force scroll to top on route change to avoid mobile refresh restoring scroll
  useEffect(() => {
    // Use instant jump on navigation; fallback to top for browsers not supporting behavior
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Record page views after navigation settles (debounced)
  const pageViewTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (pageViewTimerRef.current) clearTimeout(pageViewTimerRef.current);
    pageViewTimerRef.current = window.setTimeout(() => {
      try {
        recordPageView(location.pathname);
      } catch {}
    }, 800);
    return () => {
      if (pageViewTimerRef.current) clearTimeout(pageViewTimerRef.current);
    };
  }, [location.pathname]);

  return (
    <>
      {showSplash && <SplashScreen />}
      <Suspense fallback={<PageLoadingFallback />}>
        {!showSplash ? <CatalogPromoCorner /> : null}
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/checkout"
            element={
              <RequireCatalogAccess>
                <Checkout />
              </RequireCatalogAccess>
            }
          />
          <Route
            path="/products/:categoryId"
            element={
              <RequireCatalogAccess>
                <ProductCategory />
              </RequireCatalogAccess>
            }
          />
          <Route
            path="/product/:id"
            element={
              <RequireCatalogAccess>
                <ProductDetail />
              </RequireCatalogAccess>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AccountHubLayout />
              </RequireAuth>
            }
          >
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/settings"
              element={
                <RequireCustomerAccount>
                  <AccountSettings />
                </RequireCustomerAccount>
              }
            />
            <Route
              path="/orders"
              element={
                <RequireCustomerAccount>
                  <RequireCatalogAccess>
                    <Orders />
                  </RequireCatalogAccess>
                </RequireCustomerAccount>
              }
            />
            <Route
              path="/addresses"
              element={
                <RequireCustomerAccount>
                  <Addresses />
                </RequireCustomerAccount>
              }
            />
            <Route
              path="/wishlist"
              element={
                <RequireCustomerAccount>
                  <RequireCatalogAccess>
                    <Wishlist />
                  </RequireCatalogAccess>
                </RequireCustomerAccount>
              }
            />
          </Route>
          <Route
            path="/reservations"
            element={
              <RequireCatalogAccess>
                <Reservations />
              </RequireCatalogAccess>
            }
          />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
};

const STOCK_NORMALIZED_KEY = 'med-catalog-stock-normalized-v1';

const App = () => {
  // Bioskin import + IDB migration — deferred so first paint stays responsive
  useEffect(() => {
    const run = async () => {
      try {
        applyBioskinCatalog2026();
        await migrateCatalogImagesToIndexedDB();
      } catch {}
    };
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => {
        void run();
      }, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(() => {
      void run();
    }, 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onCatalogChanged = () => syncFullAccessSectionGrants();
    window.addEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged);
    return () => window.removeEventListener(CATALOG_CHANGED_EVENT, onCatalogChanged);
  }, []);

  // One-time stock normalization (was running on every mount)
  useEffect(() => {
    try {
      if (localStorage.getItem(STOCK_NORMALIZED_KEY) === '1') return;
      const sections = getCatalogSections();
      let changed = false;
      sections.forEach((sec) => {
        sec.products = sec.products.map((p) => {
          const stockDefined = typeof p.stockCount === 'number';
          const nextStock = stockDefined ? p.stockCount! : 20;
          const nextInStock = nextStock > 0;
          if (!stockDefined || p.inStock !== nextInStock) {
            changed = true;
            return { ...p, stockCount: nextStock, inStock: nextInStock };
          }
          return p;
        });
      });
      if (changed) saveCatalogSections(sections);
      localStorage.setItem(STOCK_NORMALIZED_KEY, '1');
    } catch {}
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Sonner />
          <BrowserRouter>
            <RoutesWithSplash />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
