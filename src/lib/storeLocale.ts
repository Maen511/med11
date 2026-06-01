/** Store region: Jordan, prices in Jordanian Dinar (JOD). */

export const STORE_COUNTRY = { en: 'Jordan', ar: 'الأردن' } as const;

export const STORE_PHONE_TEL = '+962790000000';
export const STORE_PHONE_DISPLAY = '+962 79 000 0000';

export const JORDAN_CITIES = {
  en: ['Amman', 'Irbid', 'Zarqa', 'Russeifa', 'Aqaba', 'Madaba', 'Salt', 'Mafraq', 'Karak', "Tafilah", 'Jerash', "Ma'an", 'Ajloun'],
  ar: ['عمان', 'إربد', 'الزرقاء', 'الرصيفة', 'العقبة', 'مادبا', 'السلط', 'المفرق', 'الكرك', 'الطفيلة', 'جرش', 'معان', 'عجلون'],
} as const;

export const CURRENCY = {
  code: 'JOD',
  labelEn: 'Jordanian Dinar',
  labelAr: 'دينار أردني',
  shortEn: 'JD',
  shortAr: 'د.أ',
} as const;

export const currencyTitle = (lang: 'en' | 'ar') =>
  lang === 'ar' ? CURRENCY.labelAr : CURRENCY.labelEn;

export const currencySymbol = (lang: 'en' | 'ar') =>
  lang === 'ar' ? CURRENCY.shortAr : CURRENCY.shortEn;
