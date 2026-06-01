import type { LucideIcon } from 'lucide-react';
import { FlaskConical, Gift, ShieldCheck, Sparkle, Sparkles, Stethoscope, Sun } from 'lucide-react';

export type CategoryNavItem = {
  id: string;
  icon: LucideIcon;
  label: { en: string; ar: string };
};

const SECTION_ICON_MAP: Record<string, LucideIcon> = {
  packages: Gift,
  'new-arrivals': Sparkle,
  perfumes: FlaskConical,
  'all-over-spray': ShieldCheck,
  'apparel-mist': Sparkles,
  'home-linen-mist': Sun,
  'scented-body-powder': Stethoscope,
  'professional-vials': FlaskConical,
  'ampoule-solutions': Stethoscope,
  'daily-skincare': Sparkles,
  'peel-pro': ShieldCheck,
};

/** Default labels for built-in section ids (fallback if title missing) */
const SECTION_LABEL_FALLBACK: Record<string, { en: string; ar: string }> = {
  packages: { en: 'Treatment Kits', ar: 'باقات علاجية' },
  'new-arrivals': { en: 'New Arrivals', ar: 'وصل حديثاً' },
  perfumes: { en: 'Cosmetic Serums', ar: 'سيرومات تجميلية' },
  'all-over-spray': { en: 'Dermaceutical Creams', ar: 'كريمات علاجية تجميلية' },
  'apparel-mist': { en: 'Skin Cleansers', ar: 'منظفات البشرة' },
  'home-linen-mist': { en: 'Sun Protection', ar: 'واقيات الشمس' },
  'scented-body-powder': { en: 'Targeted Treatments', ar: 'علاجات موضعية' },
};

export function buildCategoryNavItems(
  sections: Array<{ id: string; title: { en: string; ar: string } }>,
): CategoryNavItem[] {
  return sections.map((s) => ({
    id: s.id,
    icon: SECTION_ICON_MAP[s.id] ?? Sparkles,
    label: s.title?.en && s.title?.ar ? s.title : (SECTION_LABEL_FALLBACK[s.id] ?? { en: s.id, ar: s.id }),
  }));
}
