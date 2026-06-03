export type LanguageCode = 'en' | 'ar';
import { type CatalogProduct, type CatalogSection, getCatalogSections, getAllCatalogProducts } from '@/lib/catalog';
import { CATALOG_CHANGED_EVENT } from '@/lib/catalogEvents';
import { getProductPlaceholderImage } from '@/lib/productPlaceholders';
import { buildBioskinCatalog2026 } from '@/data/bioskinCatalog2026';
import { parseUnitsPerBoxFromPresentation } from '@/lib/productSaleModes';

export type Product = {
  id: number;
  name: { en: string; ar: string };
  subtitle?: { en: string; ar: string };
  summary?: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  rating: number;
  category: 'perfume' | 'spray' | 'apparel' | 'home' | 'powder' | 'incense' | 'oil';
  inStock?: boolean;
  unitsPerBox?: number;
  pricePerUnit?: number;
  sellByBox?: boolean;
  sellByUnit?: boolean;
};

export const serumProducts: Product[] = [
  { id: 1, name: { en: 'BIOSKIN BSK1 — Multipeptides HA', ar: 'بيوسكين BSK1 — متعدد الببتيدات HA' }, description: { en: 'Multi-peptide and hyaluronic acid dermocosmetic vial for hydration and revitalization. 10 mL.', ar: 'فيال ديرموكوسميتيك متعدد الببتيدات مع حمض الهيالورونيك للترطيب وتجديد مظهر البشرة. 10 مل.' }, price: 149, image: getProductPlaceholderImage(1), rating: 5, category: 'perfume' },
  { id: 2, name: { en: 'Hyaluronic Hydra Serum', ar: 'سيروم الهيالورونيك للترطيب' }, description: { en: 'Deep hydration and plumping support for dry skin.', ar: 'ترطيب عميق ودعم امتلاء البشرة الجافة.' }, price: 139, image: getProductPlaceholderImage(2), rating: 5, category: 'perfume' },
  { id: 3, name: { en: 'Niacinamide Control Serum', ar: 'سيروم النياسيناميد للتوازن' }, description: { en: 'Helps reduce excess oil and improve pores appearance.', ar: 'يساعد على تقليل الإفرازات الدهنية وتحسين مظهر المسام.' }, price: 129, image: getProductPlaceholderImage(3), rating: 4, category: 'perfume' },
  { id: 4, name: { en: 'Retinol Renew Serum', ar: 'سيروم الريتينول للتجديد' }, description: { en: 'Night use formula to improve texture and fine lines.', ar: 'تركيبة ليلية لتحسين الملمس والخطوط الرفيعة.' }, price: 169, image: getProductPlaceholderImage(4), rating: 4, category: 'perfume', inStock: false },
];

export const creamProducts: Product[] = [
  { id: 16, name: { en: 'Daily Moisture Cream', ar: 'كريم الترطيب اليومي' }, description: { en: 'Lightweight moisturizer for normal to dry skin.', ar: 'مرطب خفيف للبشرة العادية إلى الجافة.' }, price: 99, image: getProductPlaceholderImage(16), rating: 5, category: 'spray' },
  { id: 17, name: { en: 'Barrier Repair Cream', ar: 'كريم إصلاح الحاجز' }, description: { en: 'Supports skin barrier and reduces irritation signs.', ar: 'يدعم حاجز البشرة ويقلل علامات التهيج.' }, price: 119, image: getProductPlaceholderImage(17), rating: 5, category: 'spray' },
  { id: 18, name: { en: 'Night Renewal Cream', ar: 'كريم التجديد الليلي' }, description: { en: 'Rich overnight care for smoother-looking skin.', ar: 'عناية ليلية غنية لبشرة أكثر نعومة.' }, price: 129, image: getProductPlaceholderImage(18), rating: 4, category: 'spray' },
  { id: 19, name: { en: 'Acne Spot Gel', ar: 'جل موضعي للحبوب' }, description: { en: 'Targeted care for blemish-prone skin.', ar: 'عناية موضعية للبشرة المعرضة للحبوب.' }, price: 89, image: getProductPlaceholderImage(19), rating: 4, category: 'spray' },
];

