<script lang="ts">
  interface Lit { color: number; n: number; absorbed: boolean; back: boolean }
  import {
    ABSORBED, advanceStates, colorsIn, jewelSurfaces, makePillar, portSide, sceneOf, SHAPES, traceLaser,
    type JewelColor, type PillarKind, type PillarShape, type PlacedJewel, type PortId,
  } from '../../domain';
  import { colorSlices } from '../presenters/portSlices';
  import { JEWEL_HEX } from '../presenters/palette';
  import { PART_POLYGON, translate } from '../presenters/shapes';

  /**
   * A small room for the tutorial, lit by the real light engine: whatever it shows is exactly
   * what the game would do. Jewels are listed by shape and top-left cell; `shots` are fired in order.
   */
  export interface SceneJewel {
    readonly shape: keyof typeof SHAPES;
    readonly color: JewelColor;
    readonly x: number;
    readonly y: number;
  }
  export interface ScenePillar {
    readonly kind: PillarKind;
    readonly shape: PillarShape;
    readonly x: number;
    readonly y: number;
  }

  let {
    width, height, jewels = [], pillars = [], shots = [], showJewels = true, empties = [], paths = true, faint = false,
  }: {
    width: number;
    height: number;
    jewels?: readonly SceneJewel[];
    pillars?: readonly ScenePillar[];
    shots?: readonly PortId[];
    /** False: the jewels stay hidden under the glass, as during a game. */
    showJewels?: boolean;
    /** Cells marked "empty" (crosses). */
    empties?: readonly number[];
    /** Draw the light's whole path (the game never shows it: it is a teaching aid). */
    paths?: boolean;
    /** Jewels drawn faintly (seen through the glass). */
    faint?: boolean;
  } = $props();

  const U = 24;
  const M = 22;
  const board = $derived({ width, height });
  const placed = $derived<PlacedJewel[]>(jewels.map((j, id) => ({
    id, shapeId: j.shape, color: j.color, cells: SHAPES[j.shape].cells.map((c) => ({ ...c, x: c.x + j.x, y: c.y + j.y })),
  })));
  const realPillars = $derived(pillars.map((p) => makePillar(p.kind, p.shape, { x: p.x, y: p.y }, ['red', 'blue', 'yellow', 'white'])));
  const surfaces = $derived(jewelSurfaces(board, placed));

  /** Where a port's torch sits, in pixels. */
  function portXY(port: PortId): [number, number] {
    const { side, index } = portSide(board, port);
    const mid = M / 2;
    if (side === 'top') return [M + (index + 0.5) * U, mid];
    if (side === 'bottom') return [M + (index + 0.5) * U, M + height * U + mid];
    if (side === 'left') return [mid, M + (index + 0.5) * U];
    return [M + width * U + mid, M + (index + 0.5) * U];
  }
  const px = (x: number, y: number): [number, number] => [M + x * U, M + y * U];

  /** Every shot, in order: its path, its colour, where it came out. */
  const results = $derived.by(() => {
    let scene = sceneOf(board, realPillars);
    return shots.map((port, i) => {
      const r = traceLaser(board, surfaces, port, scene);
      scene = { ...scene, states: advanceStates(scene, r.pillarsTouched) };
      const points = [portXY(port), ...r.impacts.map((p) => px(p.x, p.y))];
      if (r.exit !== ABSORBED) points.push(portXY(r.exit));
      return { port, n: i + 1, exit: r.exit, color: r.exit === ABSORBED ? 0 : r.color, points, prismStates: scene.states };
    });
  });
  const lit = $derived.by(() => {
    const entries: [PortId, Lit][] = [];
    for (const r of results) {
      entries.push([r.port, { color: r.color, n: r.n, absorbed: r.exit === ABSORBED, back: r.exit === r.port }]);
      if (r.exit !== ABSORBED && r.exit !== r.port) entries.push([r.exit, { color: r.color, n: r.n, absorbed: false, back: false }]);
    }
    return Object.fromEntries(entries) as Record<PortId, Lit | undefined>;
  });
  /** A pillar's outer outline (no seams between its cells). */
  function outline(p: { shape: string; cells: readonly { x: number; y: number }[] }): string {
    const x0 = Math.min(...p.cells.map((c) => c.x)), y0 = Math.min(...p.cells.map((c) => c.y));
    const x1 = Math.max(...p.cells.map((c) => c.x)) + 1, y1 = Math.max(...p.cells.map((c) => c.y)) + 1;
    const pts: [number, number][] = p.shape === 'losange2'
      ? [[(x0 + x1) / 2, y0], [x1, (y0 + y1) / 2], [(x0 + x1) / 2, y1], [x0, (y0 + y1) / 2]]
      : [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    return pts.map(([x, y]) => px(x, y).join(',')).join(' ');
  }
  const allPorts = $derived(Array.from({ length: 2 * (width + height) }, (_, i) => i));
  const lastStates = $derived(results[results.length - 1]?.prismStates ?? realPillars.map(() => 0));
  const pathColor = (mask: number) => {
    const c = colorsIn(mask);
    return c.length ? JEWEL_HEX[c[c.length - 1] ?? 'white'] : '#fffbe8';
  };
</script>

<svg class="scene" viewBox="0 0 {2 * M + width * U} {2 * M + height * U}" aria-hidden="true">
  <rect x={M} y={M} width={width * U} height={height * U} fill="#283586" stroke="rgba(160,225,255,.55)" stroke-width="1.5" />
  {#each Array.from({ length: width - 1 }, (_, i) => i + 1) as i (i)}<line x1={M + i * U} y1={M} x2={M + i * U} y2={M + height * U} class="bar" />{/each}
  {#each Array.from({ length: height - 1 }, (_, i) => i + 1) as i (i)}<line x1={M} y1={M + i * U} x2={M + width * U} y2={M + i * U} class="bar" />{/each}
  {#each empties as c (c)}
    {@const [x, y] = px((c % width) + 0.5, Math.floor(c / width) + 0.5)}
    <path d="M{x - 5} {y - 5}l10 10M{x + 5} {y - 5}l-10 10" class="cross" />
  {/each}
  {#if showJewels}
    {#each placed as j (j.id)}
      <g fill={JEWEL_HEX[j.color]} fill-opacity={faint ? 0.35 : 0.8} stroke={JEWEL_HEX[j.color]} stroke-width="1.5" stroke-linejoin="round">
        {#each j.cells as c (`${c.x},${c.y}`)}<polygon points={translate(PART_POLYGON[c.part], c.x, c.y).split(' ').map((p) => p.split(',').map(Number)).map(([x, y]) => px(x ?? 0, y ?? 0).join(',')).join(' ')} />{/each}
      </g>
    {/each}
  {/if}
  {#each realPillars as p, i (i)}
    {@const fill = p.kind === 'black' ? '#06060c' : p.kind === 'clear' ? '#b9cdf0' : JEWEL_HEX[(p.order ?? [])[(lastStates[i] ?? 0) % 4] ?? 'red']}
    <g fill={fill} fill-opacity={p.kind === 'prism' ? 0.6 : 1} stroke={fill} stroke-width="0.6">
      {#each p.cells as c (`${c.x},${c.y}`)}<polygon points={translate(PART_POLYGON[c.part], c.x, c.y).split(' ').map((q) => q.split(',').map(Number)).map(([x, y]) => px(x ?? 0, y ?? 0).join(',')).join(' ')} />{/each}
    </g>
    <polygon points={outline(p)} fill="none" stroke={p.kind === 'prism' ? '#ffd23f' : p.kind === 'clear' ? '#fff' : '#5a5a78'} stroke-width={p.kind === 'prism' ? 3 : 1.5} stroke-linejoin="round" />
  {/each}
  {#each realPillars as p, i (i)}
    {#if p.kind === 'prism'}
      {@const [lx, ly] = px(Math.min(...p.cells.map((c) => c.x)), Math.max(...p.cells.map((c) => c.y)) + 1)}
      {#each p.order ?? [] as c, k (k)}
        <circle cx={lx + 7 + k * 9} cy={ly - 7} r={k === (lastStates[i] ?? 0) % 4 ? 4 : 2.6} fill={JEWEL_HEX[c]} stroke={k === (lastStates[i] ?? 0) % 4 ? '#fff' : '#0b0f30'} stroke-width={k === (lastStates[i] ?? 0) % 4 ? 1.6 : 0.6} />
      {/each}
    {/if}
  {/each}
  {#if paths}
    {#each results as r (r.n)}
      <polyline points={r.points.map((q) => q.join(',')).join(' ')} class="path" stroke={pathColor(r.color)} />
    {/each}
  {/if}
  {#each allPorts as port (port)}
    {@const [x, y] = portXY(port)}
    {@const l = lit[port]}
    <circle cx={x} cy={y} r="8.5" fill="#a7adc7" />
    {#if l?.absorbed}
      <circle cx={x} cy={y} r="6.5" fill="#05050a" />
    {:else if l && l.color}
      {@const slices = colorSlices(l.color, { x, y }, 6.5)}
      {#if slices.length}{#each slices as s (s.color)}<path d={s.path} fill={JEWEL_HEX[s.color]} />{/each}{:else}<circle cx={x} cy={y} r="6.5" fill={pathColor(l.color)} />{/if}
    {:else if l}
      <circle cx={x} cy={y} r="6.5" fill="#2c3152" /><line x1={x - 3.5} y1={y + 3.5} x2={x + 3.5} y2={y - 3.5} stroke="#fff" stroke-width="1.3" />
    {:else}
      <circle cx={x} cy={y} r="6.5" fill="#2c3152" />
    {/if}
    {#if l}<circle cx={x - 6} cy={y + 6} r="4" fill="#ffd23f" stroke="#0b0f30" stroke-width=".8" /><text x={x - 6} y={y + 7.6} class="n">{l.n}</text>{/if}
    {#if l?.back}<circle cx={x + 6} cy={y - 6} r="4.2" fill="#fff" stroke="#0b0f30" stroke-width=".8" /><text x={x + 6} y={y - 4.2} class="n">↩</text>{/if}
  {/each}
</svg>

<style>
  .scene { width: 100%; height: auto; display: block; border-radius: 10px; background: #1c2160; max-height: 230px; }
  .bar { stroke: rgba(170, 195, 255, 0.28); stroke-width: 1; }
  .path { fill: none; stroke-width: 2.5; stroke-dasharray: 5 4; stroke-linejoin: round; stroke-linecap: round; opacity: 0.9; }
  .cross { stroke: #8f9bd6; stroke-width: 2; stroke-linecap: round; }
  .n { font-size: 5.5px; font-weight: 900; text-anchor: middle; fill: #1b1745; font-family: 'Nunito', sans-serif; }
</style>
