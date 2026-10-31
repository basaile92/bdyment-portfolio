<script lang="ts">
  /** Small line icons for the interface buttons. */
  export type UiIconName = 'undo' | 'redo' | 'trash' | 'menu' | 'settings' | 'help' | 'check' | 'share';

  let { name, size = 22 }: { name: UiIconName; size?: number } = $props();
</script>

<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  {#if name === 'undo'}
    <path d="M9 7L4 12l5 5" /><path d="M4 12h10a6 6 0 010 12h-2" transform="translate(0 -6)" />
  {:else if name === 'redo'}
    <path d="M15 7l5 5-5 5" /><path d="M20 12H10a6 6 0 000 12h2" transform="translate(0 -6)" />
  {:else if name === 'trash'}
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  {:else if name === 'menu'}
    <path d="M3 21h18M5 21V10M19 21V10M9 21v-7M15 21v-7M2 10l10-6 10 6z" />
  {:else if name === 'settings'}
    <path d="M10.3 2.6h3.4l.5 2.5 1.8.8 2.1-1.4 2.4 2.4-1.4 2.1.8 1.8 2.5.5v3.4l-2.5.5-.8 1.8 1.4 2.1-2.4 2.4-2.1-1.4-1.8.8-.5 2.5h-3.4l-.5-2.5-1.8-.8-2.1 1.4-2.4-2.4 1.4-2.1-.8-1.8-2.5-.5v-3.4l2.5-.5.8-1.8-1.4-2.1 2.4-2.4 2.1 1.4 1.8-.8z" stroke-width="2" /><circle cx="12" cy="12" r="3.2" stroke-width="2" />
  {:else if name === 'help'}
    <path d="M9.2 9a3 3 0 115.6 1.5c-.9 1-2.8 1.6-2.8 3.5" /><circle cx="12" cy="18.5" r=".6" fill="currentColor" />
  {:else if name === 'check'}
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  {:else}
    <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
  {/if}
</svg>
