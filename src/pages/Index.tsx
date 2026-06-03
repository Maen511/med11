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

  const bioskinLinePoints = {
    en: [
      'Wide selection: brightening, hydration, renewal, and daily protection.',
      'Professional-inspired formulas for different skin types and routines.',
      'From daily essentials to targeted treatment-focused options.',
      'Consistent quality you can trust for visible, healthy-looking results.',
      'Serums, cleansers, creams, and sun care designed to work together.',
      'Clear active benefits with practical guidance for real daily use.',
      'Options for face, body, and hair in one coherent care journey.',
      'A balanced line that supports morning-to-night skincare routines.',
    ],
    ar: [
      'تشكيلة واسعة: تفتيح، ترطيب، تجديد، وحماية يومية.',
      'تركيبات مستوحاة من العناية الاحترافية لأنواع البشرة المختلفة.',
      'من الأساسيات اليومية إلى الخيارات العلاجية الموجهة.',
      'جودة متسقة تثق بها لنتائج واضحة ومظهر بشرة صحي.',
      'سيرومات ومنظفات وكريمات وواقيات شمس تتكامل في روتين واحد.',
      'فوائد فعّالة واضحة مع إرشادات عملية للاستخدام اليومي.',
      'خيارات للوجه والجسم والشعر في رحلة عناية متماسكة.',
      'خط متوازن يدعم روتين العناية من الصباح حتى المساء.',
    ],
  } as const;

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
        <div className="home-hero-copy relative z-10 flex h-full w-full max-w-full items-center justify-center px-4 pb-8 text-center sm:pb-10 sm:pt-24">
          <div className="home-hero-copy__inner w-full max-w-full sm:px-2 md:px-10">
            <motion.div
              className="home-hero-title-wrap relative mb-6"
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
              className="text-base min-[380px]:text-lg sm:text-xl md:text-3xl text-white max-w-5xl mx-auto leading-snug sm:leading-relaxed font-semibold px-1"
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
        className="home-bioskin-line home-content-section relative z-[1] flex min-h-0 w-full max-w-full flex-col overflow-hidden md:min-h-svh"
        {...sectionReveal}
      >
        <div className="home-bioskin-line__ambient pointer-events-none" aria-hidden>
          <img src="/section-2.png" alt="" className="home-bioskin-line__ambient-img" />
        </div>
        <div className="home-bioskin-line__ambient-overlay pointer-events-none" aria-hidden />

        <div className="home-content-section__inner home-bioskin-line__inner relative z-10 flex min-h-0 w-full flex-col md:min-h-svh md:flex-1">
          <div className="home-bioskin-line__grid grid min-h-0 w-full grid-cols-1 items-start md:flex-1 md:grid-cols-2 md:items-stretch md:gap-10 md:px-10 md:pb-12 md:pt-10 lg:px-12 lg:pb-14">
            <motion.div
              className="home-bioskin-line__media relative order-1 flex w-full min-w-0 justify-center md:order-none md:min-h-0 md:items-stretch md:col-start-1 md:row-start-1 rtl:md:col-start-2"
              initial={isMobileHome ? false : { opacity: 0, y: 16 }}
              whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
              animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.75 }}
              viewport={viewportInstant}
            >
              <div className="home-bioskin-line__media-box relative h-auto w-full overflow-hidden md:h-full">
                <img
                  src="/section-2.png"
                  alt={language === 'en' ? 'BIO SKIN product line' : 'مجموعة منتجات BIO SKIN'}
                  className="home-bioskin-line__img"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </motion.div>

            <div className="home-bioskin-line__copy order-2 flex min-h-0 w-full min-w-0 flex-col gap-4 text-center md:order-none md:col-start-2 md:row-start-1 md:gap-7 md:text-start lg:gap-8 rtl:md:col-start-1">
              <div className="home-bioskin-line__copy-body flex w-full flex-col gap-3.5 rounded-2xl border border-border/40 bg-background/50 p-4 shadow-lg backdrop-blur-md sm:gap-5 sm:p-6">
                <motion.h2
                  className={`home-bioskin-line__title w-full shrink-0 break-words pb-1 font-extralight text-gradient ${language === 'ar' ? 'tracking-normal' : 'tracking-wider'}`}
                  initial={isMobileHome ? false : { opacity: 0, y: 20 }}
                  whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
                  animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.85, delay: 0.06 }}
                  viewport={viewportInstant}
                  style={{ fontFamily: "'Raleway', sans-serif" }}
                >
                  {language === 'en' ? 'BIO SKIN Product Line' : 'مجموعة منتجات BIO SKIN'}
                </motion.h2>
                <motion.p
                  className="home-bioskin-line__lead font-light text-foreground/95"
                  initial={isMobileHome ? false : { opacity: 0, y: 20 }}
                  whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
                  animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  viewport={viewportInstant}
                >
                  {language === 'en'
                    ? 'Discover a complete range of cosmetic skincare solutions designed to support daily care, visible glow, and confident healthy-looking skin.'
                    : 'اكتشف مجموعة متكاملة من حلول العناية التجميلية بالبشرة، مصممة لدعم العناية اليومية، إشراقة واضحة، ومظهر صحي يمنحك الثقة.'}
                </motion.p>
                <p className="home-bioskin-line__sublead text-foreground/85">
                  {language === 'en'
                    ? 'From brightening and hydration to protection and renewal — one line that supports your routine from morning to night.'
                    : 'من التفتيح والترطيب إلى الحماية والتجديد — خط واحد يدعم روتينك من الصباح حتى المساء بثقة ووضوح.'}
                </p>
              </div>

              <div className="home-bioskin-line__points flex w-full flex-col gap-3.5">
                <h3 className="home-bioskin-line__points-label font-semibold text-foreground">
                  {language === 'en' ? 'Why this line?' : 'لماذا هذه المجموعة؟'}
                </h3>
                <ul className="home-bioskin-line__points-grid grid w-full grid-cols-2 gap-2.5 text-start sm:gap-3">
                  {bioskinLinePoints[language].map((point) => (
                    <li
                      key={point}
                      className="home-bioskin-line__point flex items-start gap-2.5 rounded-xl border border-border/45 bg-background/55 p-3 shadow-md backdrop-blur-sm sm:gap-3 sm:p-4"
                    >
                      <CheckCircle2 className="home-bioskin-line__point-icon mt-0.5 shrink-0 text-primary" />
                      <span className="home-bioskin-line__point-text">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="home-why-bioskin home-content-section relative z-0 flex min-h-0 w-full max-w-full flex-col overflow-hidden md:min-h-svh"
        {...sectionReveal}
      >
        <div className="home-why-bioskin__ambient pointer-events-none" aria-hidden>
          <motion.img
            key={`why-ambient-${whyImageIndex}`}
            src={whyImages[whyImageIndex]}
            alt=""
            className="home-why-bioskin__ambient-img"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.85 }}
          />
        </div>
        <div className="home-why-bioskin__ambient-overlay pointer-events-none" aria-hidden />

        <div className="home-content-section__inner home-why-bioskin__inner relative z-10 flex min-h-0 w-full flex-col md:min-h-svh md:flex-1">
          <div className="home-why-bioskin__grid grid min-h-0 w-full grid-cols-1 items-start md:flex-1 md:grid-cols-2 md:items-stretch md:gap-10 md:px-10 md:pb-12 md:pt-10 lg:px-12 lg:pb-14">
            <motion.div
              className="home-why-bioskin__media relative order-1 flex w-full min-w-0 justify-center md:order-none md:min-h-0 md:items-stretch md:col-start-1 md:row-start-1 rtl:md:col-start-2"
              initial={isMobileHome ? false : { opacity: 0, y: 16 }}
              whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
              animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.75 }}
              viewport={viewportInstant}
            >
              <div className="home-why-bioskin__media-box relative h-auto w-full overflow-hidden md:h-full">
                <motion.img
                  key={whyImageIndex}
                  src={whyImages[whyImageIndex]}
                  alt="BIOSKIN skincare visual"
                  className="home-why-bioskin__img absolute inset-0 h-full w-full"
                  initial={{ opacity: 0, scale: 1.03 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                />
                <div className="home-why-bioskin__carousel-dots absolute inset-x-0 bottom-4 z-[2] flex items-center justify-center gap-2">
                  {whyImages.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2.5 rounded-full transition-all ${i === whyImageIndex ? 'w-6 bg-primary' : 'w-2.5 bg-primary/35'}`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="home-why-bioskin__copy order-2 flex min-h-0 w-full min-w-0 flex-col gap-4 text-center md:order-none md:col-start-2 md:row-start-1 md:gap-7 md:text-start lg:gap-8 rtl:md:col-start-1">
              <div className="home-why-bioskin__copy-body flex w-full flex-col gap-3.5 rounded-2xl border border-border/40 bg-background/50 p-4 shadow-lg backdrop-blur-md sm:gap-5 sm:p-6">
                <motion.h2
                  className={`home-why-bioskin__title w-full shrink-0 break-words pb-1 font-extralight text-gradient ${language === 'ar' ? 'tracking-normal' : 'tracking-wider'}`}
                  initial={isMobileHome ? false : { opacity: 0, y: 20 }}
                  whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
                  animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.85, delay: 0.06 }}
                  viewport={viewportInstant}
                  style={{ fontFamily: "'Raleway', sans-serif" }}
                >
                  {language === 'en' ? 'Why BIOSKIN?' : 'لماذا BIOSKIN؟'}
                </motion.h2>
                <motion.p
                  className="home-why-bioskin__lead font-light text-foreground/95"
                  initial={isMobileHome ? false : { opacity: 0, y: 20 }}
                  whileInView={isMobileHome ? undefined : { opacity: 1, y: 0 }}
                  animate={isMobileHome ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  viewport={viewportInstant}
                >
                  {language === 'en'
                    ? 'BIOSKIN combines professional aesthetic quality with a practical shopping experience built around clarity and trust.'
                    : 'BIOSKIN تجمع بين الجودة التجميلية الاحترافية وتجربة شراء عملية مبنية على الوضوح والثقة.'}
                </motion.p>
                <p className="home-why-bioskin__sublead text-foreground/85">
                  {language === 'en'
                    ? 'Every step from choosing products to checkout feels reliable and aligned with your daily care goals.'
                    : 'كل خطوة من اختيار المنتجات وحتى إتمام الطلب واضحة، موثوقة، ومناسبة لأهداف العناية اليومية.'}
                </p>
              </div>

              <div className="home-why-bioskin__points flex w-full flex-col gap-3.5">
                <h3 className="home-why-bioskin__points-label font-semibold text-foreground">
                  {language === 'en' ? 'Key advantages' : 'أبرز المزايا'}
                </h3>
                <ul className="home-why-bioskin__points-grid grid w-full grid-cols-2 gap-2.5 text-start sm:gap-3">
                  {whyPoints[language].map((point) => (
                    <li
                      key={point}
                      className="home-why-bioskin__point flex items-start gap-2.5 rounded-xl border border-border/45 bg-background/55 p-3 shadow-md backdrop-blur-sm sm:gap-3 sm:p-3.5"
                    >
                      <CheckCircle2 className="home-why-bioskin__point-icon mt-0.5 shrink-0 text-primary" />
                      <span className="home-why-bioskin__point-text">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
};

export default Index;