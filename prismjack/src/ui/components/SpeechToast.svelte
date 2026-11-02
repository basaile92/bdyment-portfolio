<script lang="ts">
  import type { GameController } from '../GameController.svelte';
  import { untrack } from 'svelte';
  import { speak } from '../presenters/messages';

  /**
   * Phones have no room for the thief's bubble: what matters (training tips, alarm, warnings)
   * floats over the middle of the grid for a few seconds instead, clear of every torch, so the
   * first torch can be lit straight away. Plain test results are already in the sensors.
   */
  let { game }: { game: GameController } = $props();

  const SHOW_MS = 4500;
  let visible = $state(false);
  let shown = $state<typeof game.speech | null>(null);
  const parts = $derived(shown ? speak(shown, game.s) : []);
  let timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * A plain test result is already in the sensors: it never pops a toast, and it does not
   * cut short the message on screen either (it stays its full time, or until tapped).
   */
  $effect(() => {
    const speech = game.speech;
    if (speech.kind === 'shot' && speech.tip === undefined) return;
    untrack(() => {
      shown = speech;
      visible = true;
      leaving = false;
      clearTimeout(timer);
      timer = setTimeout(() => (visible = false), SHOW_MS);
    });
  });
  $effect(() => () => clearTimeout(timer));

  /** Any touch elsewhere (a torch, the drawing) means the message was read: it goes. */
  $effect(() => {
    if (!visible) return;
    const opened = Date.now();
    const away = () => {
      if (Date.now() - opened > 400 && !leaving) close();
    };
    window.addEventListener('pointerdown', away);
    return () => window.removeEventListener('pointerdown', away);
  });

  /**
   * Touching the bubble hides it at once, but it stays in place (invisible) until the touch
   * is over, so the tap never lands on the torch or cell under it.
   */
  let leaving = $state(false);
  function leave(e: PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    leaving = true;
    clearTimeout(timer);
    timer = setTimeout(close, 600);
  }
  function close(e?: MouseEvent) {
    e?.stopPropagation();
    clearTimeout(timer);
    visible = false;
    leaving = false;
  }
</script>

{#if visible}
  <button class="toast" class:leaving onpointerdown={leave} onclick={close} aria-live="polite">
    {#each parts as part, i (i)}{#if part.swatch}<span class="swatch" style="background: {part.swatch}"></span>{/if}<span
        class:strong={part.strong} class:good={part.tone === 'good'} class:bad={part.tone === 'bad'}>{part.text}</span>{/each}
  </button>
{/if}

<style>
  .toast {
    position: absolute; z-index: 5; top: 38%; left: 0; right: 0; margin: 0 auto; width: min(74%, 380px);
    background: #fff; color: #1b1745; border: none; border-radius: 14px; padding: 9px 13px; text-align: left;
    font-size: 14px; line-height: 1.3; font-weight: 800; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
    animation: drop 0.25s ease-out;
  }
  /* Tapping only dismisses it: no press effect (the global one would shift it). */
  .toast:active { transform: none; }
  .toast.leaving { opacity: 0; animation: none; }
  .strong { font-weight: 900; }
  .good { color: #12805a; }
  .bad { color: #c81e45; }
  .swatch { display: inline-block; width: 11px; height: 11px; border-radius: 50%; border: 1px solid #1b1745; margin-right: 3px; vertical-align: -1px; }
  @keyframes drop { from { transform: translateY(-12px); opacity: 0; } }
</style>
