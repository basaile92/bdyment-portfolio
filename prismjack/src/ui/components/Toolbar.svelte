<script lang="ts">
  import { JEWEL_COLORS } from '../../domain';
  import type { GameController } from '../GameController.svelte';
  import { GLYPH, JEWEL_HEX } from '../presenters/palette';
  import Glyph from './Glyph.svelte';
  import GemIcon from './icons/GemIcon.svelte';
  import ToolIcon from './icons/ToolIcon.svelte';
  import UiIcon from './icons/UiIcon.svelte';

  let { game }: { game: GameController } = $props();

  const canUndo = $derived(game.history.past.length > 0 && !game.over);
  const canRedo = $derived(game.history.future.length > 0 && !game.over);
  const hasPlan = $derived((game.prismjack.plan.size > 0 || game.prismjack.emptyCells.size > 0) && !game.over);
</script>

<footer class="bar">
  <div class="inner">
    <div class="line">
      <button class="tool" class:on={game.tool === 'trace'} aria-pressed={game.tool === 'trace'} onclick={() => (game.tool = 'trace')}>
        <ToolIcon kind="trace" color={JEWEL_HEX[game.color]} /><span>{game.s.trace}</span>
      </button>
      <button class="tool" class:on={game.tool === 'empty'} aria-pressed={game.tool === 'empty'} onclick={() => (game.tool = 'empty')}>
        <ToolIcon kind="empty" color="" /><span>{game.s.empty}</span>
      </button>
      <button class="icon" aria-label={game.s.undo} disabled={!canUndo} onclick={() => game.undo()}><UiIcon name="undo" /></button>
      <button class="icon" aria-label={game.s.redo} disabled={!canRedo} onclick={() => game.redo()}><UiIcon name="redo" /></button>
      <button class="icon" aria-label={game.s.clearPlan} disabled={!hasPlan} onclick={() => game.requestClear()}><UiIcon name="trash" /></button>
    </div>
    <div class="line">
      <div class="gems" role="radiogroup" aria-label={game.s.jewelColorGroup}>
        {#each JEWEL_COLORS as color (color)}
          <button
            class="gem"
            class:on={game.color === color && game.tool === 'trace'}
            role="radio"
            aria-checked={game.color === color}
            aria-label={game.s.jewelNamed(game.s.colors[color])}
            onclick={() => game.pickColor(color)}
          >
            <GemIcon color={JEWEL_HEX[color]} size={26} />
            {#if game.symbols}<svg viewBox="0 0 1 1" width="11" height="11" aria-hidden="true"><Glyph glyph={GLYPH[color]} x={0.5} y={0.5} size={0.9} fill="#dbe1ff" /></svg>{/if}
          </button>
        {/each}
      </div>
      {#if game.over}
        <button class="go next" onclick={() => game.continueAfter()}>{game.continueLabel}</button>
      {:else}
        <button class="go" onclick={() => game.requestSubmit()}>{game.s.go}<small>{game.s.goSub}</small></button>
      {/if}
    </div>
  </div>
</footer>

<style>
  footer { background: var(--bar); }
  .inner { max-width: var(--max); margin: 0 auto; display: flex; flex-direction: column; gap: 8px; padding: 10px 12px calc(12px + env(safe-area-inset-bottom)); }
  .line { display: flex; gap: 8px; align-items: stretch; }
  .tool {
    flex: 1; min-width: 0; height: 48px; border-radius: 24px; border: 2px solid var(--edge); background: var(--slot);
    display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; font-weight: 900;
  }
  .tool.on { border: 3px solid var(--gold); background: var(--slot-on); }
  .tool :global(svg), .gem :global(svg) { flex: none; }
  .icon { flex: none; width: 44px; height: 48px; border-radius: 14px; border: 2px solid var(--edge); background: var(--slot); display: flex; align-items: center; justify-content: center; }
  .icon:disabled { opacity: 0.35; }
  .gems { flex: 1; display: flex; gap: 6px; }
  .gem { flex: 1; min-width: 0; height: 48px; border-radius: 14px; border: 2px solid transparent; background: var(--slot); display: flex; align-items: center; justify-content: center; gap: 2px; }
  .gem.on { border-color: #fff; background: var(--slot-on); }
  .go {
    flex: none; width: 112px; height: 48px; border-radius: 24px; border: none; line-height: 1;
    background: radial-gradient(circle at 35% 30%, #ffe08a, var(--orange)); color: #3a1a00;
    font-family: var(--title-font); font-size: 20px; box-shadow: 0 4px 0 #b4561a;
  }
  .go small { display: block; font-family: 'Nunito', sans-serif; font-size: 10px; font-weight: 900; margin-top: 2px; }
  .go.next { font-size: 15px; padding: 0 6px; }

  /* Narrow phones (360 px): compact GO and gems so the bar fits. */
  @media (max-width: 380px) {
    .go { width: 84px; font-size: 18px; }
    .go small { display: none; }
    .gem > svg:last-child { display: none; }
    .tool { font-size: 12px; gap: 4px; }
  }

  /* Hover (mouse only) and press feedback. */
  .tool, .icon, .gem, .go { transition: transform 0.12s, background-color 0.15s, border-color 0.15s, box-shadow 0.12s, filter 0.15s; }
  @media (hover: hover) {
    .tool:hover:not(.on), .icon:hover:not(:disabled) { background: var(--slot-on); border-color: #6f86ff; transform: translateY(-2px); box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25); }
    .tool.on:hover { transform: translateY(-2px); box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25); }
    .gem:hover:not(.on) { background: var(--slot-on); border-color: rgba(255, 255, 255, 0.45); transform: translateY(-2px); box-shadow: 0 4px 0 rgba(0, 0, 0, 0.25); }
    .gem:hover :global(svg:first-child) { animation: twinkle 0.6s ease-in-out; }
    .go:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.08); box-shadow: 0 6px 0 #b4561a, 0 0 18px rgba(255, 170, 60, 0.45); }
  }
  .tool:active, .icon:active:not(:disabled), .gem:active { transform: translateY(1px); box-shadow: none; }
  .go:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 #b4561a; }
  @keyframes twinkle { 50% { transform: scale(1.18) rotate(-8deg); } }
</style>
