import { STORE_PHONE_DISPLAY, STORE_PHONE_TEL } from '@/lib/storeLocale';

export const FOOTER_CONTENT_KEY = 'med-footer-content';
export const FOOTER_CONTENT_CHANGED = 'med-footer-content-changed';

export type FooterLocaleText = { en: string; ar: string };

export type FooterContent = {
  contact: {
    title: FooterLocaleText;
    email: string;
    phoneDisplay: string;
    phoneTel: string;
  };
  support: {
    title: FooterLocaleText;
    line1: FooterLocaleText;
    line2: FooterLocaleText;
  };
  address: {
    title: FooterLocaleText;
    line1: FooterLocaleText;
    line2: FooterLocaleText;
  };
  hours: {
    title: FooterLocaleText;
    time: FooterLocaleText;
    days: FooterLocaleText;
  };
  copyright: FooterLocaleText;
};

export const DEFAULT_FOOTER_CONTENT: FooterContent = {
  contact: {
    title: { en: 'Contact', ar: 'التواصل' },
    email: 'Amir_douglas@windowslive.com',
    phoneDisplay: '+962 790 325 034',
    phoneTel: '+962790325034',
  },
  support: {
    title: { en: 'Support', ar: 'الدعم' },
    line1: { en: 'Customer service available', ar: 'خدمة العملاء متاحة' },
    line2: { en: '', ar: '' },
  },
  address: {
    title: { en: 'Address', ar: 'العنوان' },
    line1: { en: 'Abdali Boulevard - Building 12', ar: 'شارع العبدلي - مبنى 12' },
    line2: { en: 'Amman - Jordan', ar: 'عمان - الأردن' },
  },
  hours: {
    title: { en: 'Hours', ar: 'ساعات العمل' },
    time: { en: '9:00 AM - 10:00 PM', ar: '9 صباحاً - 10 مساءً' },
    days: { en: 'Saturday - Thursday', ar: 'السبت - الخميس' },
  },
  copyright: {
    en: '© 2026 BIOSKIN. All rights reserved. Cosmetic pharmaceutical skincare solutions.',
    ar: '© 2026 BIOSKIN. جميع الحقوق محفوظة. حلول أدوية تجميلية للعناية بالبشرة.',
  },
};

function mergeLocale(partial: Partial<FooterLocaleText> | undefined, fallback: FooterLocaleText): FooterLocaleText {
  return {
    en: partial?.en?.trim() ? partial.en : fallback.en,
    ar: partial?.ar?.trim() ? partial.ar : fallback.ar,
  };
}

function mergeFooterContent(partial: Partial<FooterContent>): FooterContent {
  const d = DEFAULT_FOOTER_CONTENT;
  return {
    contact: {
      title: mergeLocale(partial.contact?.title, d.contact.title),
      email: partial.contact?.email?.trim() || d.contact.email,
      phoneDisplay: partial.contact?.phoneDisplay?.trim() || d.contact.phoneDisplay,
      phoneTel: partial.contact?.phoneTel?.trim() || d.contact.phoneTel,
    },
    support: {
      title: mergeLocale(partial.support?.title, d.support.title),
      line1: mergeLocale(
        partial.support?.line1 ??
          (() => {
            const legacy = partial.support as { text?: FooterLocaleText } | undefined;
            return legacy?.text
              ? { ar: legacy.text.ar, en: legacy.text.en }
              : undefined;
          })(),
        d.support.line1,
      ),
      line2: mergeLocale(partial.support?.line2, d.support.line2),
    },
    address: {
      title: mergeLocale(partial.address?.title, d.address.title),
      line1: mergeLocale(partial.address?.line1, d.address.line1),
      line2: mergeLocale(partial.address?.line2, d.address.line2),
    },
    hours: {
      title: mergeLocale(partial.hours?.title, d.hours.title),
      time: mergeLocale(partial.hours?.time, d.hours.time),
      days: mergeLocale(partial.hours?.days, d.hours.days),
    },
    copyright: mergeLocale(partial.copyright, d.copyright),
  };
}

export function getFooterContent(): FooterContent {
  try {
    const raw = localStorage.getItem(FOOTER_CONTENT_KEY);
    if (!raw) return DEFAULT_FOOTER_CONTENT;
    const parsed = JSON.parse(raw) as Partial<FooterContent>;
    return mergeFooterContent(parsed);
  } catch {
    return DEFAULT_FOOTER_CONTENT;
  }
}

export function setFooterContent(content: FooterContent) {
  const normalized = mergeFooterContent(content);
  try {
    localStorage.setItem(FOOTER_CONTENT_KEY, JSON.stringify(normalized));
  } catch {}
  window.dispatchEvent(new Event(FOOTER_CONTENT_CHANGED));
}

/** رابط فتح محادثة واتساب من رقم بصيغة tel (+962...) */
export function phoneTelToWhatsAppUrl(tel: string): string {
  const digits = tel.replace(/\D/g, '');
  if (!digits) return 'https://wa.me/';
  return `https://wa.me/${digits}`;
}

export function phoneDisplayToTel(display: string): string {
  const trimmed = display.trim();
  if (!trimmed) return STORE_PHONE_TEL;
  const compact = trimmed.replace(/[\s()-]/g, '');
  if (compact.startsWith('+')) return compact;
  const digits = compact.replace(/\D/g, '');
  if (digits.startsWith('962')) return `+${digits}`;
  if (digits.startsWith('0')) return `+962${digits.slice(1)}`;
  if (digits.length >= 9) return `+962${digits}`;
  return compact.startsWith('+') ? compact : `+${digits}`;
}
