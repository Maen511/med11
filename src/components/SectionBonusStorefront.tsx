import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useMergedCatalog } from '@/hooks/useMergedCatalog';
import { CartProductImage } from '@/components/CartProductImage';
import { getCatalogSections } from '@/lib/catalog';
import {
  getSectionBonusTickerMessages,
  isSectionBonusActiveForSection,
  readSectionBonusConfig,
  SECTION_BONUS_CHANGED,
} from '@/lib/sectionBonus';

type Props = {
  language: 'en' | 'ar';
  sectionId: string;
};

type TickerItem = {
  key: string;
  text: string;
  productId: number;
  image: string;
  alt: string;
};

function buildRepeatedItems(base: TickerItem[], repeatCount: number): TickerItem[] {
  if (base.length === 0) return [];
  const out: TickerItem[] = [];
  for (let copy = 0; copy < repeatCount; copy += 1) {
    for (let i = 0; i < base.length; i += 1) {
      const item = base[i];
      out.push({ ...item, key: `${copy}-${i}-${item.key}` });
    }
  }
  return out;
}

function TickerItemRow({ item, isRtl }: { item: TickerItem; isRtl: boolean }) {
  return (
    <span className="bonus-ticker-item inline-flex h-full shrink-0 items-stretch whitespace-nowrap">
      <span className="relative aspect-square h-full shrink-0 overflow-hidden border-border/40 bg-background [border-inline-end-width:1px]">
        <CartProductImage
          productId={item.productId}
          image={item.image}
          alt={item.alt}
          className="h-full w-full object-cover"
        />
      </span>
      <span className="inline-flex h-full min-w-0 items-center gap-2 px-3 text-sm font-medium tracking-tight text-foreground/90 sm:px-4 sm:text-[0.9375rem]">
        <span className="whitespace-nowrap" dir={isRtl ? 'rtl' : 'ltr'}>
          {item.text}
        </span>
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/45" aria-hidden />
      </span>
    </span>
  );
}

const SectionBonusStorefront = ({ language, sectionId }: Props) => {
  const isRtl = language === 'ar';
  const { mergedSections } = useMergedCatalog();
  const [config, setConfig] = useState(() => readSectionBonusConfig());
  const viewportRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLDivElement>(null);
  const [repeatCount, setRepeatCount] = useState(3);

  useEffect(() => {
    const refresh = () => setConfig(readSectionBonusConfig());
    window.addEventListener(SECTION_BONUS_CHANGED, refresh);
    return () => window.removeEventListener(SECTION_BONUS_CHANGED, refresh);
  }, []);

  const sectionProducts = useMemo(() => {
    const fromMerged = mergedSections.find((s) => s.id === sectionId);
    const products = fromMerged?.products ?? getCatalogSections().find((s) => s.id === sectionId)?.products ?? [];
    return products.filter((p) => p.inStock !== false).slice(0, 16);
  }, [mergedSections, sectionId]);

  const isActive = isSectionBonusActiveForSection(sectionId, config) && sectionProducts.length > 0;

  const tickerItems = useMemo((): TickerItem[] => {
    if (!isActive) return [];

    const texts = getSectionBonusTickerMessages(config, language);
    if (texts.length === 0) return [];

    return texts.map((text, i) => {
      const p = sectionProducts[i % sectionProducts.length];
      return {
        key: `${i}-${text}`,
        text,
        productId: p.id,
        image: p.image,
        alt: p.name[language] || p.name.en,
      };
    });
  }, [isActive, sectionProducts, config, language]);

  const loopItems = useMemo(
    () => buildRepeatedItems(tickerItems, repeatCount),
    [tickerItems, repeatCount],
  );

  useLayoutEffect(() => {
    if (tickerItems.length === 0) return;

    const viewport = viewportRef.current;
    const sequence = sequenceRef.current;
    if (!viewport || !sequence) return;

    const syncRepeat = () => {
      const viewportWidth = viewport.clientWidth;
      const sequenceWidth = sequence.getBoundingClientRect().width;
      if (viewportWidth <= 0 || sequenceWidth <= 0) return;

      const minSequenceWidth = viewportWidth + 48;
      const widthPerCopy = sequenceWidth / repeatCount;
      const needed = Math.min(48, Math.max(2, Math.ceil(minSequenceWidth / widthPerCopy) + 1));

      setRepeatCount((prev) => (prev === needed ? prev : needed));
    };

    syncRepeat();
    const observer = new ResizeObserver(syncRepeat);
    observer.observe(viewport);
    observer.observe(sequence);
    window.addEventListener('resize', syncRepeat);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncRepeat);
    };
  }, [tickerItems, repeatCount, language]);

  if (!isActive || tickerItems.length === 0 || loopItems.length === 0) return null;

  const renderSequence = (pass: 'a' | 'b', withRef?: boolean) => (
    <div
      ref={withRef ? sequenceRef : undefined}
      className="bonus-ticker-sequence flex h-full shrink-0 items-stretch"
      aria-hidden={pass === 'b' ? true : undefined}
    >
      {loopItems.map((item) => (
        <TickerItemRow key={`${pass}-${item.key}`} item={item} isRtl={isRtl} />
      ))}
    </div>
  );

  return (
    <div
      className="w-full"
      lang={isRtl ? 'ar' : 'en'}
      role="region"
      aria-label={language === 'ar' ? 'عرض ترويجي' : 'Promotional offer'}
    >
      <div className="w-full overflow-hidden border-t border-border/55 bg-gradient-to-b from-card/95 to-muted/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm dark:from-card/55 dark:to-muted/20">
        <div ref={viewportRef} className="bonus-ticker-viewport relative h-14 overflow-hidden sm:h-16">
          <div
            className={`bonus-ticker-track flex h-full items-stretch ${isRtl ? 'bonus-ticker-track--rtl' : 'bonus-ticker-track--ltr'}`}
          >
            {renderSequence('a', true)}
            {renderSequence('b')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionBonusStorefront;
