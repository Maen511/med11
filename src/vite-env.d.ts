/// <reference types="vite/client" />
/// <reference types="@types/google.maps" />

declare const __LOGO_CACHE__: string;

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_ADMIN_USERNAME?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_CATALOG_ACCESS_CODE?: string;
  readonly VITE_LOGO_VERSION?: string;
  readonly VITE_BANK_NAME?: string;
  readonly VITE_BANK_BENEFICIARY?: string;
  readonly VITE_BANK_IBAN?: string;
  readonly VITE_BANK_SWIFT?: string;
  readonly VITE_BANK_CURRENCY?: string;
  readonly VITE_PAYMENT_CONTACT_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
