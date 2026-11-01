<script lang="ts">
  import type { Glyph } from '../presenters/palette';

  /** The shape that doubles a jewel colour (so colour is never the only cue). Drawn in SVG user units. */
  let { glyph, x, y, size, fill }: { glyph: Glyph; x: number; y: number; size: number; fill: string } = $props();

  const h = $derived(size / 2);
</script>

{#if glyph === 'triangle'}
  <polygon points="{x},{y - h} {x + h},{y + h * 0.8} {x - h},{y + h * 0.8}" {fill} />
{:else if glyph === 'square'}
  <rect x={x - h * 0.85} y={y - h * 0.85} width={h * 1.7} height={h * 1.7} {fill} />
{:else if glyph === 'circle'}
  <circle cx={x} cy={y} r={h * 0.9} {fill} />
{:else}
  <polygon points="{x},{y - h} {x + h},{y} {x},{y + h} {x - h},{y}" {fill} />
{/if}
