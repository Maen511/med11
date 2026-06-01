import Header from '@/components/Header';
import BrandedPageAmbient from '@/components/BrandedPageAmbient';
import { LOGO_URL } from '@/lib/branding';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import Footer from '@/components/Footer';

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
      p3: 'Our vision is to deliver reliable dermatology-inspired skincare for all skin types, with transparent formulas and customer-first support.'
    },
    ar: {
      heading: 'من نحن',
      sub: 'حلول أدوية تجميلية لبشرة صحية',
      p1: 'بايو سكين شركة أدوية تجميلية متخصصة بتركيبات عناية فعالة تجمع بين الأمان العلمي وسهولة الاستخدام اليومي.',
      p2: 'من السيرومات والمنظفات إلى الكريمات العلاجية وواقيات الشمس، كل منتج مبني على فائدة واضحة وتعليمات استخدام عملية.',
      milestones: 'محطات ورؤية',
      p3: 'رؤيتنا تقديم عناية مستوحاة من طب الجلد تناسب كل أنواع البشرة بصيغ شفافة ودعم يضع العميل أولاً.'
    },
  } as const;

  return (
    <div className="relative min-h-screen bg-black text-zinc-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <BrandedPageAmbient />
      <div className="relative z-10">
        <Header language={language} onLanguageChange={setLanguage} />

        <section className="pt-28 pb-12">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-4 text-left">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'en' ? 'Back to Home' : 'العودة للصفحة الرئيسية'}
              </Button>
            </div>
            <motion.div
              className="mb-6 flex justify-center py-4 sm:py-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <motion.img
                src={LOGO_URL}
                alt={content[language].heading}
                className="mx-auto h-24 w-auto max-w-[min(92vw,320px)] object-contain drop-shadow-[0_4px_28px_rgba(255,255,255,0.18)] sm:h-28 sm:max-w-[380px] md:h-32 md:max-w-[440px] lg:h-36 lg:max-w-[500px]"
                decoding="async"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
            <motion.p
              className="mx-auto max-w-3xl text-lg text-zinc-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {content[language].sub}
            </motion.p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto max-w-4xl px-4">
            <motion.div
              className="luxury-card space-y-4 rounded-2xl p-6 md:p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-base text-foreground/90 md:text-lg">{content[language].p1}</p>
              <p className="text-base text-foreground/90 md:text-lg">{content[language].p2}</p>
            </motion.div>
          </div>
        </section>

        <section className="py-8 pb-16">
          <div className="container mx-auto max-w-4xl px-4">
            <motion.h2
              className="mb-4 text-2xl font-semibold text-zinc-100 md:text-3xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {content[language].milestones}
            </motion.h2>
            <motion.p
              className="text-base text-zinc-400 md:text-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {content[language].p3}
            </motion.p>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default About;


