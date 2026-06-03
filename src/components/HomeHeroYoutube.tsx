import { useEffect, useRef, useState } from 'react';
import { HOME_HERO_YOUTUBE_ID, homeHeroYoutubeEmbedUrl } from '@/lib/branding';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  className?: string;
};

const CHROME_HIDE_MS = 900;

/** YouTube hero — full width, masks skip/stop UI, mobile-safe. */
export default function HomeHeroYoutube({ title, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [embedSrc, setEmbedSrc] = useState(() =>
    homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEmbedSrc(homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID, window.location.origin));
  }, []);

  const onIframeLoad = () => {
    window.setTimeout(() => setReady(true), CHROME_HIDE_MS);
  };

  return (
    <div className={cn('hero-youtube-root absolute inset-0 isolate overflow-hidden bg-black', className)}>
      <iframe
        ref={iframeRef}
        className={cn(
          'hero-youtube-iframe pointer-events-none absolute left-1/2 top-1/2 border-0 transition-opacity duration-500',
          ready ? 'opacity-100' : 'opacity-0',
        )}
        src={embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={false}
        loading="eager"
        onLoad={onIframeLoad}
      />
      {/* Block taps; crop YouTube title + transport (stop / skip / back) */}
      <div className="hero-youtube-chrome" aria-hidden>
        <div className="hero-youtube-chrome__edge hero-youtube-chrome__edge--top" />
        <div className="hero-youtube-chrome__edge hero-youtube-chrome__edge--bottom" />
      </div>
    </div>
  );
}
