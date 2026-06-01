import { motion } from 'framer-motion';

/** خلفية سوداء بحركة خفيفة تغطي الشاشة (صفحات العلامة مثل من نحن / اتصل بنا) */
const BrandedPageAmbient = () => {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden>
      <motion.div
        className="absolute -left-[18%] -top-[28%] h-[90vmin] w-[78vmin] rounded-full bg-white/[0.065] blur-[85px]"
        animate={{ x: [0, 40, 0], y: [0, 26, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-[38%] -right-[14%] h-[82vmin] w-[68vmin] rounded-full bg-white/[0.055] blur-[85px]"
        animate={{ x: [0, -32, 0], y: [0, -22, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute left-[5%] top-[42%] h-[50vmin] w-[50vmin] rounded-full bg-white/[0.035] blur-[95px]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(105deg, transparent 32%, rgba(255,255,255,0.065) 50%, transparent 68%)',
          backgroundSize: '200% 100%',
          backgroundRepeat: 'no-repeat',
        }}
        initial={{ backgroundPosition: '120% 50%' }}
        animate={{ backgroundPosition: ['120% 50%', '-120% 50%'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear', repeatDelay: 0.4 }}
      />
    </div>
  );
};

export default BrandedPageAmbient;
