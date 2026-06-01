import { useEffect, useState } from 'react';
import { HOME_HERO_YOUTUBE_ID, homeHeroYoutubeEmbedUrl } from '@/lib/branding';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  className?: string;
};

/** YouTube hero — clipped to parent; never expands document width on mobile. */
export default function HomeHeroYoutube({ title, className }: Props) {
  const [embedSrc, setEmbedSrc] = useState(() =>
    homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID),
  );

  useEffect(() => {
    setEmbedSrc(homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID, window.location.origin));
  }, []);

  return (
    <div className={cn('absolute inset-0 isolate overflow-hidden bg-black', className)}>
      <iframe
        className="hero-youtube-iframe pointer-events-none absolute left-1/2 top-1/2 border-0"
        src={embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={false}
        loading="eager"
      />
    </div>
  );
}
