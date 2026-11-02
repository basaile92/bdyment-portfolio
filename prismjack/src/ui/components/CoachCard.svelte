<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import { portSide } from '../../domain';
  import Rich from './Rich.svelte';

  /**
   * Playable tutorial: what to do now, and why the last result looked the way it did. Stays until the step is done.
   * Every line of the lesson sits in the same grid cell, all but the current one invisible: the card takes the height
   * of the lesson's longest line, so the board never resizes from one step to the next, and no taller than that.
   */
  let { game }: { game: GameController } = $props();
  const current = $derived(game.coachText);
  /** « the blinking torch » is only visual: screen readers hear which one it is. */
  const torch = $derived.by(() => {
    const port = game.coachPort;
    if (port === null) return '';
    const { side, index } = portSide(game.prismjack.puzzle.board, port);
    return game.s.emitterAt(index + 1, side);
  });
</script>

{#if game.mode.kind === 'lesson' && current}
  <aside class="coach">
    <div class="lines">
      {#each game.coachLines as line, i (i)}<p class="text" aria-hidden="true"><Rich text={line} /></p>{/each}
      {#key current}<p class="text now" aria-live="polite"><Rich text={current} />{#if torch}<span class="sr-only"> ({torch})</span>{/if}</p>{/key}
    </div>
    <div class="foot">
      {#if game.coachNote}<p class="note" role="status"><Rich text={game.coachNote} /></p>
      {:else if game.nudged}<p class="note"><Rich text={game.s.lessonNudge} /></p>{/if}
      {#if !game.over && game.dive === 'none'}<button class="skip" onclick={() => game.start({ kind: 'level', index: 0 })}>{game.s.lessonSkip}</button>{/if}
    </div>
  </aside>
{/if}

<style>
  .coach {
    display: flex; flex-direction: column; gap: 4px; padding: 10px 14px 6px; border-radius: 16px;
    background: #fff; color: #1b1745; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); border: 2px solid var(--gold);
  }
  .lines { display: grid; }
  .text { grid-area: 1 / 1; margin: 0; font-size: 15px; line-height: 1.38; font-weight: 700; visibility: hidden; }
  .text.now { visibility: visible; animation: appear 0.35s ease-out; }
  .text :global(b), .text :global(strong) { color: #1b1745; font-weight: 900; }
  /* Fixed height: the note shares its line with the skip link. */
  .foot { display: flex; align-items: center; gap: 8px; min-height: 30px; }
  .note { margin: 0; font-size: 13px; line-height: 1.25; font-weight: 800; color: #c2185b; }
  .note :global(b) { color: inherit; font-weight: 900; }
  .skip {
    margin-left: auto; flex-shrink: 0; min-height: 44px; margin-block: -7px; padding: 0 4px; border: none; background: none;
    font-size: 12px; font-weight: 800; color: #6b6f9a; text-decoration: underline;
  }
  @media (max-height: 700px) { .text { font-size: 14px; line-height: 1.32; } }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  @keyframes appear { from { opacity: 0; transform: translateY(4px); } }
  @media (prefers-reduced-motion: reduce) { .text.now { animation: none; } }
</style>
