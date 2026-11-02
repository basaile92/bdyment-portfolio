<script lang="ts">
  import { LESSON_COUNT } from '../../application';
  import type { GameController } from '../GameController.svelte';
  import UiIcon from './icons/UiIcon.svelte';

  let { game }: { game: GameController } = $props();

  const subtitle = $derived.by(() => {
    const m = game.mode;
    if (game.screen !== 'game') return '';
    if (m.kind === 'level') return game.s.modeLevel(m.index + 1);
    if (m.kind === 'daily') return game.s.modeDaily(m.day.split('-').reverse().slice(0, 2).join('/'));
    if (m.kind === 'lesson') return game.s.modeLesson(m.index + 1, LESSON_COUNT);
    return game.s.modeRun(m.step + 1);
  });

  /** The title lines up with the board's left edge, the buttons mirror it on the right. */
  let edge = $state(12);
  /** Same query as the two-column layout in App.svelte: only there is the bar aligned on the board. */
  const WIDE = '(min-aspect-ratio: 1/1) and (min-width: 760px)';
  function measure() {
    const frame = document.querySelector('.frame');
    if (!frame || !matchMedia(WIDE).matches) {
      edge = 12;
      return;
    }
    edge = Math.max(8, Math.round(frame.getBoundingClientRect().left));
  }
  $effect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    for (const el of document.querySelectorAll('main, main > *, .frame')) observer.observe(el);
    requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  });
</script>

<header class="bar">
  <div class="inner" style="padding-inline: {edge}px">
    {#if game.screen === 'game'}<button class="back" aria-label={game.s.backHome} onclick={() => game.goHome()}><UiIcon name="back" size={24} /></button>{/if}
    <div class="title"><h1>{game.s.title}</h1></div>
    <span class="mode">{subtitle}</span>
    <button class="icon" aria-label={game.s.settingsButton} onclick={() => (game.dialog = 'settings')}><UiIcon name="settings" /></button>
    <button class="icon" aria-label={game.s.helpButton} onclick={() => (game.dialog = 'help')}><UiIcon name="help" /></button>
  </div>
</header>

<style>
  /* Above the thief's column, so the rope always comes out from under the bar. */
  /* On iPhone the bar extends under the status bar / notch, its content stays below it. */
  header { background: var(--bar); position: relative; z-index: 10; padding-top: env(safe-area-inset-top); }
  .inner { display: flex; align-items: center; gap: 6px; padding: 8px 12px; }
  .title { position: relative; }
  h1 { margin: 0; font-family: var(--title-font); font-weight: 400; font-size: 20px; line-height: 1; color: var(--gold); white-space: nowrap; }
  .mode { flex: 1; min-width: 0; font-size: 12px; font-weight: 800; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-left: 4px; }
  .back { flex: none; width: 40px; height: 44px; margin-left: -8px; padding: 0; border: none; background: none; color: #fff; display: flex; align-items: center; justify-content: center; }
  .icon { flex: none; width: 44px; height: 44px; border-radius: 22px; border: 2px solid var(--edge); background: var(--slot); display: flex; align-items: center; justify-content: center; }
  /* Narrow phones: a smaller title leaves room for « Niveau 48 » / « Tutoriel · 4/4 ». */
  @media (max-width: 374px) { h1 { font-size: 16px; } .mode { font-size: 11px; } }
</style>
