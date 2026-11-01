<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import UiIcon from './icons/UiIcon.svelte';
  import Modal from './Modal.svelte';
  import AlarmLamps from './AlarmLamps.svelte';
  import Rich from './Rich.svelte';

  let { game }: { game: GameController } = $props();

  let copied = $state(false);
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
  <div class="lamps"><AlarmLamps level={game.result?.alarms ?? 0} size={40} label={s.winAlarmLabel(game.result?.alarms ?? 0)} /></div>
  <p class="center">
    <Rich text={s.winText(game.tests, game.result?.alarms ?? 0)} /><br />{s.winVerdict(game.result?.alarms ?? 0)}
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
  <div class="lamps"><AlarmLamps level={3} size={40} label={s.alarmLevel(3)} /></div>
  <p class="center">
    {s.caughtText(game.mode.kind === 'daily')}
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
  .lamps { display: flex; justify-content: center; }
  .center { text-align: center; }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
</style>
