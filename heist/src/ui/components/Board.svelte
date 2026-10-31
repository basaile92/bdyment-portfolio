<script lang="ts">
  import { cellIndex, closedRegions, colorsIn, type PortId } from '../../domain';
  import { describeCursor, FACET_KEYS, moveCursor, WALL_KEYS, type Cursor } from '../presenters/keyboard';
  import { laserDescription } from '../presenters/palette';
  import type { Shot } from '../../application';
  import type { GameController } from '../GameController.svelte';
  import {
    BAND, facetTarget, hitTest, portCenter, portMouth, surfaceSegment, traceTarget, viewSize, wallTarget,
      type CellHit, type DrawTarget, type Hit, type Point,
  } from '../presenters/boardGeometry';
  import { GLYPH, inkOn, JEWEL_HEX, laserHex } from '../presenters/palette';
  import { PART_POLYGON, QUARTER_POLYGON, translate } from '../presenters/shapes';
  import { colorSlices } from '../presenters/portSlices';
  import Glyph from './Glyph.svelte';

  let { game }: { game: GameController } = $props();

  type Preview = { kind: 'draw'; target: DrawTarget } | { kind: 'empty'; cell: number } | null;

  let svg = $state<SVGSVGElement>();
  let areaWidth = $state(0);
  let areaHeight = $state(0);
  let hover = $state<Preview>(null);
  let pressing = $state<DrawTarget | null>(null);
  let hoveredPort = $state<PortId | null>(null);
  let cursor = $state<Cursor | null>(null);
  let announce = $state('');
  let painting: boolean | null = null;

  const board = $derived(game.heist.puzzle.board);
  const view = $derived(viewSize(board));
  /** The room is sized from BOTH dimensions available, so the whole screen always fits. */
  /**
   * The frame (8 px padding + 3 px border) is drawn INSIDE the svg, so the emitters'
   * press animation paints over the border instead of being clipped under it (WebKit).
   */
  const FRAME_PAD = 8;
  const FRAME_EDGE = 3;
  /** The whole frame (border included) fits the area, so it never spills over the screen edge or the gauge. */
  const FRAME = 2 * (FRAME_PAD + FRAME_EDGE);
  const unit = $derived(Math.max(0, Math.min((areaWidth - FRAME) / view.width, (areaHeight - FRAME) / view.height)));
  const margin = $derived(unit > 0 ? (FRAME_PAD + FRAME_EDGE) / unit : 0);
  const edgeWidth = $derived(unit > 0 ? FRAME_EDGE / unit : 0);
  const plan = $derived(game.heist.plan);
  const shown = $derived(game.over ? game.heist.puzzle.surfaces : plan);

  const cells = $derived(Array.from({ length: board.width * board.height }, (_, i) => ({ i, x: i % board.width, y: Math.floor(i / board.width) })));
  const ports = $derived(Array.from({ length: 2 * (board.width + board.height) }, (_, p) => ({ p, c: portCenter(board, p), shot: game.shotAt(p) })));
  const fills = $derived(game.over ? [] : closedRegions(board, plan));
  const segments = $derived([...shown].map(([key, s]) => ({ key, color: JEWEL_HEX[s.color], seg: surfaceSegment(key, s) })));
  const twins = $derived.by(() => {
    const shot = hoveredPort === null ? undefined : game.shotAt(hoveredPort);
    return shot ? new Set([shot.entry, shot.exit]) : new Set<PortId>();
  });
  const beams = $derived.by(() => {
    const shot = game.flashed;
    if (!shot) return null;
    const color = shot.color ? laserHex(shot.color) : '#e9eeff';
    return { shot, color, a: portCenter(board, shot.entry), b: portMouth(board, shot.entry), c: portMouth(board, shot.exit), d: portCenter(board, shot.exit) };
  });

  // ---------- pointer ----------

  function pointOf(e: PointerEvent | MouseEvent): Point {
    const m = svg?.getScreenCTM();
    if (!m) return { x: -1, y: -1 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  const hitOf = (e: PointerEvent | MouseEvent) => hitTest(board, pointOf(e));
  const cellOf = (h: CellHit) => cellIndex(board, h.x, h.y);

  function onPointerDown(e: PointerEvent) {
    const hit = hitOf(e);
    if (game.over || hit?.kind !== 'cell') return;
    svg?.setPointerCapture(e.pointerId);
    if (game.tool === 'empty') {
      painting = !game.heist.emptyCells.has(cellOf(hit));
      game.markEmpty(cellOf(hit), painting);
    } else {
      pressing = traceTarget(hit, game.color);
    }
  }

  function onPointerMove(e: PointerEvent) {
    const hit = hitOf(e);
    if (painting !== null && hit?.kind === 'cell') game.markEmpty(cellOf(hit), painting);
    if (pressing && hit?.kind === 'cell') pressing = traceTarget(hit, game.color);
    if (e.pointerType !== 'mouse') return;
    hoveredPort = hit?.kind === 'port' ? hit.port : null;
    hover = hoverFor(hit);
  }

  function hoverFor(hit: Hit | null): Preview {
    if (hit?.kind !== 'cell' || game.over) return null;
    return game.tool === 'empty' ? { kind: 'empty', cell: cellOf(hit) } : { kind: 'draw', target: traceTarget(hit, game.color) };
  }

  function onPointerUp() {
    if (pressing) game.draw(pressing.key, pressing.surface);
    pressing = null;
    painting = null;
  }

  function onPointerCancel() {
    pressing = null;
    painting = null;
  }

  function onLeave() {
    hover = null;
    hoveredPort = null;
  }

  function onClick(e: MouseEvent) {
    const hit = hitOf(e);
    if (hit?.kind === 'port') game.fire(hit.port);
  }

  // ---------- keyboard ----------

  function onKey(e: KeyboardEvent) {
    const moved = moveCursor(board, cursor, e.key);
    if (moved) {
      e.preventDefault();
      cursor = moved;
      announce = describeCursor(board, moved, game.s);
      return;
    }
    if (!cursor || game.over) return;
    if (cursor.kind === 'port' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      game.fire(cursor.port);
      const shot = game.shotAt(cursor.port);
      if (shot) announce = game.s.announceShot(shot.exit === shot.entry, laserDescription(shot.color, game.s));
      return;
    }
    if (cursor.kind === 'cell') drawFromKey(cursor.x, cursor.y, e.key.toLowerCase());
  }

  function drawFromKey(x: number, y: number, key: string) {
    const side = WALL_KEYS[key];
    const facet = FACET_KEYS[key];
    const target = side ? wallTarget(x, y, side, game.color) : facet ? facetTarget(x, y, facet, game.color) : null;
    if (target) game.draw(target.key, target.surface);
    if (key === 'v') game.markEmpty(cellIndex(board, x, y), !game.heist.emptyCells.has(cellIndex(board, x, y)));
  }

  const cursorRect = $derived.by(() => {
    if (!cursor) return null;
    if (cursor.kind === 'cell') return { x: BAND + cursor.x, y: BAND + cursor.y, w: 1, h: 1 };
    const c = portCenter(board, cursor.port);
    return { x: c.x - BAND / 2, y: c.y - BAND / 2, w: BAND, h: BAND };
  });

  // ---------- drawing helpers ----------

  const lineOf = ([a, b]: [Point, Point]) => ({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  const isRemoval = (t: DrawTarget) => {
    const cur = plan.get(t.key);
    return cur !== undefined && cur.color === t.surface.color && cur.orientation === t.surface.orientation;
  };
  const crossPath = (i: number) => {
    const x = BAND + (i % board.width) + 0.5;
    const y = BAND + Math.floor(i / board.width) + 0.5;
    return `M${x - 0.16} ${y - 0.16}l.32 .32M${x + 0.16} ${y - 0.16}l-.32 .32`;
  };
  /** Positions of 1 to 4 glyphs inside a lit sensor. */
  const glyphSpots = (n: number, c: Point): Point[] => {
    const d = 0.13;
    if (n === 1) return [c];
    if (n === 2) return [{ x: c.x - d, y: c.y }, { x: c.x + d, y: c.y }];
    if (n === 3) return [{ x: c.x, y: c.y - d }, { x: c.x - d, y: c.y + d * 0.8 }, { x: c.x + d, y: c.y + d * 0.8 }];
    return [{ x: c.x - d, y: c.y - d }, { x: c.x + d, y: c.y - d }, { x: c.x - d, y: c.y + d }, { x: c.x + d, y: c.y + d }];
  };
  const isLinked = (shot: Shot | undefined) => shot !== undefined && game.selected === shot;
  /** No hover on touch screens: the selected pair shows its colour split instead. */
  const touchOnly = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  const activePreview = $derived<Preview>(pressing ? { kind: 'draw', target: pressing } : hover);
</script>

<div class="area" bind:clientWidth={areaWidth} bind:clientHeight={areaHeight}>
  <div class="frame" style="width: {unit * view.width + 2 * (FRAME_PAD + FRAME_EDGE)}px; height: {unit * view.height + 2 * (FRAME_PAD + FRAME_EDGE)}px">
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <svg
      bind:this={svg}
      viewBox="{-margin} {-margin} {view.width + 2 * margin} {view.height + 2 * margin}"
      width={unit * view.width + 2 * (FRAME_PAD + FRAME_EDGE)}
      height={unit * view.height + 2 * (FRAME_PAD + FRAME_EDGE)}
      role="application"
      aria-label={game.s.boardLabel}
      tabindex="0"
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerCancel}
      onpointerleave={onLeave}
      onclick={onClick}
      onkeydown={onKey}
      onblur={() => (cursor = null)}
      class:painting={!game.over}
    >
      <defs>
        <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7a7f9e" /><stop offset="1" stop-color="#4a4f6e" />
        </linearGradient>
      </defs>

      <rect
        class="room-frame"
        x={-margin + edgeWidth / 2}
        y={-margin + edgeWidth / 2}
        width={view.width + 2 * margin - edgeWidth}
        height={view.height + 2 * margin - edgeWidth}
        rx={unit > 0 ? 14 / unit : 0}
        stroke-width={edgeWidth}
      />

      <g class="cells">
        {#each cells as c (c.i)}<rect x={BAND + c.x} y={BAND + c.y} width="1" height="1" />{/each}
      </g>

      {#if game.over}
        {#each game.heist.puzzle.jewels.slice(0, game.revealed) as j (j.id)}
          <g class="reveal">
            {#each j.cells as c (`${c.x},${c.y}`)}
              <polygon points={translate(PART_POLYGON[c.part], BAND + c.x, BAND + c.y)} fill={JEWEL_HEX[j.color]} opacity=".35" />
            {/each}
          </g>
        {/each}
      {/if}

      {#each fills as region, r (r)}
        <g fill={JEWEL_HEX[region.color]} stroke={JEWEL_HEX[region.color]} stroke-width=".02" opacity=".38">
          {#each region.quarters as q (`${q.x},${q.y},${q.q}`)}<polygon points={translate(QUARTER_POLYGON[q.q], BAND + q.x, BAND + q.y)} />{/each}
        </g>
      {/each}

      {#if !game.over}
        {#each [...game.heist.emptyCells] as i (i)}<path class="cross" d={crossPath(i)} />{/each}
      {/if}

      {#each segments as s (s.key)}<line {...lineOf(s.seg)} class="surface" stroke={s.color} />{/each}

      {#if activePreview?.kind === 'draw'}
        {@const removing = isRemoval(activePreview.target)}
        {@const seg = lineOf(surfaceSegment(activePreview.target.key, activePreview.target.surface))}
        <line {...seg} class={removing ? 'ghost-remove' : 'ghost'} class:pressed={pressing !== null} stroke={removing ? undefined : JEWEL_HEX[activePreview.target.surface.color]} />
      {:else if activePreview?.kind === 'empty'}
        <path class="cross ghost-cross" class:faint={game.heist.emptyCells.has(activePreview.cell)} d={crossPath(activePreview.cell)} />
      {/if}

      {#if beams}
        {#key beams.shot}
          <line x1={beams.a.x} y1={beams.a.y} x2={beams.b.x + (beams.b.x - beams.a.x) * 1.4} y2={beams.b.y + (beams.b.y - beams.a.y) * 1.4} class="beam in" />
          <line x1={beams.c.x + (beams.c.x - beams.d.x) * 1.4} y1={beams.c.y + (beams.c.y - beams.d.y) * 1.4} x2={beams.d.x} y2={beams.d.y} class="beam out" stroke={beams.color} />
        {/key}
      {/if}

      {#each ports as { p, c, shot } (p)}
        <g class="port" class:twin={twins.has(p)} class:flash={shot !== undefined && game.flashed === shot} style="transform-origin: {c.x}px {c.y}px">
          <rect x={c.x - BAND / 2} y={c.y - BAND / 2} width={BAND} height={BAND} class="hit" />
          {#if !shot}
            <rect x={c.x - 0.22} y={c.y - 0.22} width=".44" height=".44" rx=".12" fill="url(#metal)" />
            <circle cx={c.x} cy={c.y} r=".07" fill="var(--cyan)" />
          {:else}
            {#if isLinked(shot)}<circle cx={c.x} cy={c.y} r=".46" class="selected" />{/if}
            {@const slices = twins.has(p) || (touchOnly && isLinked(shot)) ? colorSlices(shot.color, c, 0.37) : []}
            {#if slices.length > 0}
              {#each slices as s (s.color)}
                <path d={s.path} fill={JEWEL_HEX[s.color]} />
                <Glyph glyph={GLYPH[s.color]} x={s.spot.x} y={s.spot.y} size={slices.length === 2 ? 0.2 : 0.16} fill={inkOn(s.mask)} />
              {/each}
              <circle cx={c.x} cy={c.y} r=".37" class="lit split" />
            {:else if shot.color}
              <circle cx={c.x} cy={c.y} r=".37" fill={laserHex(shot.color)} class="lit" />
              {@const parts = colorsIn(shot.color)}
              {#each glyphSpots(parts.length, c) as spot, i (i)}
                {@const color = parts[i]}
                {#if color}<Glyph glyph={GLYPH[color]} x={spot.x} y={spot.y} size={parts.length === 1 ? 0.28 : parts.length === 2 ? 0.2 : 0.16} fill={inkOn(shot.color)} />{/if}
              {/each}
            {:else}
              <circle cx={c.x} cy={c.y} r=".27" class="clear" />
              <line x1={c.x - 0.15} y1={c.y + 0.15} x2={c.x + 0.15} y2={c.y - 0.15} class="clear-slash" />
            {/if}
            {#if shot.exit === shot.entry}
              <circle cx={c.x + 0.3} cy={c.y - 0.3} r=".15" class="back-badge" />
              <text x={c.x + 0.3} y={c.y - 0.252} class="back">↩</text>
            {/if}
          {/if}
        </g>
      {/each}

      {#if cursorRect}<rect class="cursor" x={cursorRect.x} y={cursorRect.y} width={cursorRect.w} height={cursorRect.h} />{/if}
    </svg>
  </div>
  <p class="sr-only" aria-live="polite">{announce}</p>
</div>

<style>
  .area { flex: 1; min-height: 0; width: 100%; display: flex; align-items: center; justify-content: center; }
  .frame { flex: none; border-radius: 16px; }
  .room-frame { fill: var(--room); stroke: var(--edge); }
  svg { display: block; overflow: visible; touch-action: manipulation; cursor: pointer; outline: none; }
  svg:focus-visible .room-frame { stroke: var(--cyan); }
  svg.painting { touch-action: none; }
  .cells rect { fill: var(--cell); stroke: rgba(140, 190, 255, 0.13); stroke-width: 0.03; cursor: crosshair; }
  .surface { stroke-width: 0.13; stroke-linecap: round; }
  .cross { stroke: #8f9bd6; stroke-width: 0.07; stroke-linecap: round; fill: none; }
  .ghost { stroke-width: 0.13; stroke-linecap: round; opacity: 0.45; pointer-events: none; }
  .ghost.pressed { stroke-width: 0.2; opacity: 0.85; }
  .ghost-remove { stroke: #fff; stroke-width: 0.06; stroke-dasharray: 0.08 0.08; stroke-linecap: round; pointer-events: none; }
  .ghost-cross { opacity: 0.75; pointer-events: none; }
  .ghost-cross.faint { opacity: 0.3; }
  .hit { fill: transparent; }
  .cursor { fill: none; stroke: var(--cyan); stroke-width: 0.06; stroke-dasharray: 0.12 0.06; pointer-events: none; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); margin: 0; }
  .port { transition: transform 0.15s; }
  .port.twin { transform: scale(1.18); }
  @media (hover: hover) { .port:hover { transform: scale(1.18); } }
  .port.flash { animation: flash 0.5s 0.3s backwards; }
  @keyframes flash { from { transform: scale(1.7); } to { transform: scale(1); } }
  .lit { stroke: #fff; stroke-width: 0.06; }
  .lit.split { fill: none; }
  .clear { fill: none; stroke: #fff; stroke-width: 0.08; }
  .clear-slash { stroke: #fff; stroke-width: 0.06; stroke-linecap: round; }
  .selected { fill: none; stroke: var(--cyan); stroke-width: 0.08; }
  .back-badge { fill: #0b0f30; stroke: #fff; stroke-width: 0.03; }
  .back { font-size: 0.2px; font-weight: 900; text-anchor: middle; fill: #fff; pointer-events: none; }
  .beam { stroke-width: 0.12; stroke-linecap: round; stroke-dasharray: 2; pointer-events: none; }
  .beam.in { stroke: #e9eeff; animation: beam-in 0.3s ease-in forwards; }
  .beam.out { stroke-dashoffset: 2; animation: beam-out 0.3s 0.3s ease-out forwards; }
  @keyframes beam-in { from { stroke-dashoffset: 2; opacity: 1; } 70% { stroke-dashoffset: 0; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
  @keyframes beam-out { from { stroke-dashoffset: 2; opacity: 1; } 70% { stroke-dashoffset: 0; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
  .reveal { animation: pop 0.35s ease-out; transform-box: fill-box; transform-origin: center; }
  @keyframes pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
