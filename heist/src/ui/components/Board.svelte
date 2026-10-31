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
  import Torch from './Torch.svelte';

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
    const a = portCenter(board, shot.entry);
    const b = portMouth(board, shot.entry);
    const c = portMouth(board, shot.exit);
    const d = portCenter(board, shot.exit);
    /** How far the light is seen under the frosted glass before it disappears (never the whole path). */
    const INSIDE = 1.1;
    const inward = (from: Point, to: Point): Point => {
      const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      return { x: to.x + ((to.x - from.x) / len) * INSIDE, y: to.y + ((to.y - from.y) / len) * INSIDE };
    };
    const inEnd = inward(a, b);
    const outStart = inward(d, c);
    return {
      shot, color, a, b, c, d, inEnd, outStart,
    };
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
    const d = 0.075;
    if (n === 1) return [c];
    if (n === 2) return [{ x: c.x - d, y: c.y }, { x: c.x + d, y: c.y }];
    if (n === 3) return [{ x: c.x, y: c.y - d }, { x: c.x - d, y: c.y + d * 0.8 }, { x: c.x + d, y: c.y + d * 0.8 }];
    return [{ x: c.x - d, y: c.y - d }, { x: c.x + d, y: c.y - d }, { x: c.x - d, y: c.y + d }, { x: c.x + d, y: c.y + d }];
  };
  /** Radius of a torch's lens, where the result colour shows. */
  const LENS = 0.205;
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
        <!-- Frosted glass roof: light grain + slanted reflections. -->
        <filter id="frost" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7" />
          <feColorMatrix values="0 0 0 0 0.8  0 0 0 0 0.88  0 0 0 0 1  0 0 0 0.16 0" />
        </filter>
        <linearGradient id="sheen" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="3" y2="3" spreadMethod="repeat">
          <stop offset="0" stop-color="#fff" stop-opacity="0" />
          <stop offset=".42" stop-color="#fff" stop-opacity="0" />
          <stop offset=".5" stop-color="#fff" stop-opacity=".13" />
          <stop offset=".62" stop-color="#fff" stop-opacity="0" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </linearGradient>
        <!-- Each pane catches light on its top-left edge and sits in shadow on the bottom-right one. -->
        <pattern id="pane" width="1" height="1" patternUnits="userSpaceOnUse" x={BAND} y={BAND}>
          <path d="M.08 .92V.08H.92" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".03" />
          <path d="M.08 .92H.92V.08" fill="none" stroke="#050822" stroke-opacity=".35" stroke-width=".03" />
        </pattern>
        <linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#eef1fa" /><stop offset=".45" stop-color="#9da3bd" /><stop offset="1" stop-color="#4b5070" />
        </linearGradient>
        <!-- Dark glass in front of the mirror reflector of a switched-off torch. -->
        <radialGradient id="reflector" cx=".5" cy=".5" r=".55">
          <stop offset="0" stop-color="#4c5274" /><stop offset=".6" stop-color="#2c3152" /><stop offset="1" stop-color="#171b38" />
        </radialGradient>
        <radialGradient id="torchlight">
          <stop offset="0" stop-color="#fff" stop-opacity=".9" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
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

      <!-- Top view of the jeweller's: opaque frosted glass panes in a steel frame, laser emitters on the walls. -->
      <g class="roof" aria-hidden="true">
        <rect class="glass" x={BAND} y={BAND} width={board.width} height={board.height} />
        <rect x={BAND} y={BAND} width={board.width} height={board.height} filter="url(#frost)" />
        <rect x={BAND} y={BAND} width={board.width} height={board.height} fill="url(#pane)" />
        <rect x={BAND} y={BAND} width={board.width} height={board.height} fill="url(#sheen)" />
      </g>
      <g class="cells">
        {#each cells as c (c.i)}<rect x={BAND + c.x} y={BAND + c.y} width="1" height="1" />{/each}
      </g>
      <g class="sensors" aria-hidden="true">
        {#each cells as c (c.i)}<circle cx={BAND + c.x + 0.5} cy={BAND + c.y + 0.5} r=".035" />{/each}
      </g>
      <rect class="facade" x={BAND - 0.06} y={BAND - 0.06} width={board.width + 0.12} height={board.height + 0.12} rx=".08" />

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
          <defs>
            <linearGradient id="beam-in" gradientUnits="userSpaceOnUse" x1={beams.a.x} y1={beams.a.y} x2={beams.inEnd.x} y2={beams.inEnd.y}>
              <stop offset="0" stop-color="#fffbe8" stop-opacity=".95" /><stop offset="1" stop-color="#fffbe8" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="beam-out" gradientUnits="userSpaceOnUse" x1={beams.d.x} y1={beams.d.y} x2={beams.outStart.x} y2={beams.outStart.y}>
              <stop offset="0" stop-color={beams.color} stop-opacity=".95" /><stop offset="1" stop-color={beams.color} stop-opacity="0" />
            </linearGradient>
          </defs>
          <!-- The torch shines through the glass wall, its beam vanishes under the frosted roof… -->
          <line x1={beams.a.x} y1={beams.a.y} x2={beams.inEnd.x} y2={beams.inEnd.y} stroke="url(#beam-in)" class="beam in" class:wide={twins.has(beams.shot.entry)} />
          <circle cx={beams.b.x} cy={beams.b.y} r=".4" class="splash in" fill="url(#torchlight)" />
          <!-- …and the light comes out elsewhere, tinted by the jewels it touched. -->
          <circle cx={beams.c.x} cy={beams.c.y} r=".4" class="splash out" fill={beams.color} />
          <line x1={beams.d.x} y1={beams.d.y} x2={beams.outStart.x} y2={beams.outStart.y} stroke="url(#beam-out)" class="beam out" class:wide={twins.has(beams.shot.exit)} />
        {/key}
      {/if}

      {#each ports as { p, c, shot } (p)}
        <g class="port" class:twin={twins.has(p)} class:flash-in={shot !== undefined && game.flashed === shot && p === shot.entry}
          class:flash={shot !== undefined && game.flashed === shot && p === shot.exit} style="transform-origin: {c.x}px {c.y}px">
          <rect x={c.x - BAND / 2} y={c.y - BAND / 2} width={BAND} height={BAND} class="hit" />
          {#if !shot}
            <Torch x={c.x} y={c.y} />
          {:else}
            {@const slices = twins.has(p) || (touchOnly && isLinked(shot)) ? colorSlices(shot.color, c, LENS) : []}
            {#if game.flashed === shot}
              <!-- While the laser travels, the emitter still looks idle; the result shows when the light comes out. -->
              <g class="idle-until-out">
                <Torch x={c.x} y={c.y} />
              </g>
            {/if}
            <g class:result-on-arrival={game.flashed === shot}>
            {#if isLinked(shot)}<circle cx={c.x} cy={c.y} r=".33" class="selected" />{/if}
            <!-- The torch itself takes the colour of the light that came out: same size, lens tinted. -->
            <circle cx={c.x} cy={c.y} r=".26" fill="url(#bezel)" />
            {#if slices.length > 0}
              {#each slices as s (s.color)}
                <path d={s.path} fill={JEWEL_HEX[s.color]} />
                {#if game.symbols}<Glyph glyph={GLYPH[s.color]} x={s.spot.x} y={s.spot.y} size={slices.length === 2 ? 0.11 : 0.09} fill={inkOn(s.mask)} />{/if}
              {/each}
            {:else if shot.color}
              <circle cx={c.x} cy={c.y} r={LENS} fill={laserHex(shot.color)} />
              {@const parts = colorsIn(shot.color)}
              {#each glyphSpots(parts.length, c) as spot, i (i)}
                {@const color = parts[i]}
                {#if color && game.symbols}<Glyph glyph={GLYPH[color]} x={spot.x} y={spot.y} size={parts.length === 1 ? 0.16 : parts.length === 2 ? 0.11 : 0.09} fill={inkOn(shot.color)} />{/if}
              {/each}
            {:else}
              <circle cx={c.x} cy={c.y} r={LENS} fill="url(#reflector)" />
              <line x1={c.x - 0.11} y1={c.y + 0.11} x2={c.x + 0.11} y2={c.y - 0.11} class="clear-slash" />
            {/if}
            <circle cx={c.x} cy={c.y} r={LENS} class="lens-rim" />
            <path d="M{c.x - 0.15} {c.y - 0.06}a.17 .17 0 0 1 .11 -.105" class="gloss" />
            {#if shot.exit === shot.entry}
              <circle cx={c.x + 0.22} cy={c.y - 0.22} r=".1" class="back-badge" />
              <text x={c.x + 0.22} y={c.y - 0.187} class="back">↩</text>
            {/if}
            </g>
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
  .room-frame { fill: #1c2160; stroke: var(--edge); }
  svg { display: block; overflow: visible; touch-action: manipulation; cursor: pointer; outline: none; }
  svg:focus-visible .room-frame { stroke: var(--cyan); }
  svg.painting { touch-action: none; }
  .glass { fill: #283586; }
  /* Steel glazing bars between the panes, with a faint highlight. */
  .cells rect { fill: transparent; stroke: rgba(170, 195, 255, 0.28); stroke-width: 0.045; cursor: crosshair; }
  /* Floor pressure sensors under the glass: the reason you must drop exactly on the jewels. */
  .sensors { fill: #ff4d6d; opacity: 0.45; animation: arm 2.4s ease-in-out infinite; pointer-events: none; }
  @keyframes arm { 50% { opacity: 0.18; } }
  .facade { fill: none; stroke: rgba(160, 225, 255, 0.55); stroke-width: 0.05; pointer-events: none; }
  .roof { pointer-events: none; }
  .housing { stroke: #23284f; stroke-width: 0.03; }
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
  .port.flash-in { animation: kick 0.35s; }
  .result-on-arrival { animation: appear 0.2s 0.95s backwards; }
  .idle-until-out { opacity: 0; animation: idle 0.95s; }
  @keyframes appear { from { opacity: 0; } }
  @keyframes idle { from, 95% { opacity: 1; } to { opacity: 0; } }
  .port.flash { animation: flash 0.5s 0.95s backwards; }
  @keyframes kick { 40% { transform: scale(1.25); } }
  @keyframes flash { from { transform: scale(1.7); } to { transform: scale(1); } }
  .lens-rim { fill: none; stroke: #20254a; stroke-width: 0.018; }
  .gloss { fill: none; stroke: #fff; stroke-opacity: 0.6; stroke-width: 0.026; stroke-linecap: round; }
  .clear-slash { stroke: #fff; stroke-width: 0.04; stroke-linecap: round; }
  .selected { fill: none; stroke: var(--cyan); stroke-width: 0.06; }
  .back-badge { fill: #0b0f30; stroke: #fff; stroke-width: 0.03; }
  .back { font-size: 0.14px; font-weight: 900; text-anchor: middle; fill: #fff; pointer-events: none; }
  /* In: the torch beam fades in, then dies under the glass. Out: the tinted light spills out at the exit. */
  /* Straight beam as wide as the torch head; it widens with the torch when the torch is hovered. */
  .beam { pointer-events: none; opacity: 0; stroke-width: 0.52; stroke-linecap: butt; transition: stroke-width 0.15s; }
  .beam.wide { stroke-width: 0.614; }
  .beam.in { animation: shine 0.9s ease-out; }
  .beam.out { animation: shine 1s 0.55s ease-out; }
  @keyframes shine { 0% { opacity: 0; } 25%, 60% { opacity: 1; } 100% { opacity: 0; } }
  .splash { pointer-events: none; opacity: 0; transform-box: fill-box; transform-origin: center; }
  .splash.in { animation: splash 0.6s 0.25s ease-out; }
  .splash.out { animation: splash 0.6s 0.5s ease-out; }
  @keyframes splash { 0% { opacity: 0; transform: scale(0.3); } 30% { opacity: 0.7; } 100% { opacity: 0; transform: scale(1.6); } }
  .reveal { animation: pop 0.35s ease-out; transform-box: fill-box; transform-origin: center; }
  @keyframes pop { from { transform: scale(0.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
