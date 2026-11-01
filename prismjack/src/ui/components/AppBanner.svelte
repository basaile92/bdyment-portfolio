<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import { squirclePath } from '../presenters/squircle';

  /** "Get the iPhone app", on the home menu of the web version opened on an iPhone; can be closed for good. */
  let { game }: { game: GameController } = $props();
  const KEY = 'prismjack.appBannerClosed';
  let closed = $state(read());
  let width = $state(0);
  let height = $state(0);
  const ICON = 56;
  /** iOS app icon: continuous corners, radius 22.37 % of the size. */
  const iconClip = `path('${squirclePath(ICON, ICON, ICON * 0.2237)}')`;

  function read(): boolean {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  }

  function close() {
    closed = true;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // private browsing: closed for this visit only
    }
  }
</script>

{#if game.appStoreUrl && !closed}
  <aside class="pill" bind:clientWidth={width} bind:clientHeight={height}>
    <svg class="shape" width={width} height={height} aria-hidden="true"><path d={squirclePath(width, height, 999)} /></svg>
    <img src="./icon-192.png" alt="" style:clip-path={iconClip} />
    <span class="text">
      <strong>Prismjack</strong>
      <small>{game.s.home.appStore}</small>
    </span>
    <a class="get" href={game.appStoreUrl} target="_blank" rel="noopener">{game.s.home.appGet}</a>
    <button class="close" aria-label={game.s.home.appClose} onclick={close}>
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
    </button>
  </aside>
{/if}

<style>
  /* An iOS-style floating capsule (light glass material, app icon, blue "Get"); it sits at the top of the
     home menu, then stays on top when scrolling. Light on the dark game so it stands out. */
  .pill {
    position: sticky; z-index: 35; top: calc(10px + env(safe-area-inset-top)); flex: none;
    width: min(100%, 440px);
    display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 12px;
    padding: 10px 16px 10px 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif; color: #1d1d1f;
    animation: drop 0.6s cubic-bezier(0.2, 0.9, 0.25, 1.1) 0.4s both;
  }
  @keyframes drop { from { opacity: 0; transform: translateY(-120%) scale(0.96); } }
  /* The capsule itself: an iOS continuous-corner shape drawn behind the content (CSS radii are circular). */
  .shape { position: absolute; inset: 0; z-index: -1; overflow: visible; filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.35)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15)); }
  .shape path { fill: #f5f5f7; }
  .pill > :not(.shape) { position: relative; }
  img { width: 56px; height: 56px; display: block; }
  .text { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; gap: 2px; }
  strong { font-size: 17px; font-weight: 600; letter-spacing: -0.4px; }
  small { font-size: 13px; color: #6e6e73; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.1px; }
  .get {
    padding: 8px 18px; border-radius: 999px; background: #007aff; color: #fff;
    font-size: 15px; font-weight: 700; text-decoration: none; letter-spacing: -0.2px;
  }
  .close { width: 28px; height: 28px; padding: 0; border: none; border-radius: 50%; background: rgba(118, 118, 128, 0.16); color: #6e6e73; display: grid; place-items: center; }
  @media (prefers-color-scheme: dark) {
    .pill { color: #fff; }
    .shape path { fill: #2c2c2e; }
    small { color: #98989d; }
    .get { background: #0a84ff; }
    .close { background: rgba(118, 118, 128, 0.32); color: #aeaeb2; }
  }
  @media (prefers-reduced-motion: reduce) { .pill { animation: none; } }
</style>
