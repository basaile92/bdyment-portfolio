<script lang="ts">
  import { LEVEL_COUNT, levelTier } from '../../application';
  import type { GameController } from '../GameController.svelte';
  import UiIcon from './icons/UiIcon.svelte';

  /** The level map: 30 levels in three rows of ten, unlocked one by one, a green tick once cleared. */
  let { game }: { game: GameController } = $props();
  const h = $derived(game.s.home);
  const tiers = $derived([
    { name: h.easy, tier: 'easy' },
    { name: h.medium, tier: 'medium' },
    { name: h.hard, tier: 'hard' },
  ] as const);
  const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => i);
  const state = (i: number) => (game.progress.levelsWon.includes(i) ? 'won' : i < game.unlocked ? 'open' : 'locked');
</script>

<div class="levels">
  <header>
    <button class="back" aria-label={game.s.backHome} onclick={() => game.goHome()}><UiIcon name="back" size={24} /></button>
    <h1>{h.levels}</h1>
  </header>
  <div class="tiers">
  {#each tiers as t (t.tier)}
    <section>
      <h2 class={t.tier}>{t.name}</h2>
      <div class="grid">
        {#each levels.filter((i) => levelTier(i) === t.tier) as i (i)}
          {@const st = state(i)}
          <button class="tile {st} {t.tier}" disabled={st === 'locked'} aria-label={h.levelLabel(i + 1, st)} title={st === 'locked' ? h.locked : ''}
            onclick={() => game.startLevel(i)}>
            {i + 1}
            {#if st === 'won'}<span class="tick"><UiIcon name="check" size={12} /></span>{/if}
            {#if st === 'locked'}<span class="lock" aria-hidden="true">🔒</span>{/if}
          </button>
        {/each}
      </div>
    </section>
  {/each}
  </div>
</div>

<style>
  .levels {
    position: fixed; inset: 0; z-index: 30; overflow-y: auto;
    background: radial-gradient(ellipse at 50% 0%, #2b3a95 0%, #151a4a 55%, #0a0d2b 100%);
    padding: calc(12px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  header { width: min(100%, 520px); display: flex; align-items: center; gap: 12px; }
  .back { width: 40px; height: 44px; margin-left: -8px; padding: 0; border: none; background: none; color: #fff; display: flex; align-items: center; justify-content: center; }
  h1 { margin: 0; font-family: var(--title-font); font-weight: 400; font-size: 26px; color: var(--gold); }
  .tiers { width: min(100%, 520px); display: flex; flex-direction: column; gap: 14px; }
  h2 { margin: 0 0 8px; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
  h2.easy { color: #7ee2a8; }
  h2.medium { color: var(--gold); }
  h2.hard { color: #ff8fa3; }
  .grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  .tile {
    position: relative; aspect-ratio: 1; border-radius: 16px; border: 1.5px solid var(--edge);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.02)), rgba(18, 23, 70, 0.72);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    font-family: var(--title-font); font-size: 22px; color: #fff; transition: transform 0.12s, background-color 0.15s, box-shadow 0.2s;
  }
  .tile.easy.open { border-color: #7ee2a8; }
  .tile.medium.open { border-color: var(--gold); }
  .tile.hard.open { border-color: #ff8fa3; }
  .tile.won { background: linear-gradient(135deg, #24735a, #164a3a); border-color: #3fcf8e; }
  .tile.locked { opacity: 0.4; cursor: default; }
  .tick {
    position: absolute; right: -5px; top: -5px; width: 22px; height: 22px; border-radius: 11px; background: #2bd47d; color: #0b2a1c;
    display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px var(--bg);
  }
  .lock { position: absolute; right: 4px; bottom: 2px; font-size: 11px; }
  section { padding: 14px; border-radius: 22px; background: rgba(10, 14, 50, 0.35); border: 1px solid rgba(140, 180, 255, 0.12); }
  @media (min-width: 900px) {
    .levels { justify-content: center; padding: 32px; }
    header { width: min(100%, 1180px); }
    .tiers { width: min(100%, 1180px); display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    h1 { font-size: 34px; }
  }
  @media (hover: hover) {
    .tile:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35), 0 0 16px rgba(94, 231, 255, 0.25); }
    .tile.won:hover { background: #237055; }
  }
</style>
