import Header from '@/components/Header';
import BrandedPageAmbient from '@/components/BrandedPageAmbient';
import { LOGO_URL } from '@/lib/branding';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FlaskConical,
  HeartHandshake,
  Layers3,
  Microscope,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Footer from '@/components/Footer';

type VisionCard = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const visionCards: Record<'en' | 'ar', VisionCard[]> = {
  en: [
    {
      icon: Sparkles,
      title: 'Brand foundation',
      body: 'BIOSKIN was built to bring cosmetic pharmaceutical skincare that feels professional, approachable, and easy to trust in daily routines.',
    },
    {
      icon: Microscope,
      title: 'Science-led formulas',
      body: 'Each range is developed around clear active benefits — hydration, renewal, brightening, and protection — with practical guidance for real use.',
    },
    {
      icon: Layers3,
      title: 'Complete care lines',
      body: 'From cleansers and serums to targeted treatments and sun care, the catalog covers face, body, and hair needs in one coherent journey.',
    },
    {
      icon: ShieldCheck,
      title: 'Transparency & safety',
      body: 'We focus on understandable product information, responsible positioning, and formulas customers can choose with confidence.',
    },
    {
      icon: HeartHandshake,
      title: 'Customer-first experience',
      body: 'Registered shopping, verified access where required, flexible payment options, and support that respects your time and goals.',
    },
    {
      icon: FlaskConical,
      title: 'Vision ahead',
      body: 'Our vision is to grow as a reference brand for dermatology-inspired cosmetic care — reliable results, elegant experience, and lasting trust.',
    },
  ],
  ar: [
    {
      icon: Sparkles,
      title: 'انطلاقة العلامة',
      body: 'تأسست BIOSKIN لتقديم عناية تجميلية صيدلانية تجمع بين الطابع الاحترافي، سهولة الاستخدام، والثقة في الروتين اليومي.',
    },
    {
      icon: Microscope,
      title: 'تركيبات مبنية على العلم',
      body: 'كل مجموعة تُطوَّر حول فائدة واضحة — ترطيب، تجديد، تفتيح، وحماية — مع إرشادات عملية للاستخدام الحقيقي.',
    },
    {
      icon: Layers3,
      title: 'خطوط عناية متكاملة',
      body: 'من المنظفات والسيرومات إلى العلاجات الموجهة وواقيات الشمس، الكتالوج يغطي الوجه والجسم والشعر في رحلة واحدة متماسكة.',
    },
    {
      icon: ShieldCheck,
      title: 'شفافية وأمان',
      body: 'نركز على معلومات منتج مفهومة، تموضع مسؤول، وصيغ يختارها العميل بثقة ووضوح.',
    },
    {
      icon: HeartHandshake,
      title: 'تجربة تضع العميل أولاً',
      body: 'تسوق منظم للمسجلين، وصول موثّق عند الحاجة، خيارات دفع مرنة، ودعم يحترم وقتك وأهدافك.',
    },
    {
      icon: FlaskConical,
      title: 'رؤيتنا للمستقبل',
      body: 'نطمح أن نكون مرجعاً في العناية التجميلية المستوحاة من طب الجلد — نتائج موثوقة، تجربة أنيقة، وثقة تدوم.',
    },
  ],
};

const About = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      heading: 'About Us',
      sub: 'Cosmetic pharmaceutical solutions for healthy skin',
      p1: <span><span style={{fontFamily: "'Raleway', sans-serif"}}>BIOSKIN</span> is a cosmetic pharmaceutical company dedicated to effective skincare formulations that combine safety, science, and daily usability.</span>,
      p2: 'From serums and cleansers to treatment creams and sun protection, each product is built around clear benefits and practical usage guidance.',
      milestones: 'Milestones & Vision',
      milestonesIntro:
        'Key steps that shaped BIOSKIN — and the direction we are building toward for every customer.',
    },
    ar: {
      heading: 'من نحن',
      sub: 'حلول أدوية تجميلية لبشرة صحية',
      p1: 'بايو سكين شركة أدوية تجميلية متخصصة بتركيبات عناية فعالة تجمع بين الأمان العلمي وسهولة الاستخدام اليومي.',
      p2: 'من السيرومات والمنظفات إلى الكريمات العلاجية وواقيات الشمس، كل منتج مبني على فائدة واضحة وتعليمات استخدام عملية.',
      milestones: 'محطات ورؤية',
      milestonesIntro:
        'محطات مرتبتنا كعلامة — والاتجاه الذي نبني عليه تجربة عناية أوضح وأقوى لكل عميل.',
    },
  } as const;

  return (
    <div className="relative min-h-screen bg-black text-zinc-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <BrandedPageAmbient />
      <div className="relative z-10">
        <Header language={language} onLanguageChange={setLanguage} />

        <section className="about-page__hero pt-28 pb-8">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="mb-4 text-start">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'en' ? 'Back to Home' : 'العودة للصفحة الرئيسية'}
              </Button>
            </div>

            <div className="about-page__hero-head text-center">
              <motion.div
                className="about-page__logo-stage"
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
              >
                <div className="about-page__logo-glow" aria-hidden />
                <motion.img
                  src={LOGO_URL}
                  alt={content[language].heading}
                  className="about-page__logo-img relative z-[1]"
                  decoding="async"
                  fetchPriority="high"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
              <motion.h1
                className="about-page__heading mb-0 text-2xl font-semibold text-zinc-50 md:text-3xl lg:text-4xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
              >
                {content[language].heading}
              </motion.h1>
            </div>

            <motion.div
              className="about-page__intro-card luxury-card mt-4 rounded-2xl p-6 md:mt-5 md:p-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
            >
              <p className="about-page__intro-lead mb-4 text-center text-base font-medium text-primary/90 md:text-lg">
                {content[language].sub}
              </p>
              <div className="about-page__intro-body space-y-4 text-start text-base leading-relaxed text-foreground/90 md:space-y-5 md:text-lg">
                <p>{content[language].p1}</p>
                <p>{content[language].p2}</p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="about-page__vision py-10 pb-20">
          <div className="container mx-auto max-w-6xl px-4">
            <motion.div
              className="about-page__vision-head mb-8 text-center md:mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="about-page__heading mb-3 text-2xl font-semibold text-zinc-50 md:text-3xl lg:text-4xl">
                {content[language].milestones}
              </h2>
              <p className="about-page__vision-intro mx-auto max-w-3xl text-base text-zinc-400 md:text-lg">
                {content[language].milestonesIntro}
              </p>
            </motion.div>

            <ul className="about-page__vision-grid grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {visionCards[language].map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.li
                    key={card.title}
                    className="about-page__vision-card luxury-card list-none rounded-2xl p-5 md:p-6"
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.55, delay: index * 0.07 }}
                  >
                    <span className="about-page__vision-card-icon mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="about-page__vision-card-title mb-2 text-lg font-semibold text-zinc-50 md:text-xl">
                      {card.title}
                    </h3>
                    <p className="about-page__vision-card-body text-sm leading-relaxed text-zinc-400 md:text-base">
                      {card.body}
                    </p>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default About;


