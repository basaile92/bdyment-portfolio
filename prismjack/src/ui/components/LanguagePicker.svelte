<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import { LANGUAGES, type Language } from '../i18n/strings';

  /** The game's language, as a native select (each language written in itself). */
  let { game }: { game: GameController } = $props();
</script>

<div class="select">
  <select aria-label={game.s.language} value={game.language} onchange={(e) => game.updateSettings({ language: e.currentTarget.value as Language })}>
    {#each LANGUAGES as l (l.id)}<option value={l.id}>{l.name}</option>{/each}
  </select>
  <svg class="chevron" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><path d="M1 1.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
</div>

<style>
  .select { position: relative; min-width: 150px; }
  select {
    width: 100%; height: 42px; padding: 0 36px 0 14px; appearance: none; -webkit-appearance: none;
    border-radius: 21px; border: 2px solid var(--edge); background: var(--slot); color: #fff;
    font: inherit; font-size: 15px; font-weight: 900; cursor: pointer;
  }
  select:focus-visible { outline: none; border-color: var(--gold); }
  option { color: #000; background: #fff; }
  .chevron { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
</style>
