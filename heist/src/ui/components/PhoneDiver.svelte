<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import Thief from './icons/Thief.svelte';

  /**
   * Phones have no room for the thief, so he stays out of sight behind the top bar.
   * On GO he comes out from under the bar in the middle of the screen, drops below the window
   * and climbs back (or escapes with the loot), exactly like on bigger screens.
   */
  let { game }: { game: GameController } = $props();

  let barBottom = $state(56);
  $effect(() => {
    const measure = () => (barBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 56);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  });
</script>

<div class="diver" class:enter={game.dive === 'enter'} class:down={game.dive === 'down'} class:up={game.dive === 'up'} class:escape={game.dive === 'escape'} style="top: {barBottom}px" aria-hidden="true">
  <div class="rope"></div>
  <Thief upsideDown size={60} mood={game.mood} />
</div>

<style>
  /* Only phones in portrait, where the thief is otherwise hidden (see ThiefScene). */
  .diver { display: none; }
  @media (max-width: 599px) and (max-aspect-ratio: 1/1) {
    .diver {
      display: block; position: fixed; z-index: 8; left: 50%; width: 60px; margin-left: -30px; pointer-events: none;
      /* Resting place: just above the bar's edge, hidden behind it. */
      transform: translateY(-100%); transition: transform 0.7s cubic-bezier(0.2, 0.9, 0.3, 1);
    }
    /* First into view below the bar, a short pause (handled by the controller), then all the way down. */
    .enter { transform: translateY(70px); transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2); }
    .down { transform: translateY(110vh); transition: transform 0.9s cubic-bezier(0.5, 0, 0.9, 0.5); }
    .up { transition-duration: 0.9s; }
    .escape { transition: transform 1.1s cubic-bezier(0.3, 0, 0.6, 1); }
  }
  /* A long rope above the thief: its top always stays hidden behind the bar, so it seems to pay out from there. */
  .rope {
    position: absolute; left: calc(50% - 2.5px); bottom: calc(100% - 14px); width: 5px; border-radius: 2px;
    height: 220vh;
    background:
      linear-gradient(90deg, rgba(40, 24, 8, 0.45), transparent 35%, rgba(255, 245, 220, 0.25) 50%, transparent 65%, rgba(40, 24, 8, 0.5)),
      repeating-linear-gradient(-58deg, #e6d3a6 0 2px, #c9a86f 2px 3.5px, #a8854f 3.5px 4.5px, #d8bf8a 4.5px 6px);
  }
</style>
