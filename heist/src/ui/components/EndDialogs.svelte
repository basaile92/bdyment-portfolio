<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import UiIcon from './icons/UiIcon.svelte';
  import Modal from './Modal.svelte';
  import Rich from './Rich.svelte';

  let { game }: { game: GameController } = $props();

  let copied = $state(false);
  const stars = $derived(game.result ? '★'.repeat(game.result.stars) + '☆'.repeat(3 - game.result.stars) : '');
  const s = $derived(game.s);

  async function share() {
    try {
      await navigator.clipboard.writeText(game.shareText());
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

<Modal open={game.dialog === 'win'} label={s.winTitle} onclose={() => (game.dialog = 'none')}>
  <h2>{s.winTitle}</h2>
  <div class="stars" aria-label={s.winStarsLabel(game.result?.stars ?? 0)}>{stars}</div>
  <p class="center">
    <Rich text={s.winText(game.alarm, game.heist.thresholds.threeStars, game.limit)} />{#if game.wrongPlans > 0}{s.winWrong(game.wrongPlans)}{/if}.
    {#if game.result?.stars === 0}<br />{s.winNoStars}{/if}
  </p>
  {#if game.mode.kind === 'daily'}
    <p class="center daily"><Rich text={s.streakLine(game.progress.dailyStreak, game.nextDailyIn())} /></p>
    <button class="btn" onclick={share}><UiIcon name="share" size={18} /> {copied ? s.copied : s.copyResult}</button>
  {/if}
  <div class="row">
    <button class="btn" onclick={() => (game.dialog = 'none')}>{s.seeRoom}</button>
    <button class="btn primary" onclick={() => game.continueAfter()}>{game.continueLabel}</button>
  </div>
</Modal>

<Modal open={game.dialog === 'caught'} label={s.caughtTitle} onclose={() => (game.dialog = 'none')}>
  <h2>{s.caughtTitle}</h2>
  <p class="center">
    {game.caughtBy === 'wrong-plans' ? s.caughtWrong : s.caughtAlarm(game.limit)}{s.caughtRest(game.mode.kind === 'daily')}
  </p>
  {#if game.mode.kind === 'daily'}
    <p class="center daily"><Rich text={s.caughtDaily(game.nextDailyIn())} /></p>
  {/if}
  <div class="row">
    <button class="btn" onclick={() => (game.dialog = 'none')}>{s.seeRoom}</button>
    <button class="btn primary" onclick={() => game.continueAfter()}>{game.continueLabel}</button>
  </div>
</Modal>

<style>
  .daily { font-size: 14px; color: var(--muted); }
  .stars { font-size: 38px; letter-spacing: 6px; color: var(--gold); text-align: center; text-shadow: 0 0 14px rgba(255, 201, 60, 0.6); }
  .center { text-align: center; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
</style>
