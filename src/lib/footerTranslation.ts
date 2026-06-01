import {
  DEFAULT_FOOTER_CONTENT,
  phoneDisplayToTel,
  type FooterContent,
  type FooterLocaleText,
} from '@/lib/footerContent';

/** مسودة عربية فقط — الإنجليزية تُشتق عند الحفظ والعرض */
export type FooterArabicDraft = {
  email: string;
  phoneDisplay: string;
  supportLine1: string;
  supportLine2: string;
  addressLine1: string;
  addressLine2: string;
  hoursTime: string;
  hoursDays: string;
  copyright: string;
};

const ARABIC_RE = /[\u0600-\u06FF]/;

function pair(ar: string, en: string): FooterLocaleText {
  return { ar: ar.trim(), en: en.trim() };
}

function enIfDefaultAr(ar: string, defaultAr: string, defaultEn: string): string {
  if (ar.trim() === defaultAr.trim()) return defaultEn;
  return translateFreeText(ar, defaultEn);
}

function translateFreeText(ar: string, fallbackEn: string): string {
  const src = ar.trim();
  if (!src) return fallbackEn;
  if (!ARABIC_RE.test(src)) return src;

  let en = src
    .replace(/(\d+)\s*صباحاً\s*[-–]\s*(\d+)\s*مساءً/g, '$1:00 AM - $2:00 PM')
    .replace(/صباحاً/g, 'AM')
    .replace(/مساءً/g, 'PM')
    .replace(/الاثنين\s*[-–]\s*الأحد/g, 'Monday - Sunday')
    .replace(/شارع العبدلي\s*[-–]\s*مبنى\s*12/g, 'Abdali Boulevard - Building 12')
    .replace(/عمان\s*[-–]\s*الأردن/g, 'Amman - Jordan')
    .replace(/ديرمافيل/g, 'DERMAFILL')
    .replace(/جميع الحقوق محفوظة\.?/g, 'All rights reserved.')
    .replace(
      /حلول أدوية تجميلية للعناية بالبشرة\.?/g,
      'Cosmetic pharmaceutical skincare solutions.'
    )
    .replace(/خدمة العملاء متاحة\.?/g, 'Customer service available')
    .replace(/7\s*أيام في الأسبوع\.?/g, '7 days a week')
    .replace(/السبت\s*[-–]\s*الخميس/g, 'Saturday - Thursday')
    .replace(/BIOSKIN/g, 'BIOSKIN')
    .replace(/ديرمافيل/g, 'BIOSKIN');

  en = en.replace(/\s+/g, ' ').trim();
  if (ARABIC_RE.test(en)) return fallbackEn;
  return en;
}

export function footerContentToArabicDraft(content: FooterContent): FooterArabicDraft {
  return {
    email: content.contact.email,
    phoneDisplay: content.contact.phoneDisplay,
    supportLine1: content.support.line1.ar,
    supportLine2: content.support.line2.ar,
    addressLine1: content.address.line1.ar,
    addressLine2: content.address.line2.ar,
    hoursTime: content.hours.time.ar,
    hoursDays: content.hours.days.ar,
    copyright: content.copyright.ar,
  };
}

export function footerContentFromArabicDraft(draft: FooterArabicDraft): FooterContent {
  const d = DEFAULT_FOOTER_CONTENT;
  const support1Ar = draft.supportLine1.trim() || d.support.line1.ar;
  const support2Ar = draft.supportLine2.trim() || d.support.line2.ar;
  const address1Ar = draft.addressLine1.trim() || d.address.line1.ar;
  const address2Ar = draft.addressLine2.trim() || d.address.line2.ar;
  const hoursTimeAr = draft.hoursTime.trim() || d.hours.time.ar;
  const hoursDaysAr = draft.hoursDays.trim() || d.hours.days.ar;
  const copyrightAr = draft.copyright.trim() || d.copyright.ar;

  const phoneDisplay = draft.phoneDisplay.trim() || d.contact.phoneDisplay;

  return {
    contact: {
      title: d.contact.title,
      email: draft.email.trim() || d.contact.email,
      phoneDisplay,
      phoneTel: phoneDisplayToTel(phoneDisplay),
    },
    support: {
      title: d.support.title,
      line1: pair(support1Ar, enIfDefaultAr(support1Ar, d.support.line1.ar, d.support.line1.en)),
      line2: pair(support2Ar, enIfDefaultAr(support2Ar, d.support.line2.ar, d.support.line2.en)),
    },
    address: {
      title: d.address.title,
      line1: pair(address1Ar, enIfDefaultAr(address1Ar, d.address.line1.ar, d.address.line1.en)),
      line2: pair(address2Ar, enIfDefaultAr(address2Ar, d.address.line2.ar, d.address.line2.en)),
    },
    hours: {
      title: d.hours.title,
      time: pair(hoursTimeAr, enIfDefaultAr(hoursTimeAr, d.hours.time.ar, d.hours.time.en)),
      days: pair(hoursDaysAr, enIfDefaultAr(hoursDaysAr, d.hours.days.ar, d.hours.days.en)),
    },
    copyright: pair(copyrightAr, enIfDefaultAr(copyrightAr, d.copyright.ar, d.copyright.en)),
  };
}

/** يحدّث حقول EN من AR عند كل قراءة (للمحتوى القديم أو بعد تعديل عربي فقط) */
export function withSyncedEnglish(content: FooterContent): FooterContent {
  return footerContentFromArabicDraft(footerContentToArabicDraft(content));
}
