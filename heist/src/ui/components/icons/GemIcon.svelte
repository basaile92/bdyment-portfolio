<script lang="ts">
  let { color, size = 28 }: { color: string; size?: number } = $props();
</script>

<svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
  <polygon points="6,4 18,4 22,9 12,21 2,9" fill={color} />
  <polygon points="6,4 18,4 15,9 9,9" fill="#fff" opacity=".45" />
  <polygon points="2,9 9,9 12,21" fill="#000" opacity=".12" />
  <polygon points="22,9 15,9 12,21" fill="#000" opacity=".22" />
</svg>
