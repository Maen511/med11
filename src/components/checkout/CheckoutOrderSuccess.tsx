import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  language: 'en' | 'ar';
  title: string;
  subtitle: string;
  continueLabel: string;
  onContinue: () => void;
  className?: string;
};

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const CheckoutOrderSuccess = ({
  language,
  title,
  subtitle,
  continueLabel,
  onContinue,
  className,
}: Props) => {
  const isRtl = language === 'ar';

  return (
    <motion.div
      className={cn(
        'relative w-full max-w-md rounded-3xl border border-emerald-500/20 bg-card px-8 py-10 text-center shadow-2xl shadow-emerald-500/10 sm:px-10 sm:py-12',
        className,
      )}
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={isRtl ? 'ar' : 'en'}
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1.15, opacity: 0 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          aria-hidden
        />
        <motion.span
          className="absolute inset-2 rounded-full bg-emerald-500/15"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.05 }}
          aria-hidden
        />
        <motion.span
          className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-lg shadow-emerald-600/40"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 16, delay: 0.08 }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.28, type: 'spring', stiffness: 400, damping: 14 }}
          >
            <Check className="h-14 w-14 text-white drop-shadow-sm" strokeWidth={2.75} aria-hidden />
          </motion.div>
        </motion.span>
      </div>

      <motion.h2
        className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35, ease }}
      >
        {title}
      </motion.h2>
      <motion.p
        className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground sm:text-base"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.35, ease }}
      >
        {subtitle}
      </motion.p>

      <motion.div
        className="mt-8"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36, duration: 0.35, ease }}
      >
        <Button type="button" className="btn-primary h-11 min-w-[12rem] text-base" onClick={onContinue}>
          {continueLabel}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default CheckoutOrderSuccess;
