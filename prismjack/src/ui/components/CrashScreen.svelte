<script lang="ts">
  import type { GameController } from '../GameController.svelte';

  /**
   * Safety net: an unexpected error must never leave a frozen screen. The player can reload, carry on,
   * or copy a report to send to support (version, device, language, mode, the error) — nothing is sent by itself.
   */
  let { game }: { game: GameController } = $props();

  let error = $state<string | null>(null);
  let copied = $state(false);

  /** Browser noise that is not a bug of the game. */
  const BENIGN = /ResizeObserver loop|Script error\.?$|NotAllowedError|AbortError/i;

  $effect(() => {
    const show = (message: string, stack = '') => {
      if (BENIGN.test(message) || error) return;
      error = `${message}\n${stack}`.trim();
    };
    const onError = (e: ErrorEvent) => show(e.message, e.error instanceof Error ? (e.error.stack ?? '') : '');
    const onRejection = (e: PromiseRejectionEvent) => {
      const r: unknown = e.reason;
      show(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '');
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  });

  const report = $derived(
    [`Prismjack ${__APP_VERSION__}`, navigator.userAgent, `lang=${game.language} mode=${JSON.stringify(game.mode)} screen=${innerWidth}x${innerHeight}`, '', error ?? ''].join('\n'),
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(report);
      copied = true;
    } catch {
      copied = false;
    }
  }
</script>

{#if error}
  <div class="crash" role="alertdialog" aria-labelledby="crash-title">
    <div class="card">
      <h2 id="crash-title">{game.s.crashTitle}</h2>
      <p>{game.s.crashText}</p>
      <textarea readonly rows="4">{report}</textarea>
      <div class="row">
        <button class="btn" onclick={copy}>{copied ? game.s.copied : game.s.crashCopy}</button>
        <button class="btn primary" onclick={() => location.reload()}>{game.s.crashReload}</button>
      </div>
      <button class="later" onclick={() => (error = null)}>{game.s.crashContinue}</button>
    </div>
  </div>
{/if}

<style>
  .crash { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(6, 8, 28, 0.9); }
  .card { max-width: 420px; width: 100%; display: flex; flex-direction: column; gap: 10px; padding: 20px; border-radius: 24px; border: 3px solid var(--edge); background: linear-gradient(180deg, #1f2770, #141a4a); }
  h2 { margin: 0; font-family: var(--title-font); font-weight: 400; font-size: 20px; color: var(--gold); text-align: center; }
  p { margin: 0; font-size: 14.5px; line-height: 1.45; color: #dbe1ff; }
  textarea { width: 100%; resize: none; border-radius: 10px; border: 2px solid var(--edge); background: #0b0f30; color: #9aa3cf; font: 11px/1.3 ui-monospace, monospace; padding: 8px; user-select: text; -webkit-user-select: text; }
  .row { display: flex; gap: 8px; }
  .row .btn { flex: 1; min-height: 48px; }
  .later { min-height: 44px; border: none; background: none; color: var(--muted); font-weight: 800; text-decoration: underline; }
</style>
