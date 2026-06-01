/** Western digits (0–9) everywhere, including when the UI is Arabic. */

export type FormatLang = 'en' | 'ar';

const NUMBER_LOCALE = 'en-GB';

const dateLocale = (language: FormatLang) => (language === 'ar' ? 'ar-JO' : 'en-GB');

/** Format a number with Western digits. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(NUMBER_LOCALE, options);
}

/** Format a date; Arabic month/day names when `language` is `ar`, digits stay Western. */
export function formatDate(
  value: Date | number,
  language: FormatLang,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'number' ? new Date(value) : value;
  return date.toLocaleDateString(dateLocale(language), { ...options, numberingSystem: 'latn' });
}

/** Format date and time with Western digits. */
export function formatDateTime(
  value: Date | number,
  language: FormatLang,
  options: Intl.DateTimeFormatOptions,
): string {
  const date = typeof value === 'number' ? new Date(value) : value;
  return date.toLocaleString(dateLocale(language), { ...options, numberingSystem: 'latn' });
}

/** Jordanian Dinar amount with Western digits. */
export function formatJod(amount: number, language: FormatLang): string {
  const n = formatNumber(amount, { maximumFractionDigits: 2, minimumFractionDigits: 0 });
  return language === 'ar' ? `${n} د.أ` : `${n} JOD`;
}
