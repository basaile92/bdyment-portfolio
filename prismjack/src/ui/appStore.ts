/**
 * Where to get the iPhone app, offered only to people playing the web version on an iPhone or iPad.
 * The App Store id comes from VITE_APP_STORE_ID at build time; without it, nothing is offered.
 */
export function appStoreUrl(id: string | undefined, native: boolean, nav: { userAgent: string; maxTouchPoints: number }): string | null {
  if (!id || native) return null;
  const ios = /iPhone|iPad|iPod/.test(nav.userAgent) || (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1);
  return ios ? `https://apps.apple.com/app/id${id}` : null;
}
