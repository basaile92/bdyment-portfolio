<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * A real <dialog>, opened with showModal(): Escape closes it, focus moves inside and stays there,
   * the rest of the page is inert for screen readers, and focus goes back to where it was on close.
   */
  let { open, onclose, label, children }: { open: boolean; onclose: () => void; label: string; children: Snippet } = $props();

  let dialog = $state<HTMLDialogElement>();
  let opener: HTMLElement | null = null;

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      opener?.focus();
      opener = null;
    }
  });
</script>

<dialog
  bind:this={dialog}
  aria-label={label}
  oncancel={(e) => {
    e.preventDefault();
    onclose();
  }}
  onclick={(e) => e.target === e.currentTarget && onclose()}
>
  {#if open}
    <div class="card">
      {@render children()}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 18px;
    border: none; background: transparent; color: inherit; align-items: center; justify-content: center;
  }
  dialog[open] { display: flex; }
  dialog::backdrop { background: rgba(6, 8, 28, 0.82); }
  .card {
    background: linear-gradient(180deg, #1f2770, #141a4a); border: 3px solid var(--edge); border-radius: 24px; padding: 20px;
    max-width: 420px; width: 100%; max-height: 88vh; overflow: auto; display: flex; flex-direction: column; gap: 10px;
  }
  .card :global(h2) { margin: 0; font-family: var(--title-font); font-weight: 400; font-size: 22px; color: var(--gold); text-align: center; }
  .card :global(p) { margin: 0; font-size: 14.5px; line-height: 1.5; color: #dbe1ff; }
  .card :global(.btn) { min-height: 48px; }
</style>
