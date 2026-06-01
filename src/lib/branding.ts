/** Cache-bust URL for `public/page-logo.png` (see `vite.config` + `VITE_LOGO_VERSION`). */
export const LOGO_URL = `/page-logo.png?v=${__LOGO_CACHE__}`;

/** Home hero background — https://www.youtube.com/watch?v=pzZa0IaDV_c */
export const HOME_HERO_YOUTUBE_ID = 'pzZa0IaDV_c';

export function homeHeroYoutubeEmbedUrl(
  videoId = HOME_HERO_YOUTUBE_ID,
  origin?: string,
): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    playsinline: '1',
    loop: '1',
    playlist: videoId,
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    disablekb: '1',
    fs: '0',
    cc_load_policy: '0',
    vq: 'hd1080',
  });
  if (origin) {
    params.set('origin', origin);
    params.set('widget_referrer', origin);
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
