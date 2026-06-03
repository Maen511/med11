import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import Header from '@/components/Header';
import BrandedPageAmbient from '@/components/BrandedPageAmbient';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { LOGO_URL } from '@/lib/branding';
import {
  FOOTER_CONTENT_CHANGED,
  getFooterContent,
  phoneTelToWhatsAppUrl,
  type FooterContent,
} from '@/lib/footerContent';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const Contact = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [footer, setFooter] = useState<FooterContent>(() => getFooterContent());

  const reloadFooter = useCallback(() => setFooter(getFooterContent()), []);

  useEffect(() => {
    reloadFooter();
    const onChange = () => reloadFooter();
    window.addEventListener(FOOTER_CONTENT_CHANGED, onChange);
    return () => window.removeEventListener(FOOTER_CONTENT_CHANGED, onChange);
  }, [reloadFooter]);

  const labels = {
    en: {
      title: 'Contact Us',
      subtitle: 'Reach our team for product guidance and order support',
      emailLabel: 'Email',
      whatsappLabel: 'WhatsApp',
    },
    ar: {
      title: 'اتصل بنا',
      subtitle: 'تواصل معنا للاستفسار عن المنتجات ودعم الطلبات',
      emailLabel: 'البريد الإلكتروني',
      whatsappLabel: 'واتساب',
    },
  } as const;

  const t = labels[language];
  const { email, phoneDisplay, phoneTel } = footer.contact;

  return (
    <div className="relative min-h-screen bg-black text-zinc-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <BrandedPageAmbient />
      <div className="relative z-10">
        <Header language={language} onLanguageChange={setLanguage} />

        <section className="contact-page pb-24 pt-28">
          <div className="container mx-auto max-w-4xl px-4">
            <div className="mb-4 text-start">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
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
                  alt={t.title}
                  className="about-page__logo-img relative z-[1]"
                  decoding="async"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
              <motion.h1
                className="about-page__heading mb-2 text-2xl font-semibold text-zinc-50 md:text-3xl lg:text-4xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
              >
                {t.title}
              </motion.h1>
              <motion.p
                className="mx-auto max-w-xl text-base text-zinc-400 md:text-lg"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                {t.subtitle}
              </motion.p>
            </div>

            <motion.div
              className="contact-page__channels mt-10 md:mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.32 }}
            >
              <a
                href={`mailto:${email}`}
                className="contact-page__channel luxury-card group"
              >
                <span className="contact-page__channel-icon" aria-hidden>
                  <Mail className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <span className="contact-page__channel-label">{t.emailLabel}</span>
                <span className="contact-page__channel-value" dir="ltr">
                  {email}
                </span>
              </a>

              <a
                href={phoneTelToWhatsAppUrl(phoneTel)}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-page__channel contact-page__channel--whatsapp luxury-card group"
              >
                <span className="contact-page__channel-icon" aria-hidden>
                  <WhatsAppIcon className="h-7 w-7" />
                </span>
                <span className="contact-page__channel-label">{t.whatsappLabel}</span>
                <span className="contact-page__channel-value" dir="ltr">
                  {phoneDisplay}
                </span>
              </a>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default Contact;
