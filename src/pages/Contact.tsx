import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Mail, MapPin, Phone, Send, type LucideIcon } from 'lucide-react';
import Header from '@/components/Header';
import BrandedPageAmbient from '@/components/BrandedPageAmbient';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from '@/lib/storeLocale';
import { LOGO_URL } from '@/lib/branding';

function ContactInfoRow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/10 p-3.5 text-start">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5 pt-0.5 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

const Contact = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const labels = {
    en: {
      title: 'Contact Us',
      subtitle: 'Our team is ready to support your skincare needs',
      name: 'Name',
      email: 'Your Email',
      message: 'Message',
      send: 'Send Message',
      formTitle: 'Send us a message',
      follow: 'Support',
      followIntro: 'For product guidance and order support, contact us via email or phone.',
      address: 'Address',
      hours: 'Hours',
      hoursTime: '10:00 AM - 10:00 PM',
      addressLine1: 'Healthcare District - Office 14',
      addressLine2: 'Amman - Jordan',
    },
    ar: {
      title: 'اتصل بنا',
      subtitle: 'فريقنا جاهز لدعم احتياجات العناية ببشرتك',
      name: 'الاسم',
      email: 'بريدك الإلكتروني',
      message: 'الرسالة',
      send: 'إرسال الرسالة',
      formTitle: 'أرسل لنا رسالة',
      follow: 'الدعم',
      followIntro: 'للاستفسار عن المنتجات ودعم الطلبات، تواصل معنا عبر البريد أو الهاتف.',
      address: 'العنوان',
      hours: 'ساعات العمل',
      hoursTime: '10 صباحاً - 10 مساءً',
      addressLine1: 'منطقة الرعاية الصحية - مكتب 14',
      addressLine2: 'عمان - الأردن',
    }
  } as const;

  const t = labels[language];

  return (
    <div className="relative min-h-screen bg-black text-zinc-100" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <BrandedPageAmbient />
      <div className="relative z-10">
        <Header language={language} onLanguageChange={setLanguage} />

        <section className="pb-20 pt-28">
          <div className="container mx-auto px-4">
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
            <div className="mb-12 text-center">
              <motion.div
                className="mb-6 flex justify-center py-4 sm:py-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <motion.img
                  src={LOGO_URL}
                  alt={t.title}
                  className="mx-auto h-24 w-auto max-w-[min(92vw,320px)] object-contain drop-shadow-[0_4px_28px_rgba(255,255,255,0.18)] sm:h-28 sm:max-w-[380px] md:h-32 md:max-w-[440px] lg:h-36 lg:max-w-[500px]"
                  decoding="async"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
              <motion.p
                className="mx-auto max-w-2xl text-zinc-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                {t.subtitle}
              </motion.p>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
              {/* Support */}
              <Card className="luxury-card h-full">
                <CardHeader className="pb-3 text-start">
                  <CardTitle className="text-xl">{t.follow}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-start">
                  <p className="text-sm leading-relaxed text-muted-foreground">{t.followIntro}</p>

                  <div className="space-y-3">
                    <ContactInfoRow icon={Mail}>
                      <a href="mailto:info@dermacure.ae" className="font-medium hover:text-primary hover:underline">
                        info@dermacure.ae
                      </a>
                    </ContactInfoRow>

                    <ContactInfoRow icon={Phone}>
                      <a
                        href={`tel:${STORE_PHONE_TEL}`}
                        className="font-medium hover:text-primary hover:underline"
                        dir="ltr"
                      >
                        {STORE_PHONE_DISPLAY}
                      </a>
                    </ContactInfoRow>

                    <ContactInfoRow icon={MapPin}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.address}</p>
                      <p className="font-medium">{t.addressLine1}</p>
                      <p className="text-muted-foreground">{t.addressLine2}</p>
                    </ContactInfoRow>

                    <ContactInfoRow icon={Clock}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.hours}</p>
                      <p className="font-medium">{t.hoursTime}</p>
                    </ContactInfoRow>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="luxury-card h-full">
                <CardHeader className="pb-3 text-start">
                  <CardTitle className="text-xl">{t.formTitle}</CardTitle>
                </CardHeader>
                <CardContent className="text-start">
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <Input
                      placeholder={t.name}
                      type="text"
                      required
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                    />
                    <Input
                      placeholder={t.email}
                      type="email"
                      required
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                    />
                    <Textarea
                      placeholder={t.message}
                      className="min-h-[160px]"
                      required
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                      style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                    />
                    <Button type="submit" className="btn-primary inline-flex w-full items-center gap-2 sm:w-auto">
                      <Send className="h-4 w-4" /> {t.send}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
};

export default Contact;


