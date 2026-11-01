<script lang="ts">
  import { shapeSize, type ShapeCell } from '../../../domain';
  import { PART_POLYGON, translate } from '../../presenters/shapes';

  /** A jewel drawn to grid scale, with the grid lines visible through it. */
  let { cells, color, cell = 14 }: { cells: readonly ShapeCell[]; color: string; cell?: number } = $props();

  const size = $derived(shapeSize(cells));
  const squares = $derived(
    Array.from({ length: size.width * size.height }, (_, i) => ({ x: i % size.width, y: Math.floor(i / size.width) })),
  );
</script>

<svg
  viewBox="-0.05 -0.05 {size.width + 0.1} {size.height + 0.1}"
  width={size.width * cell}
  height={size.height * cell}
  aria-hidden="true"
>
  {#each squares as s (`${s.x},${s.y}`)}
    <rect x={s.x} y={s.y} width="1" height="1" fill="var(--cell)" stroke="rgba(140,190,255,.35)" stroke-width=".06" />
  {/each}
  {#each cells as c (`${c.x},${c.y}`)}
    <polygon points={translate(PART_POLYGON[c.part], c.x, c.y)} fill={color} stroke={color} stroke-width=".04" />
  {/each}
  <g stroke="#0b0f30" stroke-width=".08" opacity=".55">
    {#each Array.from({ length: size.width - 1 }, (_, i) => i + 1) as x (x)}<line x1={x} y1="0" x2={x} y2={size.height} />{/each}
    {#each Array.from({ length: size.height - 1 }, (_, i) => i + 1) as y (y)}<line x1="0" y1={y} x2={size.width} y2={y} />{/each}
  </g>
</svg>
