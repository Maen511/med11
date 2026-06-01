import { motion } from 'framer-motion';
import { LOGO_URL } from '@/lib/branding';

const SplashScreen = () => {
  /* `dark` on root forces dark theme tokens (same as dark mode) even when the app is in light mode */
  return (
    <div className="dark fixed inset-0 z-[9999] flex items-center justify-center bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient( circle at 50% 45%, rgba(255,255,255,0.22), rgba(255,255,255,0.06) 45%, rgba(0,0,0,0) 70% )',
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-6 rounded-full"
            style={{
              background: 'radial-gradient(closest-side, rgba(255,215,128,0.28), rgba(255,215,128,0) 70%)',
              filter: 'blur(16px)',
            }}
          />
          <img
            src={LOGO_URL}
            alt="Logo"
            className="w-72 md:w-[28rem] lg:w-[34rem] h-auto animate-pulse"
          />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;


