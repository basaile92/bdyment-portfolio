<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import LanguagePicker from './LanguagePicker.svelte';
  import Modal from './Modal.svelte';
  import SymbolsSwitch from './SymbolsSwitch.svelte';

  let { game }: { game: GameController } = $props();
  const s = $derived(game.s);

  /** Reset asks twice: the first tap only arms it. */
  let armed = $state(false);
  $effect(() => {
    if (game.dialog !== 'settings') armed = false;
  });
</script>

<Modal open={game.dialog === 'settings'} label={s.settingsTitle} onclose={() => (game.dialog = 'none')}>
  <h2>{s.settingsTitle}</h2>
  <div class="reset">
    <span><strong>{s.language}</strong></span>
    <LanguagePicker {game} />
  </div>
  <label class="switch">
    <span><strong>{s.sound}</strong><small>{s.soundSub}</small></span>
    <input type="checkbox" checked={game.settings.sound} onchange={(e) => game.updateSettings({ sound: e.currentTarget.checked })} />
  </label>
  <SymbolsSwitch {game} />
  <div class="reset">
    <span><strong>{s.resetTitle}</strong><small>{armed ? s.resetSure : s.resetSub}</small></span>
    {#if armed}
      <button class="btn small" onclick={() => (armed = false)}>{s.cancel}</button>
      <button class="btn small danger" onclick={() => game.resetProgress()}>{s.erase}</button>
    {:else}
      <button class="btn small danger" onclick={() => (armed = true)}>{s.reset}</button>
    {/if}
  </div>
  <button class="btn primary" onclick={() => (game.dialog = 'none')}>{s.close}</button>
</Modal>

<style>
  .switch { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; background: var(--slot); min-height: 56px; }
  .switch span { flex: 1; display: flex; flex-direction: column; }
  .switch strong { font-size: 15px; font-weight: 900; }
  .switch small { font-size: 12.5px; font-weight: 700; color: var(--muted); }
  .reset { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 14px; background: var(--slot); min-height: 56px; }
  .reset span { flex: 1; display: flex; flex-direction: column; }
  .reset strong { font-size: 15px; font-weight: 900; }
  .reset small { font-size: 12.5px; font-weight: 700; color: var(--muted); }
  .small { flex: none; height: 40px; padding: 0 12px; font-size: 14px; }
  .danger { background: #ff3b5c; border-color: #ff3b5c; color: #fff; }
  input { width: 26px; height: 26px; accent-color: var(--gold); flex: none; }
</style>
