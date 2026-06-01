import { toast } from 'sonner';

export function notifyCatalogAccessPending(language: 'ar' | 'en') {
  toast.info(
    language === 'ar'
      ? 'بانتظار تفعيل الكتالوج — سيمنحك المسؤول الوصول من لوحة التحكم'
      : 'Catalog access pending — an admin will enable your access from the dashboard',
    { duration: 5000 },
  );
}
