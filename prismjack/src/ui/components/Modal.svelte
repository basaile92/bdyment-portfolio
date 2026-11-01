<script lang="ts">
  import type { Snippet } from 'svelte';

  let { open, onclose, label, children }: { open: boolean; onclose: () => void; label: string; children: Snippet } = $props();
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="backdrop" onclick={(e) => e.target === e.currentTarget && onclose()}>
    <div class="card" role="dialog" aria-modal="true" aria-label={label}>
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .backdrop { position: fixed; inset: 0; background: rgba(6, 8, 28, 0.82); display: flex; align-items: center; justify-content: center; padding: 18px; z-index: 40; }
  .card {
    background: linear-gradient(180deg, #1f2770, #141a4a); border: 3px solid var(--edge); border-radius: 24px; padding: 20px;
    max-width: 420px; width: 100%; max-height: 88vh; overflow: auto; display: flex; flex-direction: column; gap: 10px;
  }
  .card :global(h2) { margin: 0; font-family: var(--title-font); font-weight: 400; font-size: 22px; color: var(--gold); text-align: center; }
  .card :global(p) { margin: 0; font-size: 14.5px; line-height: 1.5; color: #dbe1ff; }
  .card :global(.btn) { min-height: 48px; }
</style>
