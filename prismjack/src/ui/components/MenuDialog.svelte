<script lang="ts">
  import { dayOf, type PrismjackMode } from '../../application';
  import type { GameController } from '../GameController.svelte';
  import Modal from './Modal.svelte';

  let { game }: { game: GameController } = $props();

  const today = $derived(dayOf(new Date()));
  const p = $derived(game.progress);
  const s = $derived(game.s);
  const playing = $derived(game.prismjack.shots.length > 0 && !game.over);

  function choose(mode: PrismjackMode) {
    game.start(mode);
  }
</script>

<Modal open={game.dialog === 'menu'} label={s.menuTitle} onclose={() => (game.dialog = 'none')}>
  <h2>{s.menuTitle}</h2>
  {#if playing}<p class="warn">{s.menuAbandon}</p>{/if}
  <button class="choice daily" disabled={game.dailyDone} onclick={() => choose({ kind: 'daily', day: today })}>
    <strong>{s.dailyTitle(!game.dailyDone ? 'open' : p.lastDailyWon === today ? 'won' : 'lost')}</strong>
    <span>{game.dailyDone ? s.dailyDone(game.nextDailyIn()) : s.dailyOpen}</span>
    {#if p.dailyStreak > 0}<span class="streak">{s.streak(p.dailyStreak)}</span>{/if}
  </button>
  <button class="choice" onclick={() => choose({ kind: 'free' })}>
    <strong>{s.freeTitle}</strong><span>{s.freeText}</span>
  </button>
  <p class="label">{s.trainingTitle}</p>
  <div class="training">
    {#each [1, 2, 3] as const as level (level)}
      <button class="choice small" onclick={() => choose({ kind: 'training', level })}>
        <strong>{s.trainingJewels(level)}</strong><span>{p.trainingDone >= level ? s.trainingDone : s.trainingTodo}</span>
      </button>
    {/each}
  </div>
  <p class="stats">{s.stats(p.prismjacksWon, p.perfectPrismjacks)}</p>
</Modal>

<style>
  .label { margin: 4px 0 -4px; font-size: 13px; font-weight: 900; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; }
  .choice:disabled { opacity: 0.6; cursor: default; }
  .warn { color: #ffb3c1 !important; font-weight: 800; text-align: center; }
  .choice {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px; text-align: left; padding: 12px 14px; min-height: 56px;
    border-radius: 16px; border: 2px solid var(--edge); background: var(--slot);
  }
  .choice strong { font-size: 16px; font-weight: 900; }
  .choice span { font-size: 13px; font-weight: 700; color: var(--muted); }
  .choice.daily { border-color: var(--gold); }
  .streak { color: var(--gold) !important; }
  .training { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .choice.small { padding: 10px; }
  .choice.small strong { font-size: 13px; }
  .stats { text-align: center; font-size: 13px !important; color: var(--muted) !important; }
</style>
