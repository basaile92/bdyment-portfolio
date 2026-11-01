<script lang="ts">
  export type ToolIconKind = 'trace' | 'wall' | 'facet' | 'empty';

  let { kind, color, size = 32 }: { kind: ToolIconKind; color: string; size?: number } = $props();
</script>

<svg viewBox="0 0 26 26" width={size} height={size} aria-hidden="true">
  <rect x="2" y="3" width="22" height="21" rx="5" fill="#3a47b0" />
  {#if kind === 'wall' || kind === 'trace'}
    <rect x="2" y="2.5" width="22" height="6" rx="3" fill={color} />
    <rect x="5" y="3.6" width="9" height="1.8" rx=".9" fill="#fff" opacity=".55" />
  {/if}
  {#if kind === 'facet' || kind === 'trace'}
    <path d="M24 9.5V19a5 5 0 01-5 5H9.5z" fill={color} />
    <path d="M11 22.2L22.2 11" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55" />
  {/if}
  {#if kind === 'wall'}
    <path d="M13 21V9" class="glow" /><path d="M13 21V9" class="beam" /><circle cx="13" cy="9.2" r="2.2" fill="#fff" />
  {:else if kind === 'facet'}
    <path d="M3.5 16.5H16.5V6" class="glow" /><path d="M3.5 16.5H16.5V6" class="beam" /><circle cx="16.5" cy="16.5" r="2.2" fill="#fff" />
  {:else if kind === 'empty'}
    <path d="M9 10l8 8M17 10l-8 8" stroke="#8f9bd6" stroke-width="3" stroke-linecap="round" />
  {/if}
</svg>

<style>
  .beam, .glow { fill: none; stroke: var(--cyan); stroke-linecap: round; stroke-linejoin: round; }
  .beam { stroke-width: 2.6; }
  .glow { stroke-width: 6; opacity: 0.25; }
</style>
