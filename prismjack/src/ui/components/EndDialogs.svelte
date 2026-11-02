<script lang="ts">
  import { untrack } from 'svelte';
  import type { GameController } from '../GameController.svelte';
  import UiIcon from './icons/UiIcon.svelte';
  import Modal from './Modal.svelte';
  import AlarmLamps from './AlarmLamps.svelte';
  import Rich from './Rich.svelte';

  let { game }: { game: GameController } = $props();

  const s = $derived(game.s);
  $effect(() => {
    if ((game.dialog === 'win' || game.dialog === 'caught') && (game.mode.kind === 'daily' || game.mode.kind === 'run')) untrack(() => void game.prepareShareImage());
  });
  const shareLabel = $derived(game.shareOutcome === 'shared' ? s.shared : game.shareOutcome === 'copied' ? s.copied : s.share);
</script>

{#snippet shareButton()}
  {#if game.shareImage}<img class="preview" src={game.shareImage.url} alt="" />{/if}
  <button class="btn share" onclick={() => game.shareResult()}><UiIcon name="share" size={18} /> {shareLabel}</button>
  {#if game.shareOutcome === 'failed'}
    <!-- No share sheet and no clipboard: the text, selected, ready to copy by hand. -->
    <label class="manual">{s.shareManual}<textarea readonly rows="5" onfocus={(e) => e.currentTarget.select()}>{game.shareText()}</textarea></label>
  {/if}
{/snippet}

<Modal open={game.dialog === 'win'} label={s.winTitle} onclose={() => (game.dialog = 'none')}>
  <h2>{s.winTitle}</h2>
  <div class="lamps"><AlarmLamps level={game.result?.alarms ?? 0} size={40} label={s.winAlarmLabel(game.result?.alarms ?? 0)} /></div>
  <p class="center">
    <Rich text={s.winText(game.tests, game.result?.alarms ?? 0)} /><br />{s.winVerdict(game.result?.alarms ?? 0)}
  </p>
  {#if game.result?.record}
    <p class="center record">{s.newRecord}</p>
  {:else if game.result?.best}
    <p class="center"><Rich text={s.levelRecord(game.result.best.alarms, game.result.best.tests)} /></p>
  {/if}
  {#if game.mode.kind === 'daily'}
    <p class="center daily"><Rich text={s.streakLine(game.progress.dailyStreak, game.nextDailyIn())} /></p>
  {/if}
  {#if game.mode.kind === 'daily'}{@render shareButton()}{/if}
  <div class="row">
    <button class="btn" onclick={() => (game.dialog = 'none')}>{s.seeRoom}</button>
    <button class="btn primary" onclick={() => game.continueAfter()}>{game.continueLabel}</button>
  </div>
</Modal>

<Modal open={game.dialog === 'caught'} label={s.caughtTitle} onclose={() => (game.dialog = 'none')}>
  <h2>{s.caughtTitle}</h2>
  <div class="lamps"><AlarmLamps level={3} size={40} label={s.alarmLevel(3)} /></div>
  <p class="center">
    {#if game.mode.kind === 'run'}{s.runOver(game.mode.step, Math.max(game.progress.runBest, game.mode.step))}{:else}{s.caughtText(game.mode.kind === 'daily')}{/if}
  </p>
  {#if game.mode.kind === 'daily'}
    <p class="center daily">{s.home.dailyDone(game.nextDailyIn())}</p>
  {/if}
  {#if game.mode.kind === 'daily' || game.mode.kind === 'run'}{@render shareButton()}{/if}
  <div class="row">
    <button class="btn" onclick={() => (game.dialog = 'none')}>{s.seeRoom}</button>
    <button class="btn primary" onclick={() => game.continueAfter()}>{game.continueLabel}</button>
  </div>
</Modal>

<style>
  p.center.record { color: var(--gold); font-weight: 900; }
  .manual { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 800; color: var(--muted); }
  .manual textarea { width: 100%; resize: none; border-radius: 10px; border: 2px solid var(--edge); background: #0b0f30; color: #dbe1ff; font: 13px/1.35 ui-monospace, monospace; padding: 8px; user-select: text; -webkit-user-select: text; }
  .daily { font-size: 14px; color: var(--muted); }
  .lamps { display: flex; justify-content: center; }
  .center { text-align: center; }
  .share { border-color: var(--gold); }
  .preview { display: block; width: 46%; max-width: 200px; margin: 0 auto; border-radius: 12px; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
</style>
