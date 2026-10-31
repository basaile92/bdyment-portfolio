<script lang="ts">
  let { size = 66, upsideDown = false }: { size?: number; upsideDown?: boolean } = $props();
</script>

<svg viewBox="0 0 64 64" width={size} height={size} class:upside={upsideDown} aria-hidden="true">
  <path d="M12 62c2-12 10-17 20-17s18 5 20 17z" fill="#4b3fb0" />
  <circle cx="32" cy="30" r="14" fill="#ffd2b0" />
  <path d="M17 28c0-10 7-16 15-16s15 6 15 16c-5-3-10-4-15-4s-10 1-15 4z" fill="#2b2366" />
  <rect x="17.5" y="27" width="29" height="7.5" rx="3.7" fill="#ff4fd8" />
  <circle cx="26" cy="30.7" r="2.1" fill="#fff" />
  <circle cx="38" cy="30.7" r="2.1" fill="#fff" />
  <path d="M28 38.5q4 3 8 0" stroke="#a5523a" stroke-width="1.8" fill="none" stroke-linecap="round" />
</svg>

<style>
  .upside { transform: rotate(180deg); }
</style>
