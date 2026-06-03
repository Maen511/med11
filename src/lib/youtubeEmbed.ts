export type YoutubeEmbedCommand = 'playVideo' | 'pauseVideo' | 'mute';

/** Control an embedded YouTube player (`enablejsapi=1` required). */
export function postYoutubeEmbedCommand(
  iframe: HTMLIFrameElement | null,
  command: YoutubeEmbedCommand,
): void {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'command', func: command, args: '' }),
    '*',
  );
}
