<script lang="ts" module>
  import { grainTile as tile } from '../presenters/grain';
  /** Drawn once for every room. */
  const GRAIN = tile();
</script>

<script lang="ts">
  import { ABSORBED, cellIndex, closedRegions, colorsIn, keyInsideCells, maskOf, pillarCells, pillarSurfaces, prismColor, type Pillar, type PortId } from '../../domain';
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

  type Preview = { kind: 'draw'; target: DrawTarget } | { kind: 'empty'; cell: number } | { kind: 'erase'; target: DrawTarget; cell: number } | null;

  let svg = $state<SVGSVGElement>();
  let areaEl = $state<HTMLDivElement>();
  let areaWidth = $state(0);
  let areaHeight = $state(0);
  let hover = $state<Preview>(null);
  let pressing = $state<DrawTarget | null>(null);
  let hoveredPort = $state<PortId | null>(null);
  let cursor = $state<Cursor | null>(null);
  let announce = $state('');
  let painting: boolean | null = null;
  let erasing = false;

  const board = $derived(game.prismjack.puzzle.board);
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
  const plan = $derived(game.prismjack.plan);
  /** Test numbers on the torches stay readable (9 px at least) on big rooms and small screens. */
  const badgeScale = $derived(unit > 0 ? Math.min(2, Math.max(1, 9 / (0.13 * unit))) : 1);
  /** Pillar cells: nothing is drawn there, nor on their borders. */
  const blocked = $derived(pillarCells(board, game.prismjack.puzzle.pillars));
  const shown = $derived(game.over ? game.prismjack.puzzle.surfaces : plan);

  const cells = $derived(Array.from({ length: board.width * board.height }, (_, i) => ({ i, x: i % board.width, y: Math.floor(i / board.width) })));
  const ports = $derived(Array.from({ length: 2 * (board.width + board.height) }, (_, p) => ({ p, c: portCenter(board, p), shot: game.shotAt(p) })));
  const fills = $derived(game.over ? [] : closedRegions(board, plan));
  const segments = $derived([...shown].map(([key, s]) => ({ key, color: JEWEL_HEX[s.color], seg: surfaceSegment(key, s) })));
  /** Tutorial: the outline to draw over, dotted, while the lesson asks for the jewels. */
  const ghost = $derived(game.coachGhost ? [...game.prismjack.puzzle.surfaces].map(([key, s]) => ({ key, seg: surfaceSegment(key, s) })) : []);
  const twins = $derived.by(() => {
    const shot = hoveredPort === null ? undefined : game.shotAt(hoveredPort);
    return shot ? new Set([shot.entry, shot.exit]) : new Set<PortId>();
  });
  const beams = $derived.by(() => {
    const shot = game.flashed;
    if (!shot) return null;
    /** Never blended: one stripe per jewel colour, side by side. */
    const parts = colorsIn(shot.color);
    const stripes = parts.length > 0 ? parts.map((c) => JEWEL_HEX[c]) : ['#e9eeff'];
    const a = portCenter(board, shot.entry);
    const b = portMouth(board, shot.entry);
    /** Swallowed by a black pillar: nothing comes out anywhere. */
    const absorbed = shot.exit === ABSORBED;
    const c = absorbed ? b : portMouth(board, shot.exit);
    const d = absorbed ? a : portCenter(board, shot.exit);
    /** How far the light is seen under the frosted glass before it disappears (never the whole path). */
    const INSIDE = 1.1;
    const inward = (from: Point, to: Point): Point => {
      const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
      return { x: to.x + ((to.x - from.x) / len) * INSIDE, y: to.y + ((to.y - from.y) / len) * INSIDE };
    };
    const inEnd = inward(a, b);
    const outStart = inward(d, c);
    const len = Math.hypot(outStart.x - d.x, outStart.y - d.y) || 1;
    /** Unit vector across the outgoing beam, to lay the colour stripes side by side. */
    const across = { x: -(outStart.y - d.y) / len, y: (outStart.x - d.x) / len };
    return {
      shot, stripes, a, b, c, d, inEnd, outStart, across, absorbed,
    };
  });

  /** The lane a hovered (or finger-aimed) torch lights, straight across the room. */
  const lane = $derived.by(() => {
    if (hoveredPort === null) return null;
    /** It starts from the torch itself (drawn under it) and runs to the far side of the room. */
    const from = portCenter(board, hoveredPort);
    const mouth = portMouth(board, hoveredPort);
    const w = 0.614;
    const vertical = mouth.x === from.x;
    const to = vertical
      ? { x: from.x, y: mouth.y > from.y ? BAND + board.height : BAND }
      : { x: mouth.x > from.x ? BAND + board.width : BAND, y: from.y };
    const rect = vertical
      ? { x: from.x - w / 2, y: Math.min(from.y, to.y), w, h: Math.abs(to.y - from.y) }
      : { x: Math.min(from.x, to.x), y: from.y - w / 2, w: Math.abs(to.x - from.x), h: w };
    return { ...rect, from, to };
  });

  // ---------- pointer ----------

  /**
   * Touch drawing: the finger hides the cell, so a loupe above it shows the spot magnified,
   * and a light haptic tick marks each change of target.
   */
  type Loupe = { left: number; top: number; at: Point };
  let loupe = $state<Loupe | null>(null);
  let felt = '';
  const LOUPE_PX = 130;
  const LOUPE_ZOOM = 2;
  /** How far above the finger the loupe floats, so the finger never covers it. */
  const LOUPE_LIFT = 46;

  function showLoupe(e: PointerEvent) {
    const box = areaEl?.getBoundingClientRect();
    if (!box || e.pointerType === 'mouse') return;
    const left = Math.min(Math.max(e.clientX - box.left - LOUPE_PX / 2, -box.left + 4), window.innerWidth - box.left - LOUPE_PX - 4);
    const top = Math.max(e.clientY - box.top - LOUPE_PX - LOUPE_LIFT, -box.top + 4);
    loupe = { left, top, at: pointOf(e) };
  }

  /** One tick per new target (wall or facet, or cell when marking empty), never twice for the same. */
  function feel(target: string) {
    if (target === felt) return;
    felt = target;
    game.feel();
  }

  const targetId = (t: DrawTarget) => `${t.key}:${t.surface.orientation}`;

  /** Touch: the finger slides over the torches to aim (like a hover), the light fires on release. */
  let aiming = false;
  let skipClick = false;

  function pointOf(e: PointerEvent | MouseEvent): Point {
    const m = svg?.getScreenCTM();
    if (!m) return { x: -1, y: -1 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  const hitOf = (e: PointerEvent | MouseEvent) => hitTest(board, pointOf(e));
  const cellOf = (h: CellHit) => cellIndex(board, h.x, h.y);

  /** Only the main button draws or fires: the right button just changes colour (contextmenu). */
  const secondaryButton = (e: PointerEvent) => e.pointerType === 'mouse' && e.button !== 0;

  function onPointerDown(e: PointerEvent) {
    if (secondaryButton(e)) return;
    const hit = hitOf(e);
    skipClick = false;
    if (e.pointerType !== 'mouse' && hit?.kind === 'port') {
      svg?.setPointerCapture(e.pointerId);
      aiming = true;
      hoveredPort = hit.port;
      return;
    }
    if (game.over || hit?.kind !== 'cell' || blocked.has(cellOf(hit))) return;
    startStroke(e, hit);
  }

  /** Drawing, painting empty cells or erasing: follows the pointer until it lifts. */
  function startStroke(e: PointerEvent, hit: CellHit) {
    svg?.setPointerCapture(e.pointerId);
    felt = '';
    if (game.tool === 'erase') {
      erasing = true;
      eraseUnder(hit);
    } else if (game.tool === 'empty') {
      painting = !game.prismjack.emptyCells.has(cellOf(hit));
      game.markEmpty(cellOf(hit), painting);
    } else {
      pressing = traceTarget(hit, game.color);
    }
    touchFeedback(e, hit);
  }

  function touchFeedback(e: PointerEvent, hit: CellHit) {
    if (e.pointerType === 'mouse') return;
    showLoupe(e);
    feel(pressing ? targetId(pressing) : erasing ? targetId(traceTarget(hit, game.color)) : `cell:${cellOf(hit)}`);
  }

  function onPointerMove(e: PointerEvent) {
    const hit = hitOf(e);
    if (aiming) aimAt(hit, pointOf(e));
    else track(e, hit);
  }

  /** How far from a torch's centre the finger may stray (view units) before it lets go of it. */
  const AIM_REACH = BAND / 2 + 0.08;

  /** Aiming holds a torch only while the finger stays on it: leave it and nothing is aimed (or fired). */
  function aimAt(hit: Hit | null, at: Point) {
    if (hit?.kind !== 'port') {
      hoveredPort = null;
      return;
    }
    const c = portCenter(board, hit.port);
    hoveredPort = Math.abs(at.x - c.x) <= AIM_REACH && Math.abs(at.y - c.y) <= AIM_REACH ? hit.port : null;
  }

  function track(e: PointerEvent, hit: Hit | null) {
    if (hit?.kind === 'cell') trackDrawing(e, hit);
    if (e.pointerType !== 'mouse') return;
    hoveredPort = hit?.kind === 'port' ? hit.port : null;
    hover = hoverFor(hit);
  }

  /** Eraser: whatever is drawn at the target under the pointer, and the cell's "empty" mark. */
  function eraseUnder(hit: CellHit) {
    game.erase(traceTarget(hit, game.color).key, cellOf(hit));
  }

  function trackDrawing(e: PointerEvent, hit: CellHit) {
    if (erasing) {
      eraseUnder(hit);
      touchFeedback(e, hit);
      return;
    }
    if (painting !== null) game.markEmpty(cellOf(hit), painting);
    if (pressing) pressing = traceTarget(hit, game.color);
    if (pressing || painting !== null) touchFeedback(e, hit);
  }

  function hoverFor(hit: Hit | null): Preview {
    if (hit?.kind !== 'cell' || game.over || blocked.has(cellOf(hit))) return null;
    if (game.tool === 'erase') return { kind: 'erase', target: traceTarget(hit, game.color), cell: cellOf(hit) };
    return game.tool === 'empty' ? { kind: 'empty', cell: cellOf(hit) } : { kind: 'draw', target: traceTarget(hit, game.color) };
  }

  function onPointerUp() {
    if (aiming) {
      if (hoveredPort !== null) game.fire(hoveredPort);
      aiming = false;
      skipClick = true;
      hoveredPort = null;
      return;
    }
    if (pressing) game.draw(pressing.key, pressing.surface);
    pressing = null;
    painting = null;
    erasing = false;
    loupe = null;
  }

  function onPointerCancel() {
    if (aiming) hoveredPort = null;
    aiming = false;
    pressing = null;
    painting = null;
    erasing = false;
    loupe = null;
  }

  function onLeave() {
    if (aiming) return;
    hover = null;
    hoveredPort = null;
  }

  function onClick(e: MouseEvent) {
    if (skipClick) {
      skipClick = false;
      return;
    }
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
    if (key === 'v') game.markEmpty(cellIndex(board, x, y), !game.prismjack.emptyCells.has(cellIndex(board, x, y)));
  }

  const cursorRect = $derived.by(() => {
    if (!cursor) return null;
    if (cursor.kind === 'cell') return { x: BAND + cursor.x, y: BAND + cursor.y, w: 1, h: 1 };
    const c = portCenter(board, cursor.port);
    return { x: c.x - BAND / 2, y: c.y - BAND / 2, w: BAND, h: BAND };
  });

  // ---------- drawing helpers ----------

  /** Bounding box and centre of a pillar, in view units. */
  const pillarBox = (pillar: Pillar) => {
    const xs = pillar.cells.map((c) => c.x), ys = pillar.cells.map((c) => c.y);
    const x0 = BAND + Math.min(...xs), y0 = BAND + Math.min(...ys);
    const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
    return { x: x0, y: y0, w, h, cx: x0 + w / 2, cy: y0 + h / 2 };
  };
  /** 1 for the first torch lit, 2 for the next… */
  const orderOf = (shot: Shot) => game.prismjack.shots.indexOf(shot) + 1;
  const pillarPath = (pillar: Pillar) =>
    pillar.cells.map((c) => `M${translate(PART_POLYGON[c.part], BAND + c.x, BAND + c.y).trim().split(/\s+/).join('L')}Z`).join('');
  /** A pillar's outline only (no inner grid lines): its outer straight sides and its diagonals. */
  const pillarOutline = (pillar: Pillar) => [...pillarSurfaces(board, [pillar])].map(([key, s]) => lineOf(surfaceSegment(key, s)));
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
  /** Radius of a torch's lens, where the result colour shows. */
  const LENS = 0.205;
  const isLinked = (shot: Shot | undefined) => shot !== undefined && game.selected === shot;
  const activePreview = $derived.by<Preview>(() => {
    const p: Preview = pressing ? { kind: 'draw', target: pressing } : hover;
    return p?.kind === 'draw' && keyInsideCells(board, p.target.key, blocked) ? null : p;
  });
</script>

{#snippet drawing()}
      {#each fills as region, r (r)}
        <g fill={JEWEL_HEX[region.color]} stroke={JEWEL_HEX[region.color]} stroke-width=".02" opacity=".38">
          {#each region.quarters as q (`${q.x},${q.y},${q.q}`)}<polygon points={translate(QUARTER_POLYGON[q.q], BAND + q.x, BAND + q.y)} />{/each}
        </g>
      {/each}

      {#if !game.over}
        {#each [...game.prismjack.emptyCells] as i (i)}<path class="cross" d={crossPath(i)} />{/each}
      {/if}

      {#each ghost as g (g.key)}<line {...lineOf(g.seg)} class="ghost" />{/each}
      {#each segments as s (s.key)}<line {...lineOf(s.seg)} class="surface" stroke={s.color} />{/each}

      {#if activePreview?.kind === 'draw'}
        {@const removing = isRemoval(activePreview.target)}
        {@const seg = lineOf(surfaceSegment(activePreview.target.key, activePreview.target.surface))}
        <line {...seg} class={removing ? 'ghost-remove' : 'ghost'} class:pressed={pressing !== null} stroke={removing ? undefined : JEWEL_HEX[activePreview.target.surface.color]} />
      {:else if activePreview?.kind === 'erase'}
        {@const existing = plan.get(activePreview.target.key)}
        {#if existing}<line {...lineOf(surfaceSegment(activePreview.target.key, existing))} class="ghost-remove" />{/if}
        {#if game.prismjack.emptyCells.has(activePreview.cell)}<path class="cross ghost-cross faint" d={crossPath(activePreview.cell)} />{/if}
      {:else if activePreview?.kind === 'empty'}
        <path class="cross ghost-cross" class:faint={game.prismjack.emptyCells.has(activePreview.cell)} d={crossPath(activePreview.cell)} />
      {/if}
{/snippet}

<div class="area" bind:this={areaEl} bind:clientWidth={areaWidth} bind:clientHeight={areaHeight}>
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
      oncontextmenu={(e) => {
        e.preventDefault();
        game.cycleColor();
      }}
      onkeydown={onKey}
      onblur={() => (cursor = null)}
      class:painting={!game.over}
    >
      <defs>
        <!-- Frosted glass roof: light grain + slanted reflections. -->
        <!-- A small grain tile drawn once (a live turbulence filter repainted the whole room on every change). -->
        <pattern id="frost" patternUnits="userSpaceOnUse" width="2" height="2">
          <image href={GRAIN} width="2" height="2" preserveAspectRatio="none" />
        </pattern>
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
        <rect x={BAND} y={BAND} width={board.width} height={board.height} fill="url(#frost)" />
        <rect x={BAND} y={BAND} width={board.width} height={board.height} fill="url(#pane)" />
        <rect x={BAND} y={BAND} width={board.width} height={board.height} fill="url(#sheen)" />
      </g>
      <g class="cells">
        {#each cells as c (c.i)}<rect x={BAND + c.x} y={BAND + c.y} width="1" height="1" />{/each}
      </g>
      <g class="sensors" aria-hidden="true">
        {#each cells as c (c.i)}<circle cx={BAND + c.x + 0.5} cy={BAND + c.y + 0.5} r=".035" />{/each}
      </g>
      {#each game.prismjack.puzzle.pillars ?? [] as pillar, i (i)}
        {@const box = pillarBox(pillar)}
        {@const current = pillar.kind === 'prism' ? prismColor(pillar, game.prismjack.pillarStates[i] ?? 0) : null}
        <!-- Pillars stand above the glass: visible from the start. -->
        <g class="pillar {pillar.kind}">
          <!-- One path for the whole pillar: separate cell shapes would leave hairline seams between them. -->
          <path d={pillarPath(pillar)} class="pillar-body" fill={current ? JEWEL_HEX[current] : undefined} />
          {#each pillarOutline(pillar) as seg, k (k)}<line {...seg} class="pillar-edge" />{/each}
          {#if pillar.kind === 'prism' && pillar.order}
            <!-- Its four colours in order; the one it will give next is the big one. -->
            {@const step = Math.min(0.2, box.w / 5)}
            <rect x={box.cx - step * 2} y={box.cy - step * 0.55} width={step * 4} height={step * 1.1} rx={step * 0.55} class="prism-legend" />
            {#each pillar.order as color, k (k)}
              {@const now = k === (game.prismjack.pillarStates[i] ?? 0) % 4}
              <circle cx={box.cx - step * 1.5 + k * step} cy={box.cy} r={now ? step * 0.42 : step * 0.26} fill={JEWEL_HEX[color]} class:now />
              {#if game.symbols}<Glyph glyph={GLYPH[color]} x={box.cx - step * 1.5 + k * step} y={box.cy} size={now ? step * 0.5 : step * 0.32} fill={inkOn(maskOf(color))} />{/if}
            {/each}
          {/if}
        </g>
      {/each}
      <rect class="facade" x={BAND - 0.06} y={BAND - 0.06} width={board.width + 0.12} height={board.height + 0.12} rx=".08" />

      {#if game.over}
        {#each game.prismjack.puzzle.jewels.slice(0, game.revealed) as j (j.id)}
          <g class="reveal">
            {#each j.cells as c (`${c.x},${c.y}`)}
              <polygon points={translate(PART_POLYGON[c.part], BAND + c.x, BAND + c.y)} fill={JEWEL_HEX[j.color]} opacity=".35" />
            {/each}
          </g>
        {/each}
      {/if}

      {@render drawing()}

      {#if lane}
        <!-- Soft light lane: brightest at the torch, fading out across the room. -->
        <g class="lane">
          <defs>
            <linearGradient id="lane-fill" gradientUnits="userSpaceOnUse" x1={lane.from.x} y1={lane.from.y} x2={lane.to.x} y2={lane.to.y}>
              <stop offset="0" stop-color="#fffbe8" stop-opacity=".28" /><stop offset=".6" stop-color="#fffbe8" stop-opacity=".1" /><stop offset="1" stop-color="#fffbe8" stop-opacity=".03" />
            </linearGradient>
          </defs>
          <rect x={lane.x} y={lane.y} width={lane.w} height={lane.h} fill="url(#lane-fill)" />
        </g>
      {/if}

      {#if beams}
        {#key beams.shot}
          <defs>
            <linearGradient id="beam-in" gradientUnits="userSpaceOnUse" x1={beams.a.x} y1={beams.a.y} x2={beams.inEnd.x} y2={beams.inEnd.y}>
              <stop offset="0" stop-color="#fffbe8" stop-opacity=".95" /><stop offset="1" stop-color="#fffbe8" stop-opacity="0" />
            </linearGradient>
            {#each beams.stripes as color, i (i)}
              <linearGradient id="beam-out-{i}" gradientUnits="userSpaceOnUse" x1={beams.d.x} y1={beams.d.y} x2={beams.outStart.x} y2={beams.outStart.y}>
                <stop offset="0" stop-color={color} stop-opacity=".95" /><stop offset="1" stop-color={color} stop-opacity="0" />
              </linearGradient>
            {/each}
          </defs>
          <!-- The torch shines through the glass wall, its beam vanishes under the frosted roof… -->
          <line x1={beams.a.x} y1={beams.a.y} x2={beams.inEnd.x} y2={beams.inEnd.y} stroke="url(#beam-in)" class="beam in" class:wide={twins.has(beams.shot.entry)} />
          <circle cx={beams.b.x} cy={beams.b.y} r=".4" class="splash in" fill="url(#torchlight)" />
          <!-- …and the light comes out elsewhere, tinted by the jewels it touched (unless a black pillar swallowed it). -->
          {@const splash = colorSlices(beams.shot.color, beams.c, 0.4)}
          {#if !beams.absorbed}
          <g class="splash out">
            {#if splash.length > 0}
              {#each splash as s (s.color)}<path d={s.path} fill={JEWEL_HEX[s.color]} />{/each}
            {:else}
              <circle cx={beams.c.x} cy={beams.c.y} r=".4" fill={beams.stripes[0]} />
            {/if}
          </g>
          <g class="beam out" class:wide={twins.has(beams.shot.exit)}
            style="--n: {beams.stripes.length}; --ax: {beams.across.x}; --ay: {beams.across.y}">
            {#each beams.stripes, i}
              <line x1={beams.d.x} y1={beams.d.y} x2={beams.outStart.x} y2={beams.outStart.y} stroke="url(#beam-out-{i})"
                class="stripe" style="--o: {i - (beams.stripes.length - 1) / 2}" />
            {/each}
          </g>
          {/if}
        {/key}
      {/if}

      {#each ports as { p, c, shot } (p)}
        {#if game.coachPort === p}<circle cx={c.x} cy={c.y} r={LENS * 1.9} class="coach-ring" />{/if}
        {#if game.hintPort === p}<circle cx={c.x} cy={c.y} r={LENS * 1.9} class="mismatch-ring" />{/if}
        <g class="port" class:twin={twins.has(p) || hoveredPort === p} class:flash-in={shot !== undefined && game.flashed === shot && p === shot.entry}
          class:flash={shot !== undefined && game.flashed === shot && p === shot.exit} style="transform-origin: {c.x}px {c.y}px">
          <rect x={c.x - BAND / 2} y={c.y - BAND / 2} width={BAND} height={BAND} class="hit" />
          {#if !shot}
            <Torch x={c.x} y={c.y} />
          {:else}
            {@const slices = colorSlices(shot.color, c, LENS)}
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
              {@const color = colorsIn(shot.color)[0]}
              {#if color && game.symbols}<Glyph glyph={GLYPH[color]} x={c.x} y={c.y} size={0.16} fill={inkOn(shot.color)} />{/if}
            {:else if shot.exit === ABSORBED}
              <!-- Swallowed by a black pillar: a dead black lens. -->
              <circle cx={c.x} cy={c.y} r={LENS} fill="#05050a" />
              <circle cx={c.x} cy={c.y} r=".09" class="absorbed-dot" />
            {:else}
              <circle cx={c.x} cy={c.y} r={LENS} fill="url(#reflector)" />
              <line x1={c.x - 0.11} y1={c.y + 0.11} x2={c.x + 0.11} y2={c.y - 0.11} class="clear-slash" />
            {/if}
            <circle cx={c.x} cy={c.y} r={LENS} class="lens-rim" />
            <path d="M{c.x - 0.15} {c.y - 0.06}a.17 .17 0 0 1 .11 -.105" class="gloss" />
            <!-- Which test lit this torch (both ends of a light path share the number). -->
            <g transform="translate({c.x - 0.22} {c.y + 0.22}) scale({badgeScale}) translate({-(c.x - 0.22)} {-(c.y + 0.22)})">
              <circle cx={c.x - 0.22} cy={c.y + 0.22} r=".115" class="order-badge" />
              <text x={c.x - 0.22} y={c.y + 0.262} class="order" class:small={orderOf(shot) >= 10}>{orderOf(shot)}</text>
            </g>
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
  {#if loupe && unit > 0}
    {@const span = LOUPE_PX / (unit * LOUPE_ZOOM)}
    <!-- The spot under the finger, magnified. -->
    <svg class="loupe" style="left: {loupe.left}px; top: {loupe.top}px" width={LOUPE_PX} height={LOUPE_PX}
      viewBox="{loupe.at.x - span / 2} {loupe.at.y - span / 2} {span} {span}" aria-hidden="true">
      <!-- Only the plan, drawn plainly: cloning the whole room (frosted-glass filter, animations) is far too slow. -->
      <rect x={BAND} y={BAND} width={board.width} height={board.height} class="glass" />
      <g class="cells">{#each cells as c (c.i)}<rect x={BAND + c.x} y={BAND + c.y} width="1" height="1" />{/each}</g>
      {@render drawing()}
      <circle cx={loupe.at.x} cy={loupe.at.y} r={span * 0.035} class="finger" />
    </svg>
  {/if}
  <p class="sr-only" aria-live="polite">{announce}</p>
</div>

<style>
  .area { position: relative; flex: 1; min-height: 0; width: 100%; display: flex; align-items: center; justify-content: center; }
  .frame { flex: none; border-radius: 16px; }
  .room-frame { fill: #1c2160; stroke: var(--edge); }
  svg { display: block; overflow: visible; touch-action: manipulation; cursor: pointer; outline: none; }
  svg:focus-visible .room-frame { stroke: var(--cyan); }
  svg.painting { touch-action: none; }
  .glass { fill: #283586; }
  /* Steel glazing bars between the panes, with a faint highlight. */
  .cells rect { fill: transparent; stroke: rgba(170, 195, 255, 0.28); stroke-width: 0.045; cursor: crosshair; }
  /* Floor pressure sensors under the glass: the reason you must drop exactly on the jewels. */
  .sensors { fill: #ff4d6d; opacity: 0.35; pointer-events: none; }
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
  .loupe {
    position: absolute; z-index: 20; pointer-events: none; border-radius: 50%; overflow: hidden;
    background: #1c2160; border: 3px solid #fff; box-shadow: 0 8px 22px rgba(0, 0, 0, 0.55);
  }
  .finger { fill: none; stroke: #fff; stroke-opacity: 0.8; stroke-width: 0.02; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); margin: 0; }
  .port { transition: transform 0.15s; }
  /* Tutorial: the torch to tap pulses, the jewel to draw is dotted. */
  /* After a wrong plan: one torch whose result the plan does not explain. */
  .mismatch-ring { fill: none; stroke: #ff3b5c; stroke-width: 0.08; stroke-dasharray: 0.12 0.08; pointer-events: none; }
  .coach-ring { fill: none; stroke: #ffd23f; stroke-width: 0.07; pointer-events: none; animation: coach 1.1s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
  @keyframes coach { 50% { opacity: 0.35; transform: scale(1.25); } }
  .ghost { stroke: #fff; stroke-opacity: 0.75; stroke-width: 0.05; stroke-dasharray: 0.12 0.1; stroke-linecap: round; pointer-events: none; }
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
  /* Pillars: black swallows, clear (glass) reflects without colour, prism shows its colour cycle. */
  .pillar { pointer-events: none; }
  /* Fill without strokes (it hides the grid lines under it), then only the outline on top. */
  .pillar-body { stroke: none; }
  .pillar-edge { stroke-width: 0.05; stroke-linecap: round; }
  .pillar.black .pillar-body { fill: #06060c; }
  .pillar.black .pillar-edge { stroke: #5a5a78; }
  .pillar.clear .pillar-body { fill: #b9cdf0; fill-opacity: 0.92; }
  .pillar.clear .pillar-edge { stroke: #fff; }
  .pillar.prism .pillar-body { fill-opacity: 0.9; transition: fill 0.3s; }
  .pillar.prism .pillar-edge { stroke: #ffd23f; stroke-width: 0.07; }
  .prism-legend { fill: rgba(5, 8, 30, 0.7); }
  .pillar circle { stroke: #0b0f30; stroke-width: 0.012; transition: r 0.2s; }
  .pillar circle.now { stroke: #fff; stroke-width: 0.03; }
  .absorbed-dot { fill: none; stroke: #5a5a78; stroke-width: 0.025; }
  .order-badge { fill: var(--gold); stroke: #0b0f30; stroke-width: 0.025; }
  .order { font-size: 0.13px; font-weight: 900; text-anchor: middle; fill: #1b1745; pointer-events: none; font-family: 'Nunito', sans-serif; }
  .order.small { font-size: 0.105px; }
  .back-badge { fill: #0b0f30; stroke: #fff; stroke-width: 0.03; }
  .back { font-size: 0.14px; font-weight: 900; text-anchor: middle; fill: #fff; pointer-events: none; }
  /* In: the torch beam fades in, then dies under the glass. Out: the tinted light spills out at the exit. */
  /* Straight beam as wide as the torch head; it widens with the torch when the torch is hovered. */
  .beam { pointer-events: none; opacity: 0; stroke-width: 0.52; stroke-linecap: butt; transition: stroke-width 0.15s; }
  .beam.wide { stroke-width: 0.614; }
  /* Outgoing light: one stripe per colour across the beam's width (the group carries the animation). */
  .beam.out { --bw: 0.52px; stroke-width: 0; }
  .beam.out.wide { --bw: 0.614px; }
  .stripe {
    stroke-width: calc(var(--bw) / var(--n));
    transform: translate(calc(var(--ax) * var(--o) * var(--bw) / var(--n)), calc(var(--ay) * var(--o) * var(--bw) / var(--n)));
    transition: stroke-width 0.15s, transform 0.15s;
  }
  /* The lane a torch would light, shown while it is hovered or aimed at with a finger. */
  .lane { pointer-events: none; animation: lane-in 0.18s ease-out; }
  @keyframes lane-in { from { opacity: 0; } }
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
