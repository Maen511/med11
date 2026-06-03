import type { CatalogProduct, CatalogSection } from '@/lib/catalog';
import { getBioskinProductImage } from '@/lib/bioskinProductImages';
import { parseUnitsPerBoxFromPresentation } from '@/lib/productSaleModes';

/** Bump to re-apply price list from PDF across all browsers */
export const BIOSKIN_CATALOG_VERSION = 'bioskin-price-list-2026-v2-images';

type Row = {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  price: number;
  presentationEn: string;
  presentationAr: string;
  indicationEn: string;
  indicationAr: string;
  category: CatalogProduct['category'];
  sectionId: string;
};

const ROWS: Row[] = [
  // —— Professional vial boxes (5 vials) ——
  {
    id: 1,
    code: 'BSK1',
    nameEn: 'MULTIPEPTIDES HA',
    nameAr: 'متعدد الببتيدات HA',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Bio-revitalization solution',
    indicationAr: 'محلول إحياء حيوي للبشرة',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 2,
    code: 'BSK2',
    nameEn: 'FIRMPRO',
    nameAr: 'فيرم برو',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Firming solution',
    indicationAr: 'محلول شد وتقوية',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 3,
    code: 'BSK3',
    nameEn: 'BOTOPEPTIDES',
    nameAr: 'بوتو ببتيدات',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Smoothing wrinkles solution',
    indicationAr: 'محلول تنعيم التجاعيد',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 4,
    code: 'BSK4',
    nameEn: 'REVITALIFTPRO 20',
    nameAr: 'ريفيتالي فت برو 20',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Bio-revitalization & firming solution',
    indicationAr: 'محلول إحياء حيوي وشد',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 5,
    code: 'BSK5',
    nameEn: 'HYALURONIC ACID 3%',
    nameAr: 'حمض الهيالورونيك 3%',
    price: 125,
    presentationEn: '5 vials × 5 ml',
    presentationAr: '5 فيالات × 5 مل',
    indicationEn: 'Hydrating & regeneration solution',
    indicationAr: 'محلول ترطيب وتجديد',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 6,
    code: 'BSK6',
    nameEn: 'PDRN-PRO',
    nameAr: 'PDRN برو',
    price: 125,
    presentationEn: '5 vials × 5 ml',
    presentationAr: '5 فيالات × 5 مل',
    indicationEn: 'Skin repairing solution',
    indicationAr: 'محلول إصلاح البشرة',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 7,
    code: 'BSK7',
    nameEn: 'BRIGHTPRO',
    nameAr: 'برايت برو',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Revitalization & lightening solution',
    indicationAr: 'محلول تجديد وتفتيح',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 8,
    code: 'BSK8',
    nameEn: 'SCARPRO',
    nameAr: 'سكار برو',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Restorative solution',
    indicationAr: 'محلول ترميمي',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 9,
    code: 'BSK9',
    nameEn: 'HAIRPRO EXOSOME',
    nameAr: 'هير برو إكسوزوم',
    price: 175,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Hair revitalizing solution',
    indicationAr: 'محلول تجديد الشعر',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 10,
    code: 'BSK10',
    nameEn: 'LIPOPRO',
    nameAr: 'ليبو برو',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Reducing lipolytic solution',
    indicationAr: 'محلول تقليل الدهون',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 13,
    code: 'BSK13',
    nameEn: 'AGEPRO',
    nameAr: 'إيج برو',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Aging smoothing solution',
    indicationAr: 'محلول تنعيم علامات التقدّم بالعمر',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 14,
    code: 'BSK14',
    nameEn: 'TRANEX PRO',
    nameAr: 'ترانكس برو',
    price: 125,
    presentationEn: '5 vials × 5 ml',
    presentationAr: '5 فيالات × 5 مل',
    indicationEn: 'Depigmenting solution',
    indicationAr: 'محلول تفتيح التصبغات',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 29,
    code: 'BSK29',
    nameEn: 'BIOPLAX PRO',
    nameAr: 'بيو بلكس برو',
    price: 125,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'DNA revitalizing solution',
    indicationAr: 'محلول تجديد الحمض النووي',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 31,
    code: 'BSK31',
    nameEn: 'LIPS SHINE PRO',
    nameAr: 'ليبس شاين برو',
    price: 125,
    presentationEn: '5 vials × 5 ml',
    presentationAr: '5 فيالات × 5 مل',
    indicationEn: 'Lips treatment',
    indicationAr: 'علاج الشفاه',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 32,
    code: 'BSK32',
    nameEn: 'EYE PRO CONTOUR',
    nameAr: 'آي برو كونتور',
    price: 75,
    presentationEn: '2 vials × 3 ml',
    presentationAr: '2 فيال × 3 مل',
    indicationEn: 'Reduces eye bags, dark circles & expression wrinkles',
    indicationAr: 'يقلّل انتفاخ العين والهالات والتجاعيد التعبيرية',
    category: 'powder',
    sectionId: 'professional-vials',
  },
  {
    id: 36,
    code: 'BSK36',
    nameEn: 'COLLAGEN WITH AMBER',
    nameAr: 'كولاجين مع العنبر',
    price: 175,
    presentationEn: '5 vials × 5 ml',
    presentationAr: '5 فيالات × 5 مل',
    indicationEn: 'Fights signs of aging',
    indicationAr: 'محاربة علامات التقدّم بالعمر',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  {
    id: 37,
    code: 'BSK37',
    nameEn: 'BOOSTER PRO EXOSOMES',
    nameAr: 'بوستر برو إكسوزوم',
    price: 200,
    presentationEn: '5 vials × 10 ml',
    presentationAr: '5 فيالات × 10 مل',
    indicationEn: 'Booster effect',
    indicationAr: 'تأثير معزّز للبشرة',
    category: 'perfume',
    sectionId: 'professional-vials',
  },
  // —— Daily skincare ——
  {
    id: 76,
    code: 'BSK76',
    nameEn: 'TRANEX PRO SERUM',
    nameAr: 'سيروم ترانكس برو',
    price: 40,
    presentationEn: '30 ml',
    presentationAr: '30 مل',
    indicationEn: 'Daily-use whitening serum',
    indicationAr: 'سيروم تفتيح للاستخدام اليومي',
    category: 'perfume',
    sectionId: 'daily-skincare',
  },
  {
    id: 79,
    code: 'BSK79',
    nameEn: 'SUNBLOCK CREAM SPF50+',
    nameAr: 'كريم واقي شمس SPF50+',
    price: 33,
    presentationEn: '50 ml',
    presentationAr: '50 مل',
    indicationEn: 'High-protection sunblock cream SPF50+',
    indicationAr: 'كريم واقي شمس بحماية عالية SPF50+',
    category: 'home',
    sectionId: 'daily-skincare',
  },
  {
    id: 91,
    code: 'BSK91',
    nameEn: 'CLEANSING MILK',
    nameAr: 'حليب تنظيف',
    price: 40,
    presentationEn: '400 ml',
    presentationAr: '400 مل',
    indicationEn: 'Gentle cleansing milk for daily facial care',
    indicationAr: 'حليب تنظيف لطيف للعناية اليومية بالوجه',
    category: 'apparel',
    sectionId: 'daily-skincare',
  },
  {
    id: 92,
    code: 'BSK92',
    nameEn: 'AHA TONIC',
    nameAr: 'تونيك AHA',
    price: 40,
    presentationEn: '400 ml',
    presentationAr: '400 مل',
    indicationEn: 'AHA tonic for exfoliation and skin renewal',
    indicationAr: 'تونيك أحماض فواكه للتقشير وتجديد البشرة',
    category: 'apparel',
    sectionId: 'daily-skincare',
  },
  // —— Peel Pro ——
  {
    id: 87,
    code: 'BSK87',
    nameEn: 'PEELPRO BRIGHTENING',
    nameAr: 'بيل برو تفتيح',
    price: 40,
    presentationEn: '50 ml',
    presentationAr: '50 مل',
    indicationEn: 'Fruit acid peeling with alpha hydroxy acids',
    indicationAr: 'تقشير أحماض الفواكه (ألفا هيدروكسي)',
    category: 'powder',
    sectionId: 'peel-pro',
  },
  {
    id: 83,
    code: 'BSK83',
    nameEn: 'PEELPRO CLEAR',
    nameAr: 'بيل برو كلير',
    price: 40,
    presentationEn: '50 ml',
    presentationAr: '50 مل',
    indicationEn: 'Fruit acid peeling with AHA and salicylic acid',
    indicationAr: 'تقشير أحماض الفواكه مع ساليسيليك',
    category: 'powder',
    sectionId: 'peel-pro',
  },
  {
    id: 80,
    code: 'BSK80',
    nameEn: 'PEELPRO HARD',
    nameAr: 'بيل برو هارد',
    price: 40,
    presentationEn: '50 ml',
    presentationAr: '50 مل',
    indicationEn: 'Intensive fruit acid peeling with alpha hydroxy acids',
    indicationAr: 'تقشير مكثّف بأحماض الفواكه',
    category: 'powder',
    sectionId: 'peel-pro',
  },
  // —— Ampoule solutions (10 ampoules) ——
  {
    id: 17,
    code: 'BSK17',
    nameEn: 'DMAE 3%',
    nameAr: 'DMAE 3%',
    price: 50,
    presentationEn: '10 ampoules × 5 ml',
    presentationAr: '10 أمبولات × 5 مل',
    indicationEn: 'Firming solution',
    indicationAr: 'محلول شد',
    category: 'perfume',
    sectionId: 'ampoule-solutions',
  },
  {
    id: 18,
    code: 'BSK18',
    nameEn: 'HYALURONIC ACID 1%',
    nameAr: 'حمض الهيالورونيك 1%',
    price: 75,
    presentationEn: '10 ampoules × 5 ml',
    presentationAr: '10 أمبولات × 5 مل',
    indicationEn: 'Hydrating & regenerating solution',
    indicationAr: 'محلول ترطيب وتجديد',
    category: 'perfume',
    sectionId: 'ampoule-solutions',
  },
  {
    id: 19,
    code: 'BSK19',
    nameEn: 'L-CARNITINE',
    nameAr: 'إل-كارنيتين',
    price: 50,
    presentationEn: '10 ampoules × 5 ml',
    presentationAr: '10 أمبولات × 5 مل',
    indicationEn: 'Reducing solution',
    indicationAr: 'محلول تقليل الدهون',
    category: 'perfume',
    sectionId: 'ampoule-solutions',
  },
  {
    id: 21,
    code: 'BSK21',
    nameEn: 'PHOSPHATIDYLCHOLINE',
    nameAr: 'فوسفاتيديل كولين',
    price: 75,
    presentationEn: '10 ampoules × 5 ml',
    presentationAr: '10 أمبولات × 5 مل',
    indicationEn: 'Lipolytic solution',
    indicationAr: 'محلول إذابة الدهون',
    category: 'perfume',
    sectionId: 'ampoule-solutions',
  },
  {
    id: 22,
    code: 'BSK22',
    nameEn: 'SILANOL 1%',
    nameAr: 'سيلانول 1%',
    price: 50,
    presentationEn: '10 ampoules × 5 ml',
    presentationAr: '10 أمبولات × 5 مل',
    indicationEn: 'Bioactive solution',
    indicationAr: 'محلول حيوي نشط',
    category: 'perfume',
    sectionId: 'ampoule-solutions',
  },
  {
    id: 24,
    code: 'BSK24',
    nameEn: 'VITAMIN C 20%',
    nameAr: 'فيتامين سي 20%',
    price: 50,
    presentationEn: '10 ampoules × 5 ml',
    presentationAr: '10 أمبولات × 5 مل',
    indicationEn: 'Aging & shine solution',
    indicationAr: 'محلول مضاد للتقدّم ولإشراق البشرة',
    category: 'perfume',
    sectionId: 'ampoule-solutions',
  },
];

const SECTION_META: Record<string, { en: string; ar: string }> = {
  'professional-vials': {
    en: 'Professional Vial Solutions',
    ar: 'حلول الفيال الاحترافية',
  },
  'ampoule-solutions': {
    en: 'Ampoule Treatments',
    ar: 'أمبولات علاجية',
  },
  'daily-skincare': {
    en: 'Daily Skincare',
    ar: 'العناية اليومية',
  },
  'peel-pro': {
    en: 'Peel Pro',
    ar: 'تقشير Peel Pro',
  },
};

const SECTION_ORDER = ['professional-vials', 'ampoule-solutions', 'daily-skincare', 'peel-pro'] as const;

function rowToProduct(row: Row): CatalogProduct {
  const titleEn = `${row.code} — ${row.nameEn}`;
  const titleAr = `${row.code} — ${row.nameAr}`;
  const unitsPerBox = parseUnitsPerBoxFromPresentation(row.presentationEn);
  const descEn =
    unitsPerBox && unitsPerBox > 1
      ? `${row.indicationEn}. ${row.presentationEn}. Box or per-unit pricing (JOD).`
      : `${row.indicationEn}. ${row.presentationEn}. Price (JOD).`;
  const descAr =
    unitsPerBox && unitsPerBox > 1
      ? `${row.indicationAr}. ${row.presentationAr}. بالعلبة أو بالحبة (دينار أردني).`
      : `${row.indicationAr}. ${row.presentationAr}. السعر (دينار أردني).`;

  return {
    id: row.id,
    name: { en: titleEn, ar: titleAr },
    subtitle: { en: row.presentationEn, ar: row.presentationAr },
    summary: { en: row.indicationEn, ar: row.indicationAr },
    description: { en: descEn, ar: descAr },
    price: row.price,
    image: getBioskinProductImage(row.code),
    rating: 5,
    category: row.category,
    stockCount: 20,
    inStock: true,
    volumeMl: parseVolumeMl(row.presentationEn),
    unitsPerBox: unitsPerBox && unitsPerBox > 1 ? unitsPerBox : undefined,
    sellByBox: true,
    sellByUnit: unitsPerBox !== undefined && unitsPerBox > 1,
  };
}

function parseVolumeMl(presentation: string): number | undefined {
  const m = presentation.match(/(\d+)\s*ml/i);
  return m ? Number(m[1]) : undefined;
}

export function buildBioskinCatalog2026(): CatalogSection[] {
  const bySection = new Map<string, CatalogProduct[]>();
  for (const row of ROWS) {
    const list = bySection.get(row.sectionId) ?? [];
    list.push(rowToProduct(row));
    bySection.set(row.sectionId, list);
  }

  return SECTION_ORDER.filter((id) => bySection.has(id)).map((id) => ({
    id,
    title: SECTION_META[id],
    products: bySection.get(id) ?? [],
  }));
}
