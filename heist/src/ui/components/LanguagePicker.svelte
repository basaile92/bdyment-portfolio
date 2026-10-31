<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import { LANGUAGES } from '../i18n/strings';

  let { game }: { game: GameController } = $props();
</script>

<div class="picker" role="radiogroup" aria-label={game.s.language}>
  {#each LANGUAGES as l (l.id)}
    <button role="radio" aria-checked={game.language === l.id} class:on={game.language === l.id} onclick={() => game.updateSettings({ language: l.id })}>
      {l.name}
    </button>
  {/each}
</div>

<style>
  .picker { display: flex; gap: 6px; justify-content: center; }
  button {
    flex: 1; max-width: 140px; height: 40px; border-radius: 20px; border: 2px solid var(--edge); background: var(--slot);
    font-size: 14px; font-weight: 900; color: var(--muted);
  }
  button.on { border-color: var(--gold); background: var(--slot-on); color: #fff; }
</style>