export const cleanserProducts: Product[] = [
  { id: 27, name: { en: 'Gentle Foam Cleanser', ar: 'غسول رغوي لطيف' }, description: { en: 'Daily cleansing without stripping moisture.', ar: 'تنظيف يومي دون تجفيف البشرة.' }, price: 79, image: getProductPlaceholderImage(27), rating: 5, category: 'apparel' },
  { id: 28, name: { en: 'Salicylic Clean Gel', ar: 'جل منظف بساليسيليك' }, description: { en: 'For oily and acne-prone skin.', ar: 'للبشرة الدهنية والمعرضة للحبوب.' }, price: 89, image: getProductPlaceholderImage(28), rating: 4, category: 'apparel' },
  { id: 29, name: { en: 'Micellar Makeup Remover', ar: 'مزيل مكياج ميسيلار' }, description: { en: 'Removes makeup and impurities gently.', ar: 'يزيل المكياج والشوائب بلطف.' }, price: 69, image: getProductPlaceholderImage(29), rating: 4, category: 'apparel' },
  { id: 30, name: { en: 'Brightening Cleansing Milk', ar: 'حليب تنظيف للتفتيح' }, description: { en: 'Creamy cleanser suitable for sensitive skin.', ar: 'منظف كريمي مناسب للبشرة الحساسة.' }, price: 85, image: getProductPlaceholderImage(30), rating: 4, category: 'apparel' },
];

export const sunscreenProducts: Product[] = [
  { id: 32, name: { en: 'SPF 50 Daily Shield', ar: 'واقي شمس يومي SPF 50' }, description: { en: 'Broad-spectrum sunscreen for daily outdoor use.', ar: 'واقي واسع الطيف للاستخدام اليومي خارج المنزل.' }, price: 109, image: getProductPlaceholderImage(32), rating: 5, category: 'home' },
  { id: 33, name: { en: 'Matte Oil-Free SPF 50', ar: 'واقي شمس مطفي للبشرة الدهنية' }, description: { en: 'Matte finish suitable for oily and combination skin.', ar: 'لمسة مطفية مناسبة للبشرة الدهنية والمختلطة.' }, price: 115, image: getProductPlaceholderImage(33), rating: 4, category: 'home' },
  { id: 34, name: { en: 'Tinted SPF 40', ar: 'واقي شمس ملون SPF 40' }, description: { en: 'Light tint with UV protection for daily wear.', ar: 'تغطية خفيفة مع حماية من الأشعة للاستخدام اليومي.' }, price: 125, image: getProductPlaceholderImage(34), rating: 4, category: 'home' },
  { id: 35, name: { en: 'Sensitive Skin SPF 50+', ar: 'واقي للبشرة الحساسة SPF 50+' }, description: { en: 'Fragrance-free formula for sensitive skin.', ar: 'تركيبة خالية من العطور للبشرة الحساسة.' }, price: 119, image: getProductPlaceholderImage(35), rating: 5, category: 'home' },
];

export const treatmentProducts: Product[] = [
  { id: 40, name: { en: 'Dark Spot Corrector', ar: 'مصحح التصبغات' }, description: { en: 'Targets dark spots and post-acne marks.', ar: 'يستهدف التصبغات وآثار الحبوب.' }, price: 159, image: getProductPlaceholderImage(40), rating: 5, category: 'powder' },
  { id: 41, name: { en: 'Eye Contour Gel', ar: 'جل محيط العين' }, description: { en: 'Helps with puffiness and tired-eye appearance.', ar: 'يساعد على تقليل الانتفاخ ومظهر الإجهاد حول العين.' }, price: 99, image: getProductPlaceholderImage(41), rating: 4, category: 'powder' },
  { id: 42, name: { en: 'Lip Repair Balm', ar: 'بلسم إصلاح الشفاه' }, description: { en: 'Hydrates and repairs dry cracked lips.', ar: 'يرطب ويصلح الشفاه الجافة والمتشققة.' }, price: 45, image: getProductPlaceholderImage(42), rating: 5, category: 'powder' },
];

