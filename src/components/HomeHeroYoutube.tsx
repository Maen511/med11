import { HOME_HERO_YOUTUBE_ID, homeHeroYoutubeEmbedUrl } from '@/lib/branding';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  className?: string;
};

const embedSrc =
  typeof window !== 'undefined'
    ? homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID, window.location.origin)
    : homeHeroYoutubeEmbedUrl(HOME_HERO_YOUTUBE_ID);

/** Full-bleed YouTube hero — works on static hosting (no local MP4 required). */
export default function HomeHeroYoutube({ title, className }: Props) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-black', className)}>
      <iframe
        className="pointer-events-none absolute left-1/2 top-1/2 min-h-full min-w-full border-0 opacity-100"
        style={{
          width: '100vw',
          height: '56.25vw',
          minHeight: '100vh',
          minWidth: '177.78vh',
          transform: 'translate(-50%, -50%)',
        }}
        src={embedSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={false}
      />
      <div
        className="absolute inset-0 z-[1] touch-none"
        aria-hidden
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
