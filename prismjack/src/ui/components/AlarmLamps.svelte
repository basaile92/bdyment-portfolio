<script lang="ts">
  import { untrack } from 'svelte';
  /**
   * The alarm level as three warning lamps: one lights up per level, the third brings the guard.
   * Each time the level goes up, the lit lamps flash.
   */
  let { level, size = 16, label }: { level: number; size?: number; label: string } = $props();

  let flashes = $state(0);
  let last = untrack(() => level);
  $effect(() => {
    if (level > last) flashes++;
    last = level;
  });
</script>

<span class="lamps" role="img" aria-label={label}>
  {#key flashes}
    {#each [0, 1, 2] as i (i)}
      <svg viewBox="0 0 20 20" width={size} height={size} class:on={i < level} class:flash={flashes > 0 && i < level} aria-hidden="true">
        <path d="M4 15V10a6 6 0 0 1 12 0v5z" class="dome" />
        <rect x="2" y="15" width="16" height="3" rx="1" fill="#3a3a48" />
        <path d="M7.5 9.5a3 3 0 0 1 2.5 -3" class="shine" />
      </svg>
    {/each}
  {/key}
</span>

<style>
  .lamps { display: inline-flex; gap: 3px; vertical-align: middle; }
  .dome { fill: #3b4170; transition: fill 0.25s; }
  .shine { fill: none; stroke: #fff; stroke-opacity: 0.35; stroke-width: 1.4; stroke-linecap: round; }
  .on .dome { fill: #ff3b5c; }
  .on { filter: drop-shadow(0 0 4px rgba(255, 59, 92, 0.8)); }
  .flash { animation: flash 0.4s steps(1) 6; }
  @keyframes flash { 50%, 100% { opacity: 0.2; filter: none; } }
</style>