export const kitsProducts: Product[] = [
  {
    id: 1001,
    name: { en: 'BSK1 MULTIPEPTIDES HA', ar: 'BSK1 MULTIPEPTIDES HA' },
    subtitle: { en: 'Bio-revitalization Solution | 5 x 10 ml', ar: 'حل الإحياء الحيوي للبشرة | 5 × 10 مل' },
    description: {
      en: 'HA Cube 3®, 4 peptides, 14 vitamins, 24 amino acids, 8 minerals and coenzymes are combined for this intensive bio-revitalizing treatment solution that provides immediate and progressive rejuvenation, improving skin vitality, tone and radiance.',
      ar: 'HA Cube 3® وأربعة ببتيدات و14 فيتاميناً و24 حمضاً أمينياً و8 معادن ومُحفّزات إنزيمية في تركيبة هذا الحل العلاجي المكثّف لإحياء البشرة حيوياً؛ يمنح تجديداً فورياً وتدريجياً ويحسّن حيوية البشرة ونسيجها وإشراقها.',
    },
    price: 299,
    image: getProductPlaceholderImage(1001),
    rating: 5,
    category: 'perfume',
  },
  { id: 1002, name: { en: 'Acne Control Kit', ar: 'باقة التحكم بالحبوب' }, description: { en: 'Cleanser + niacinamide + spot gel.', ar: 'غسول + نياسيناميد + جل موضعي.' }, price: 279, image: getProductPlaceholderImage(1002), rating: 5, category: 'perfume' },
  { id: 1003, name: { en: 'Sensitive Care Kit', ar: 'باقة العناية الحساسة' }, description: { en: 'Gentle cleanser + barrier cream + SPF.', ar: 'غسول لطيف + كريم حاجز + واقي شمس.' }, price: 289, image: getProductPlaceholderImage(1003), rating: 4, category: 'perfume' },
];

export const newArrivalProducts: Product[] = [
  { id: 2001, name: { en: 'Peptide Lift Serum', ar: 'سيروم الببتايد لشد البشرة' }, description: { en: 'Advanced peptide support for skin elasticity.', ar: 'دعم متقدم بالببتايد لمرونة البشرة.' }, price: 179, image: getProductPlaceholderImage(2001), rating: 5, category: 'perfume' },
  { id: 2002, name: { en: 'Ceramide Repair Lotion', ar: 'لوشن السيراميد للإصلاح' }, description: { en: 'Body care lotion to reinforce skin barrier.', ar: 'لوشن للجسم يعزز حاجز البشرة.' }, price: 109, image: getProductPlaceholderImage(2002), rating: 4, category: 'spray' },
  { id: 2003, name: { en: 'AHA Gentle Exfoliant', ar: 'مقشر AHA لطيف' }, description: { en: 'Mild exfoliation for smoother and brighter skin.', ar: 'تقشير لطيف لبشرة أنعم وأكثر إشراقاً.' }, price: 119, image: getProductPlaceholderImage(2003), rating: 4, category: 'powder' },
];

export const sections = [
  { id: 'packages', title: { en: 'Treatment Kits', ar: 'باقات علاجية' }, products: kitsProducts },
  { id: 'new-arrivals', title: { en: 'New Arrivals', ar: 'وصل حديثاً' }, products: newArrivalProducts },
  { id: 'perfumes', title: { en: 'Cosmetic Serums', ar: 'سيرومات تجميلية' }, products: serumProducts },
  { id: 'all-over-spray', title: { en: 'Dermaceutical Creams', ar: 'كريمات علاجية تجميلية' }, products: creamProducts },
  { id: 'apparel-mist', title: { en: 'Skin Cleansers', ar: 'منظفات البشرة' }, products: cleanserProducts },
  { id: 'home-linen-mist', title: { en: 'Sun Protection', ar: 'واقيات الشمس' }, products: sunscreenProducts },
  { id: 'scented-body-powder', title: { en: 'Targeted Treatments', ar: 'علاجات موضعية' }, products: treatmentProducts },
].map(s => ({ ...s }));

