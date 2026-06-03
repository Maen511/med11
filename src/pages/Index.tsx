import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BlurText from '@/components/BlurText';
import ShinyText from '@/components/ShinyText';
import HomeHeroYoutube from '@/components/HomeHeroYoutube';
import { CheckCircle2 } from 'lucide-react';

const MOBILE_HOME_MQ = '(max-width: 639px)';

const Index = () => {
  const { language, setLanguage } = useLanguage();
  const [whyImageIndex, setWhyImageIndex] = useState(0);
  const [heroTextVisible, setHeroTextVisible] = useState(false);
  const [isMobileHome, setIsMobileHome] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_HOME_MQ).matches : false,
  );
  const heroTextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const heroVideoLabel =
    language === 'ar' ? 'فيديو خلفية العناية بالبشرة' : 'Skincare hero background video';

  const showHeroTextAfterDelay = () => {
    if (heroTextTimerRef.current) clearTimeout(heroTextTimerRef.current);
    setHeroTextVisible(false);
    heroTextTimerRef.current = setTimeout(() => {
      setHeroTextVisible(true);
    }, 4000);
  };

  useLayoutEffect(() => {
    // Ensure we start at the very top on initial mount (prevents initial offset on mobile)
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    showHeroTextAfterDelay();
    return () => {
      if (heroTextTimerRef.current) clearTimeout(heroTextTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_HOME_MQ);
    const sync = () => setIsMobileHome(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) setWhyImageIndex((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const whyPoints = {
    en: [
      'Advanced aesthetic formulas inspired by modern dermatology care standards.',
      'A complete range for hair, face, and body with targeted treatment options.',
      'Clear product information and practical usage guidance for confident choices.',
      'Structured shopping experience for registered customers with verified access.',
      'Multiple payment options, including online payment and cash on delivery.',
      'Well-organized categories that help you find the right product faster.',
      'Balanced formulations suitable for different skin types and daily routines.',
      'Benefit-focused product pages that make comparisons easier before purchase.',
      'Smooth order journey from discovery to checkout confirmation.',
      'A trusted brand presentation built on clarity, comfort, and confidence.',
    ],
    ar: [
      'تركيبات تجميلية متقدمة مستوحاة من معايير العناية الجلدية الحديثة.',
      'مجموعة متكاملة للشعر والوجه والجسم مع خيارات علاجية موجهة.',
      'معلومات واضحة لكل منتج مع إرشادات استخدام عملية لاتخاذ قرار واثق.',
      'تجربة تسوق منظمة للعملاء المسجلين بعد التحقق من الوصول.',
      'خيارات دفع متعددة تشمل الدفع الإلكتروني أو عند الاستلام.',
      'تصنيفات مرتبة تساعدك للوصول إلى المنتج المناسب بسرعة أكبر.',
      'تركيبات متوازنة تناسب أنواع بشرة مختلفة وروتين العناية اليومي.',
      'صفحات منتجات تركز على الفوائد لتسهيل المقارنة قبل الشراء.',
      'رحلة طلب سلسة من اكتشاف المنتج وحتى تأكيد عملية الدفع.',
      'هوية موثوقة مبنية على الوضوح والراحة وتعزيز الثقة.',
    ],
  } as const;

  const whyImages = [
    '/section-3-1.png',
    '/section-3-2.png',
    '/section-3-3.png',
  ];
  const easeScroll = [0.22, 1, 0.36, 1] as const;
  const viewportScroll = { once: true, amount: 0.2, margin: '-64px 0px' } as const;
  const viewportInstant = { once: true, amount: 0.01 } as const;

  const sectionReveal = isMobileHome
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 56 },
        whileInView: { opacity: 1, y: 0 },
        viewport: viewportScroll,
        transition: { duration: 0.85, ease: easeScroll },
      };

  return (
    <div
      className="flex w-full max-w-[100%] flex-col overflow-x-clip bg-background"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <Header language={language} onLanguageChange={setLanguage} />
      
      <motion.section
        className="relative w-full max-w-full shrink-0 overflow-hidden h-[min(72svh,34rem)] sm:h-[100svh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 sm:[mask-image:linear-gradient(to_bottom,black_0%,black_91%,transparent_100%)] sm:[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_91%,transparent_100%)]">
          <HomeHeroYoutube title={heroVideoLabel} />
        </div>
        {/* Bottom vignette — lighter on phone so no huge black band */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(to_top,rgba(0,0,0,0.35)_0%,transparent_55%)] sm:bg-[linear-gradient(to_top,rgba(0,0,0,0.52)_0%,rgba(0,0,0,0.38)_min(14%,12vh),rgba(0,0,0,0.2)_min(24%,22vh),rgba(0,0,0,0.08)_min(34%,30vh),transparent_46%)] dark:bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_0%,transparent_55%)] sm:dark:bg-[linear-gradient(to_top,rgba(0,0,0,0.66)_0%,rgba(0,0,0,0.48)_min(14%,12vh),rgba(0,0,0,0.26)_min(24%,22vh),rgba(0,0,0,0.1)_min(34%,30vh),transparent_46%)]"
          aria-hidden
        />
        <div className="relative z-10 flex h-full w-full max-w-full items-end justify-center pb-10 pt-16 sm:items-center sm:pb-10 sm:pt-24">
          <div className="w-full max-w-full px-4 sm:px-6 md:px-10 text-center">
            <motion.div
              className="relative mb-6"
              initial={false}
              animate={heroTextVisible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 14, filter: 'blur(8px)' }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-[80%] max-w-[520px] rounded-full bg-white/15 blur-3xl"
                initial={{ opacity: 0 }}
                animate={heroTextVisible ? { opacity: [0.35, 0.6, 0.35], scale: [1, 1.05, 1] } : { opacity: 0, scale: 1 }}
                transition={{ duration: 6, repeat: heroTextVisible ? Infinity : 0, ease: 'easeInOut' }}
              />
              <BlurText
                as="h1"
                text="BIOSKIN"
                dir="ltr"
                delay={120}
                animateBy="letters"
                direction="top"
                active={heroTextVisible}
                className="relative w-full justify-center text-center font-extrabold tracking-[0.1em] sm:tracking-[0.16em] md:tracking-[0.18em] text-white text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
                style={{ fontFamily: "'Raleway', sans-serif" }}
                animationFrom={{ filter: 'blur(12px)', opacity: 0, y: -36 }}
                animationTo={[
                  { filter: 'blur(5px)', opacity: 0.55, y: 6 },
                  { filter: 'blur(0px)', opacity: 1, y: 0 },
                ]}
                stepDuration={0.42}
              />
            </motion.div>
            <motion.p
              className="text-base min-[380px]:text-lg sm:text-xl md:text-3xl text-white max-w-5xl mx-auto leading-relaxed font-semibold"
              initial={false}
              animate={heroTextVisible ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 14, filter: 'blur(6px)' }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <ShinyText
                text={
                  language === 'en'
                    ? 'We combine beauty and science to give your skin the best possible care.'
                    : 'نجمع بين الجمال والعلم لنمنح بشرتك أفضل عناية ممكنة.'
                }
                speed={2.4}
                delay={0.5}
                color="rgba(255,255,255,0.9)"
                shineColor="#ffffff"
                spread={115}
                direction="left"
                disabled={!heroTextVisible}
              />
            </motion.p>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="home-bioskin-line relative flex w-full max-w-full items-center overflow-x-clip bg-gradient-to-b from-background to-secondary/20 py-6 sm:py-16 md:py-20"
        {...sectionReveal}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_38%),radial-gradient(circle_at_80%_70%,rgba(0,0,0,0.06),transparent_35%)]" />
        <div className="relative z-10 w-full px-3 sm:px-5 lg:px-6">
          <div className="home-bioskin-line__grid grid grid-cols-1 items-stretch gap-4 sm:gap-8 lg:grid-cols-2 lg:gap-12">
            <motion.div
              initial={isMobileHome ? false : { opacity: 0, x: isMobileHome ? 0 : -24 }}
              whileInView={isMobileHome ? undefined : { opacity: 1, x: 0 }}
              animate={isMobileHome ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.7 }}
              viewport={viewportInstant}
              className="home-bioskin-line__media relative order-1 mx-auto aspect-square w-full shrink-0 overflow-hidden rounded-2xl border shadow-xl sm:max-w-md lg:order-2 lg:mx-0 lg:max-w-none lg:aspect-auto lg:min-h-[560px]"
            >
              <img
                src="/section-2.png"
                alt="Medical cosmetic skincare"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/25 to-transparent" />
            </motion.div>

            <div className="home-bioskin-line__copy order-2 flex flex-col justify-center text-center lg:order-1 lg:text-start">
              <motion.h1
                className={`home-bioskin-line__title mb-3 w-full max-w-full break-words text-2xl font-extralight text-gradient sm:mb-6 sm:text-5xl md:text-6xl lg:text-7xl ${language === 'ar' ? 'tracking-normal' : 'tracking-wider'}`}
                initial={isMobileHome ? false : { opacity: 0, scale: 0.8 }}
                whileInView={isMobileHome ? undefined : { opacity: 1, scale: 1 }}
                animate={isMobileHome ? { opacity: 1, scale: 1 } : undefined}
                transition={{ duration: 1, delay: 0.2 }}
                viewport={viewportInstant}
                style={{fontFamily: "'Raleway', sans-serif"}}
              >
                {language === 'en' ? 'BIO SKIN Product Line' : 'مجموعة منتجات BIO SKIN'}
              </motion.h1>
              <motion.p
                className="home-bioskin-line__lead mx-auto max-w-2xl text-sm font-light leading-relaxed text-muted-foreground sm:text-lg md:text-xl lg:mx-0"
                initial={isMobileHome ? false : { opacity: 0, y: 30 }}
                whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
                animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={viewportInstant}
              >
                {language === 'en'
                  ? 'Discover a complete range of cosmetic skincare solutions designed to support daily care, visible glow, and confident healthy-looking skin.'
                  : 'اكتشف مجموعة متكاملة من حلول العناية التجميلية بالبشرة، مصممة لدعم العناية اليومية، إشراقة واضحة، ومظهر صحي يمنحك الثقة.'}
              </motion.p>
              <div className="home-bioskin-line__points mt-4 max-w-2xl mx-auto sm:mt-6 lg:mx-0">
                <p className="mb-2 text-xs font-semibold text-foreground sm:mb-3 sm:text-sm md:text-base">
                  {language === 'en' ? 'Why this line?' : 'لماذا هذه المجموعة؟'}
                </p>
                <ul className="home-bioskin-line__points-grid grid grid-cols-2 gap-2 text-start text-[0.7rem] leading-snug text-muted-foreground sm:gap-2.5 sm:text-sm md:text-base lg:grid-cols-1 lg:space-y-2.5">
                  {(language === 'en'
                    ? [
                        'Wide product selection covering brightening, hydration, renewal, and daily protection needs.',
                        'Professional-inspired formulas developed to fit different skin types and routines.',
                        'A complete skincare journey from daily essentials to targeted treatment-focused options.',
                      ]
                    : [
                        'تشكيلة واسعة تغطي احتياجات التفتيح، الترطيب، التجديد، والحماية اليومية.',
                        'تركيبات مستوحاة من العناية الاحترافية ومناسبة لأنواع البشرة المختلفة وروتيناتها.',
                        'رحلة عناية متكاملة تبدأ من الأساسيات اليومية وتصل إلى الخيارات العلاجية الموجهة.',
                      ]
                  ).map((point) => (
                    <li key={point} className="flex items-start gap-1.5 rounded-lg bg-background/60 p-2 leading-snug sm:gap-2.5 sm:bg-transparent sm:p-0 lg:leading-relaxed">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="relative w-full max-w-full py-10 md:py-14 bg-background flex items-center overflow-x-clip"
        {...sectionReveal}
      >
        <motion.img
          key={`why-bg-${whyImageIndex}`}
          src={whyImages[whyImageIndex]}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35 blur-sm"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 0.35, scale: 1.02 }}
          transition={{ duration: 0.9 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-background/65" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(0,0,0,0.06),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(255,255,255,0.5),transparent_35%)]" />
        <div className="w-full px-3 sm:px-5 lg:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-stretch">
            <motion.div
              className="flex flex-col justify-center px-1 sm:px-2 md:px-4"
              initial={isMobileHome ? false : { opacity: 0, y: 40 }}
              whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
              animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.75, ease: easeScroll }}
              viewport={viewportInstant}
            >
              <p className="inline-flex w-fit items-center rounded-full border border-primary/30 bg-background/75 px-4 py-1.5 text-xs md:text-sm font-semibold text-primary mb-4">
                {language === 'en' ? 'Therapeutic Beauty, Smarter Care' : 'تجميل علاجي بعناية أذكى'}
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gradient mb-4 w-full max-w-full break-words px-0.5">
                {language === 'en' ? 'Why BIOSKIN?' : 'لماذا BIOSKIN؟'}
              </h2>
              <p className="text-base md:text-lg text-foreground/90 leading-relaxed mb-7 max-w-2xl">
                {language === 'en'
                  ? 'BIOSKIN combines professional aesthetic quality with a practical shopping experience, so every step from choosing products to checkout feels clear, reliable, and aligned with your daily care goals.'
                  : 'BIOSKIN تجمع بين الجودة التجميلية الاحترافية وتجربة شراء عملية، لتكون كل خطوة من اختيار المنتجات وحتى إتمام الطلب واضحة، موثوقة، ومناسبة لأهداف العناية اليومية.'}
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm sm:text-base content-start">
                {whyPoints[language].map((point) => (
                  <li key={point} className="flex items-start gap-3 text-foreground/85 leading-relaxed bg-background/55 rounded-xl px-3 py-2">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="relative h-full"
              initial={isMobileHome ? false : { opacity: 0, y: 44 }}
              whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
              animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.8, delay: 0.1, ease: easeScroll }}
              viewport={viewportInstant}
            >
              <div className="relative h-[340px] sm:h-[460px] md:h-[620px] lg:h-full lg:min-h-[680px] rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                <motion.img
                  key={whyImageIndex}
                  src={whyImages[whyImageIndex]}
                  alt="DERMAFILL skincare visual"
                  className="h-full w-full object-cover object-center"
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                {whyImages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 rounded-full transition-all ${i === whyImageIndex ? 'w-6 bg-primary' : 'w-2.5 bg-primary/30'}`}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Index;