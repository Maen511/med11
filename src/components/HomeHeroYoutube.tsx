import { useEffect, useState } from 'react';
import { HOME_HERO_YOUTUBE_ID, homeHeroYoutubeEmbedUrl } from '@/lib/branding';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  className?: string;
};

/**
 * YouTube hero background — full-bleed on mobile (no 100vw overflow), iOS autoplay-safe.
 */
export default function HomeHeroYoutube({ title, className }: Props) {
  const [embedSrc, setEmbedSrc] = useState(() =>
    homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID),
  );

  useEffect(() => {
    setEmbedSrc(homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID, window.location.origin));
  }, []);

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden bg-black [container-type:size]',
        className,
      )}
    >
      <iframe
        className="hero-youtube-iframe pointer-events-none absolute left-1/2 top-1/2 border-0"
        src={embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={false}
        loading="eager"
      />
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden />
    </div>
  );
}
