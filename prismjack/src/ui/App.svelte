<script lang="ts">
  import type { GameController } from './GameController.svelte';
  import Board from './components/Board.svelte';
  import EndDialogs from './components/EndDialogs.svelte';
  import HelpSheet from './components/HelpSheet.svelte';
  import LanguagePicker from './components/LanguagePicker.svelte';
  import LootRow from './components/LootRow.svelte';
  import HomeScreen from './components/HomeScreen.svelte';
  import LevelsScreen from './components/LevelsScreen.svelte';
  import Modal from './components/Modal.svelte';
  import SettingsDialog from './components/SettingsDialog.svelte';
  import ThiefScene from './components/ThiefScene.svelte';
  import PhoneDiver from './components/PhoneDiver.svelte';
  import SpeechToast from './components/SpeechToast.svelte';
  import CoachCard from './components/CoachCard.svelte';
  import SymbolsSwitch from './components/SymbolsSwitch.svelte';
  import Toolbar from './components/Toolbar.svelte';
  import TopBar from './components/TopBar.svelte';
  import TooSmall from './components/TooSmall.svelte';
  import CrashScreen from './components/CrashScreen.svelte';

  let { game }: { game: GameController } = $props();
  const close = () => (game.dialog = 'none');
  const s = $derived(game.s);
  $effect(() => {
    // Full codes: the texts are Brazilian Portuguese and Traditional Chinese (fonts, hyphenation, screen readers).
    document.documentElement.lang = ({ pt: 'pt-BR', zh: 'zh-Hant' } as Record<string, string>)[game.language] ?? game.language;
  });
</script>

<div class="app">
  <TopBar {game} />
  <main>
    <div class="side">
      <ThiefScene {game} />
      <div class="wide-only"><CoachCard {game} /></div>
      <div class="wide-only"><LootRow {game} /></div>
      <div class="wide-only tools"><Toolbar {game} /></div>
    </div>
    {#key game.alarmTick}
      <section class="room" aria-label={s.room}>
        {#if game.mode.kind !== 'lesson'}<div class="narrow-only toast-slot"><SpeechToast {game} /></div>{/if}
        <Board {game} />
        <div class="narrow-only coach-slot"><CoachCard {game} /></div>
        <div class="narrow-only loot-slot"><LootRow {game} /></div>
      </section>
    {/key}
  </main>
  <div class="narrow-only"><Toolbar {game} /></div>
</div>

<Modal open={game.dialog === 'welcome'} label={s.welcomeTitle} onclose={() => game.closeWelcome(false)}>
  <LanguagePicker {game} />
  <h2>{s.welcomeTitle}</h2>
  <p>{s.welcomeText}</p>
  <SymbolsSwitch {game} />
  <div class="row">
    <button class="btn" onclick={() => game.closeWelcome(false)}>{s.welcomeKnow}</button>
    <button class="btn primary" onclick={() => game.closeWelcome(true)}>{s.welcomeLearn}</button>
  </div>
</Modal>

{#key game.alarmTick}{#if game.alarmTick > 0}<div class="red-flash" aria-hidden="true"></div>{/if}{/key}

<PhoneDiver {game} />
<HelpSheet {game} />
{#if game.screen === 'home'}<HomeScreen {game} />{:else if game.screen === 'levels'}<LevelsScreen {game} />{/if}
<SettingsDialog {game} />
<EndDialogs {game} />
<TooSmall {game} />
<CrashScreen {game} />

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
  /* The thief's column always stacks above the room: he never passes under the grid, whatever the screen. */
  .side { flex: none; position: relative; z-index: 5; }
  .room { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 4px 0; }
  .toast-slot { display: contents; }
  /* Tablets and big portrait windows show the thief and his bubble, so no floating message there. */
  @media (min-width: 600px) { .toast-slot { display: none !important; } }
  .wide-only { display: none; }
  /* The whole screen flashes red when the alarm goes up. */
  /* One soft red fade, no flashing (safe for photosensitive players). */
  .red-flash { position: fixed; inset: 0; z-index: 9; pointer-events: none; background: rgba(255, 30, 70, 0.3); opacity: 0; animation: red-fade 0.9s ease-out; }
  @keyframes red-fade { 0% { opacity: 1; } 100% { opacity: 0; } }

  /* Short phones: the loot stays (what to look for is essential), on one compact line. */
  @media (max-height: 700px) and (max-aspect-ratio: 1/1) {
    .room .loot-slot :global(.loot) { flex-direction: row; gap: 10px; }
    .room .loot-slot :global(.loot ul) { gap: 8px; }
    .room .loot-slot :global(.loot) { --jewel-cell: 12px; }
  }

  /* Wide screens (desktop, tablets and phones held sideways): room on the left, the rest on the right. */
  @media (min-aspect-ratio: 1/1) and (min-width: 760px) {
    main { flex-direction: row-reverse; gap: 12px; padding: 10px 12px; }
    .side { width: min(400px, 46%); display: flex; flex-direction: column; gap: 12px; justify-content: center; }
    .wide-only { display: block; }
    .narrow-only { display: none; }
    .tools :global(footer) { background: transparent; }
    .tools :global(.inner) { padding: 0; }
    /* Same board size as before, but room + side panel are centred together (same space left and right). */
    main { justify-content: center; max-width: none; }
    .room { padding: 0; flex: 0 1 auto; align-self: stretch; aspect-ratio: 9.7 / 11.7; min-width: 0; margin: 0 10px 0 0; }
  }
</style>
