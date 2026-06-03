import { useCallback, useEffect, useRef, useState } from 'react';
import { HOME_HERO_YOUTUBE_ID, homeHeroYoutubeEmbedUrl } from '@/lib/branding';
import { postYoutubeEmbedCommand } from '@/lib/youtubeEmbed';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  className?: string;
};

const CHROME_HIDE_MS = 900;
const MOBILE_GESTURE_HINT_MS = 2200;
const MOBILE_MQ = '(max-width: 639px)';

function embedOrigin(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.origin;
}

function isMobileHero(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_MQ).matches;
}

/** YouTube hero — full width, masks skip/stop UI, mobile-safe playback. */
export default function HomeHeroYoutube({ title, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const gestureDoneRef = useRef(false);
  const [embedSrc] = useState(() => homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID, embedOrigin()));
  const [ready, setReady] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);

  const play = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    postYoutubeEmbedCommand(iframe, 'mute');
    postYoutubeEmbedCommand(iframe, 'playVideo');
  }, []);

  const armGestureIfNeeded = useCallback(() => {
    if (gestureDoneRef.current || !isMobileHero()) return;
    setNeedsGesture(true);
  }, []);

  const onMobileActivate = useCallback(() => {
    gestureDoneRef.current = true;
    setNeedsGesture(false);
    play();
  }, [play]);

  const onIframeLoad = () => {
    window.setTimeout(() => {
      setReady(true);
      play();
      if (isMobileHero()) {
        window.setTimeout(armGestureIfNeeded, MOBILE_GESTURE_HINT_MS);
      }
    }, CHROME_HIDE_MS);
  };

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) play();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) play();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);

    const root = rootRef.current;
    let observer: IntersectionObserver | undefined;
    if (root) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) play();
        },
        { threshold: 0.12 },
      );
      observer.observe(root);
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
      observer?.disconnect();
    };
  }, [play]);

  return (
    <div
      ref={rootRef}
      className={cn('hero-youtube-root absolute inset-0 isolate overflow-hidden bg-black', className)}
    >
      <iframe
        ref={iframeRef}
        className={cn(
          'hero-youtube-iframe pointer-events-none absolute left-1/2 top-1/2 border-0 transition-opacity duration-500',
          ready ? 'opacity-100' : 'opacity-0',
        )}
        src={embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={false}
        loading="eager"
        onLoad={onIframeLoad}
      />
      {needsGesture ? (
        <button
          type="button"
          className="hero-youtube-mobile-play absolute inset-0 z-[1] sm:hidden"
          aria-label={title}
          onPointerDown={(e) => {
            e.preventDefault();
            onMobileActivate();
          }}
        />
      ) : null}
      {/* Block taps; crop YouTube title + transport (stop / skip / back) */}
      <div className="hero-youtube-chrome" aria-hidden>
        <div className="hero-youtube-chrome__edge hero-youtube-chrome__edge--top" />
        <div className="hero-youtube-chrome__edge hero-youtube-chrome__edge--bottom" />
      </div>
    </div>
  );
}
