import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, Headphones, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LOGO_URL } from '@/lib/branding';
import {
  FOOTER_CONTENT_CHANGED,
  getFooterContent,
  type FooterContent,
} from '@/lib/footerContent';
import { withSyncedEnglish } from '@/lib/footerTranslation';

function FooterCopyright({ text }: { text: string }) {
  return <p className="site-footer__copyright">{text}</p>;
}

type FooterRow = {
  icon: typeof Mail;
  node: ReactNode;
};

const Footer = () => {
  const { language } = useLanguage();
  const location = useLocation();
  const lang = language === 'ar' ? 'ar' : 'en';
  const isCatalogLayout =
    location.pathname.startsWith('/products/') || /^\/product\/[^/]+$/.test(location.pathname);
  const layoutDir = isCatalogLayout ? 'ltr' : language === 'ar' ? 'rtl' : 'ltr';
  const reduceMotion = useReducedMotion();
  const [content, setContent] = useState<FooterContent>(() => withSyncedEnglish(getFooterContent()));

  const reload = useCallback(() => setContent(withSyncedEnglish(getFooterContent())), []);

  useEffect(() => {
    reload();
    const onChange = () => reload();
    window.addEventListener(FOOTER_CONTENT_CHANGED, onChange);
    return () => window.removeEventListener(FOOTER_CONTENT_CHANGED, onChange);
  }, [reload]);

  const t = (pair: { en: string; ar: string }) => pair[lang];
  const slideFrom = language === 'ar' ? 20 : -20;

  const ease = [0.25, 0.46, 0.45, 0.94] as const;

  const viewport = { once: true, margin: '-40px' as const };

  const columnsMotion = reduceMotion
    ? {}
    : {
        initial: 'hidden',
        whileInView: 'visible',
        viewport,
        variants: {
          hidden: {},
          visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } },
        },
      };

  const colMotion = reduceMotion
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 32 },
          visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease, staggerChildren: 0.1, delayChildren: 0.05 },
          },
        },
      };

  const rowMotion = reduceMotion
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, x: slideFrom },
          visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease } },
        },
      };

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport,
        transition: { duration: 0.65, ease },
      };

  const supportLine = t(content.support.line1).trim();
  const supportRows: FooterRow[] = supportLine
    ? [{ icon: Headphones, node: <span>{supportLine}</span> }]
    : [];

  const columns: { id: string; title: string; rows: FooterRow[] }[] = [
    {
      id: 'contact',
      title: t(content.contact.title),
      rows: [
        {
          icon: Mail,
          node: (
            <a href={`mailto:${content.contact.email}`} className="site-footer__link">
              {content.contact.email}
            </a>
          ),
        },
        {
          icon: Phone,
          node: (
            <a href={`tel:${content.contact.phoneTel}`} className="site-footer__link" dir="ltr">
              {content.contact.phoneDisplay}
            </a>
          ),
        },
      ],
    },
    {
      id: 'support',
      title: t(content.support.title),
      rows: supportRows,
    },
    {
      id: 'address',
      title: t(content.address.title),
      rows: [
        { icon: MapPin, node: <span>{t(content.address.line1)}</span> },
        { icon: MapPin, node: <span>{t(content.address.line2)}</span> },
      ],
    },
    {
      id: 'hours',
      title: t(content.hours.title),
      rows: [
        { icon: Clock, node: <span>{t(content.hours.time)}</span> },
        { icon: Clock, node: <span>{t(content.hours.days)}</span> },
      ],
    },
  ].filter((col) => col.rows.length > 0);

  return (
    <footer id="site-footer" className="site-footer" dir={layoutDir} lang={lang}>
      <motion.div className="site-footer__ambient" aria-hidden {...fadeUp}>
        <span className="site-footer__orb site-footer__orb--a" />
        <span className="site-footer__orb site-footer__orb--b" />
      </motion.div>

      <div className="site-footer__inner">
        <motion.div className="site-footer__logo-wrap" {...fadeUp}>
          <Link
            to="/"
            className="site-footer__logo-link"
            aria-label="BIOSKIN"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img
              src={LOGO_URL}
              alt="BIOSKIN"
              className="site-footer__logo"
              loading="lazy"
              decoding="async"
            />
          </Link>
        </motion.div>

        <motion.div key={lang} className="site-footer__columns" {...columnsMotion}>
          {columns.map((col) => (
            <motion.div key={col.id} className="site-footer__col" {...colMotion}>
              <h3 className="site-footer__heading">{col.title}</h3>
              <ul className="site-footer__list">
                {col.rows.map((row, idx) => {
                  const Icon = row.icon;
                  return (
                    <motion.li key={idx} className="site-footer__row" {...rowMotion}>
                      <span className="site-footer__icon" aria-hidden>
                        <Icon className="site-footer__icon-glyph" strokeWidth={1.75} />
                      </span>
                      <span className="site-footer__text">{row.node}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <div className="site-footer__divider" aria-hidden />

        <motion.div key={`copyright-${lang}`} {...fadeUp}>
          <FooterCopyright text={t(content.copyright)} />
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
