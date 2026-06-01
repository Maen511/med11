import { HOME_HERO_VIDEO_URL } from '@/lib/branding';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

/** Full-bleed hero video — edge-to-edge width, cover height. */
export default function HomeHeroVideo({ className }: Props) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-black', className)}>
      <video
        className="pointer-events-none absolute inset-0 h-full w-full border-0 object-cover object-center"
        src={HOME_HERO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback"
        aria-hidden
        tabIndex={-1}
      />
    </div>
  );
}
