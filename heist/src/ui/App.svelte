<script lang="ts">
  import type { GameController } from './GameController.svelte';
  import Board from './components/Board.svelte';
  import EndDialogs from './components/EndDialogs.svelte';
  import HelpSheet from './components/HelpSheet.svelte';
  import LanguagePicker from './components/LanguagePicker.svelte';
  import LootRow from './components/LootRow.svelte';
  import MenuDialog from './components/MenuDialog.svelte';
  import Modal from './components/Modal.svelte';
  import SettingsDialog from './components/SettingsDialog.svelte';
  import ThiefScene from './components/ThiefScene.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import TopBar from './components/TopBar.svelte';

  let { game }: { game: GameController } = $props();
  const close = () => (game.dialog = 'none');
  const s = $derived(game.s);
  $effect(() => {
    document.documentElement.lang = game.language;
  });
</script>

<div class="app">
  <TopBar {game} />
  <main>
    <div class="side">
      <ThiefScene {game} />
      <div class="wide-only"><LootRow {game} /></div>
      <div class="wide-only tools"><Toolbar {game} /></div>
    </div>
    {#key game.alarmTick}
      <section class="room" class:alert={game.alarmTick > 0} aria-label={s.room}>
        <Board {game} />
        <div class="narrow-only"><LootRow {game} /></div>
      </section>
    {/key}
  </main>
  <div class="narrow-only"><Toolbar {game} /></div>
</div>

<Modal open={game.dialog === 'welcome'} label={s.welcomeTitle} onclose={() => game.closeWelcome(false)}>
  <LanguagePicker {game} />
  <h2>{s.welcomeTitle}</h2>
  <p>{s.welcomeText}</p>
  <div class="row">
    <button class="btn" onclick={() => game.closeWelcome(false)}>{s.welcomeKnow}</button>
    <button class="btn primary" onclick={() => game.closeWelcome(true)}>{s.welcomeLearn}</button>
  </div>
</Modal>

<HelpSheet {game} />
<MenuDialog {game} />
<SettingsDialog {game} />
<EndDialogs {game} />

<Modal open={game.dialog === 'confirm-clear'} label={s.clearPlan} onclose={close}>
  <h2>{s.clearTitle}</h2>
  <p>{s.clearText}</p>
  <div class="row"><button class="btn" onclick={close}>{s.keep}</button><button class="btn primary" onclick={() => game.clear()}>{s.erase}</button></div>
</Modal>

<Modal open={game.dialog === 'confirm-go'} label={s.incompleteTitle} onclose={close}>
  <h2>{s.incompleteTitle}</h2>
  <p>{s.incompleteText(game.missing)}</p>
  <div class="row"><button class="btn" onclick={close}>{s.continuePlan}</button><button class="btn primary" onclick={() => game.submit()}>{s.goAnyway}</button></div>
</Modal>

<style>
  .app { height: 100vh; height: 100dvh; display: flex; flex-direction: column; background: var(--bg); overflow: hidden; }
  main { flex: 1; min-height: 0; width: 100%; max-width: var(--max); margin: 0 auto; display: flex; flex-direction: column; padding: 10px; }
  .side { flex: none; }
  .room { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 8px 12px; }
  .wide-only { display: none; }
  .alert { animation: alert 0.9s; }
  @keyframes alert { 0%, 40%, 80% { box-shadow: inset 0 0 0 999px rgba(255, 40, 80, 0.2); } 20%, 60%, 100% { box-shadow: none; } }

  /* Short phones: the loot row gives its height to the board (jewels are still checked in the drawing). */
  @media (max-height: 700px) and (max-aspect-ratio: 1/1) {
    .room .narrow-only { display: none; }
  }

  /* Wide screens (desktop, tablets and phones held sideways): room on the left, the rest on the right. */
  @media (min-aspect-ratio: 1/1) and (min-width: 640px) {
    main { flex-direction: row-reverse; gap: 12px; padding: 10px 12px; }
    .side { width: min(400px, 46%); display: flex; flex-direction: column; gap: 12px; justify-content: center; }
    .wide-only { display: block; }
    .narrow-only { display: none; }
    .tools :global(footer) { background: transparent; }
    .tools :global(.inner) { padding: 0; }
    /* Same board size as before, but room + side panel are centred together (same space left and right). */
    main { justify-content: center; max-width: none; }
    .room { padding: 10px 0; flex: 0 1 auto; align-self: stretch; aspect-ratio: 9.7 / 11.7; min-width: 0; margin: 0 10px 0 3px; }
  }
</style>