export type StoreSection = (typeof sections)[number];

function catalogProductToProduct(p: CatalogProduct): Product {
  let unitsPerBox = p.unitsPerBox;
  if (!unitsPerBox || unitsPerBox <= 1) {
    const parsed = parseUnitsPerBoxFromPresentation(p.subtitle?.en || p.subtitle?.ar || '');
    if (parsed && parsed > 1) unitsPerBox = parsed;
  }
  const sellByUnit =
    p.sellByUnit ?? ((unitsPerBox != null && unitsPerBox > 1) || (p.pricePerUnit != null && p.pricePerUnit > 0));

  return {
    id: p.id,
    name: p.name,
    subtitle: p.subtitle,
    summary: p.summary,
    description: p.description,
    price: p.price,
    image: p.image,
    rating: p.rating ?? 4,
    category: p.category,
    inStock: p.inStock,
    unitsPerBox: unitsPerBox && unitsPerBox > 1 ? unitsPerBox : p.unitsPerBox,
    pricePerUnit: p.pricePerUnit,
    sellByBox: p.sellByBox ?? true,
    sellByUnit,
  };
}

export function mapCatalogSectionsToStore(dynamic: CatalogSection[]): StoreSection[] {
  return dynamic.map((sec) => ({
    id: sec.id,
    title: sec.title,
    products: sec.products.map(catalogProductToProduct),
  }));
}

let mergedSectionsCache: StoreSection[] | null = null;

function invalidateMergedSectionsCache() {
  mergedSectionsCache = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener(CATALOG_CHANGED_EVENT, invalidateMergedSectionsCache);
  window.addEventListener('storage', (e) => {
    if (e.key === 'med-catalog') invalidateMergedSectionsCache();
  });
}

function computeMergedSections(): StoreSection[] {
  const dynamic = getCatalogSections();
  if (dynamic.length === 0) {
    return mapCatalogSectionsToStore(buildBioskinCatalog2026());
  }
  return mapCatalogSectionsToStore(dynamic);
}

/** Live catalog for storefront + admin analytics (cached; invalidated on catalog change). */
export function getMergedSections(): StoreSection[] {
  if (mergedSectionsCache) return mergedSectionsCache;
  mergedSectionsCache = computeMergedSections();
  return mergedSectionsCache;
}

export function getSectionIdForProduct(productId: number): string | null {
  const fromMerged = getMergedSections().find((s) => s.products.some((p) => p.id === productId));
  if (fromMerged) return fromMerged.id;
  for (const s of sections) {
    if (s.products.some((p) => p.id === productId)) return s.id;
  }
  const dynamic = getCatalogSections();
  for (const s of dynamic) {
    if (s.products.some((p) => p.id === productId)) return s.id;
  }
  return null;
}

export const getProductById = (id: number): Product | undefined => {
  const fromMerged = getMergedSections()
    .flatMap((s) => s.products)
    .find((p) => p.id === id);
  if (fromMerged) return fromMerged;

  for (const s of sections) {
    const legacy = s.products.find((p) => p.id === id);
    if (legacy) return legacy;
  }

  const fromBase = buildBioskinCatalog2026()
    .flatMap((s) => s.products)
    .find((p) => p.id === id);
  if (fromBase) return catalogProductToProduct(fromBase);

  const dynamic = getAllCatalogProducts().find((p) => p.id === id);
  if (dynamic) return catalogProductToProduct(dynamic);

  return undefined;
};


