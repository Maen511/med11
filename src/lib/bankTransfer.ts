/** بيانات التحويل البنكي من متغيرات البيئة (عرض للعميل فقط — لا يُنفَّذ دفع حقيقي من الواجهة) */

export type BankTransferConfig = {
  bankName: string;
  beneficiary: string;
  iban: string;
  swift: string;
  currency: string;
  /** بريد لاستلام إيصالات التحويل / استفسارات الدفع */
  contactEmail: string;
};

export function getBankTransferConfig(): BankTransferConfig {
  const env = typeof import.meta !== 'undefined' ? import.meta.env : ({} as Record<string, string>);
  return {
    bankName: String(env?.VITE_BANK_NAME ?? '').trim(),
    beneficiary: String(env?.VITE_BANK_BENEFICIARY ?? '').trim(),
    iban: String(env?.VITE_BANK_IBAN ?? '').trim(),
    swift: String(env?.VITE_BANK_SWIFT ?? '').trim(),
    currency: String(env?.VITE_BANK_CURRENCY ?? 'JOD').trim() || 'JOD',
    contactEmail: String(env?.VITE_PAYMENT_CONTACT_EMAIL ?? '').trim(),
  };
}

export function hasBankTransferDetails(): boolean {
  const c = getBankTransferConfig();
  return Boolean(c.iban || c.bankName || c.beneficiary);
}
