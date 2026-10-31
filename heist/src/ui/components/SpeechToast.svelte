<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import { speak } from '../presenters/messages';

  /**
   * Phones have no room for the thief's bubble: what matters (training tips, alarm, warnings)
   * floats over the room for a few seconds instead. Plain test results are already in the sensors.
   */
  let { game }: { game: GameController } = $props();

  const SHOW_MS = 4500;
  let visible = $state(false);
  const parts = $derived(speak(game.speech, game.s));
  const worthShowing = $derived(game.speech.kind !== 'shot' || game.speech.tip !== undefined);

  $effect(() => {
    void game.speech;
    if (!worthShowing) {
      visible = false;
      return;
    }
    visible = true;
    const timer = setTimeout(() => (visible = false), SHOW_MS);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <button class="toast" onclick={() => (visible = false)} aria-live="polite">
    {#each parts as part, i (i)}{#if part.swatch}<span class="swatch" style="background: {part.swatch}"></span>{/if}<span
        class:strong={part.strong} class:good={part.tone === 'good'} class:bad={part.tone === 'bad'}>{part.text}</span>{/each}
  </button>
{/if}

<style>
  .toast {
    position: absolute; z-index: 5; top: 6px; left: 50%; transform: translateX(-50%); width: min(92%, 420px);
    background: #fff; color: #1b1745; border: none; border-radius: 14px; padding: 9px 13px; text-align: left;
    font-size: 14px; line-height: 1.3; font-weight: 800; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
    animation: drop 0.25s ease-out;
  }
  .strong { font-weight: 900; }
  .good { color: #12805a; }
  .bad { color: #c81e45; }
  .swatch { display: inline-block; width: 11px; height: 11px; border-radius: 50%; border: 1px solid #1b1745; margin-right: 3px; vertical-align: -1px; }
  @keyframes drop { from { transform: translate(-50%, -12px); opacity: 0; } }
</style>
