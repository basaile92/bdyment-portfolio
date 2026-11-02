<script lang="ts">
  import type { GameController } from '../GameController.svelte';

  /**
   * Below 320 × 500 px the biggest rooms (9 × 9) get cells under ~22 px and torches under ~14 px:
   * too small to aim. Rather than a broken room, say so plainly.
   * Pure CSS: it appears and disappears as the window is resized.
   */
  let { game }: { game: GameController } = $props();
</script>

{#if game.screen === 'game'}
  <div class="too-small" role="alertdialog" aria-labelledby="too-small-title">
    <div class="card">
      <h2 id="too-small-title">{game.s.tooSmallTitle}</h2>
      <p>{game.s.tooSmallText}</p>
      <button class="btn primary" onclick={() => game.goHome()}>{game.s.backHome}</button>
    </div>
  </div>
{/if}

<style>
  .too-small { display: none; }
  /* Below 320 px wide or 500 px high (iPhone SE with display zoom is 320 × 568; browsers lose ~100 px to their bars). */
  @media (max-width: 319px), (max-height: 499px) {
    .too-small {
      position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 16px;
      background: var(--bg);
    }
  }
  .card { max-width: 340px; text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center; }
  h2 { margin: 0; font-family: var(--title-font); font-weight: 400; font-size: 20px; color: var(--gold); }
  p { margin: 0; font-size: 15px; line-height: 1.4; font-weight: 700; color: var(--ink); }
  .btn { margin-top: 6px; padding: 12px 32px; font-size: 16px; }
</style>
