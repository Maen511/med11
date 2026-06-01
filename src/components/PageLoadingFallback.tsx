import { Loader2 } from 'lucide-react';
import { LOGO_URL } from '@/lib/branding';

/** يظهر أثناء تحميل الصفحات المُحمَّلة بـ lazy() تحت شاشة الـ splash */
const PageLoadingFallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-6 bg-background/90 text-foreground backdrop-blur-md dark:bg-background/95"
  >
    <img src={LOGO_URL} alt="" className="h-16 w-auto opacity-90 animate-pulse md:h-20" />
    <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
    <span className="sr-only">Loading</span>
  </div>
);

export default PageLoadingFallback;
