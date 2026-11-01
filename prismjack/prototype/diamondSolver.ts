/**
 * PROTOTYPE — "Vol ciblé" (target heist) uniqueness checker.
 *
 * Rules being tested:
 *  - four decoy jewels behave like today's jewels (reflect + tint the light);
 *  - the diamond fills one cell, is transparent and never deflects the light;
 *  - light crossing the diamond sparkles (✦) only if it is already coloured,
 *    i.e. it touched a decoy before reaching the diamond.
 *
 * Question answered: given the 36 torch results, is the diamond's cell certain,
 * even if the decoys themselves stay ambiguous?
 */
import { allPorts, isInside, portEntry, portOutside, type BoardSize, type PortId } from '../src/domain/board';
import { jewelSurfaces, wouldTouchBySide, type PlacedJewel } from '../src/domain/jewels';
import { mirror, PART_SIDES, rotate, shapeSize, type CellPart, type JewelSpec, type ShapeCell } from '../src/domain/shapes';
import { parseKey } from '../src/domain/surfaces';
import { maskOf } from '../src/domain/colors';

export interface Observation {
  readonly exit: PortId;
  readonly color: number;
  readonly sparkle: boolean;
}

export interface Placement {
  /** Global index, set by the solver for its compatibility table. */
  id: number;
  readonly piece: number;
  /** Per cell: bit 4 = occupied, bits 0-3 = straight sides covered (T, B, L, R). */
  readonly shape: Uint8Array;
  readonly cells: readonly ShapeCell[];
  readonly cellIdx: readonly number[];
  readonly color: number;
  /** [array id, index, value] writes: 0 = h edge, 1 = v edge, 2 = diagonal. */
  readonly writes: readonly (readonly [number, number, number])[];
}

/** Fast grid of surfaces: colour bit per edge/diagonal (0 = none), diagonal orientation 1 = '/', 2 = '\'. */
export class Grid {
  readonly h: Uint8Array;
  readonly v: Uint8Array;
  readonly d: Uint8Array;
  readonly dOri: Uint8Array;
  constructor(readonly board: BoardSize) {
    this.h = new Uint8Array(board.width * (board.height + 1));
    this.v = new Uint8Array((board.width + 1) * board.height);
    this.d = new Uint8Array(board.width * board.height);
    this.dOri = new Uint8Array(board.width * board.height);
  }
  apply(p: Placement, on: boolean): void {
    for (const [kind, i, value] of p.writes) {
      if (kind === 0) this.h[i] = on ? value : 0;
      else if (kind === 1) this.v[i] = on ? value : 0;
      else {
        this.d[i] = on ? value & 0xf : 0;
        this.dOri[i] = on ? value >> 4 : 0;
      }
    }
  }
}

const UNKNOWN = -1;

/**
 * Follows a beam through the grid. With `maybe`, stops as soon as it would enter a cell an
 * unplaced piece could still occupy (returns exit UNKNOWN with the colour known so far).
 * With `lit`, marks the cells the beam enters while already coloured.
 */
export function trace(
  grid: Grid, port: PortId, maybe?: Uint8Array, lit?: Uint8Array,
): { exit: number; color: number } {
  const { board, h, v, d, dOri } = grid;
  const W = board.width;
  const start = portEntry(board, port);
  let x = start.x - start.dx, y = start.y - start.dy, dx = start.dx, dy = start.dy, color = 0;
  const facet = (): void => {
    const i = y * W + x;
    const c = d[i];
    if (!c) return;
    color |= c;
    if (dOri[i] === 1) { const t = dx; dx = -dy; dy = -t; } else { const t = dx; dx = dy; dy = t; }
  };
  for (let step = 0; step < 4000; step++) {
    const nx = x + dx, ny = y + dy;
    if (maybe && isInside(board, nx, ny) && maybe[ny * W + nx]) return { exit: UNKNOWN, color };
    const edge = dx !== 0 ? v[y * (W + 1) + Math.max(x, nx)] : h[Math.max(y, ny) * W + x];
    if (edge) {
      color |= edge;
      dx = -dx; dy = -dy;
      if (!isInside(board, x, y)) break;
      facet();
      continue;
    }
    x = nx; y = ny;
    if (!isInside(board, x, y)) break;
    if (lit && color) lit[y * W + x] = 1;
    facet();
  }
  return { exit: portOutside(board, x, y), color };
}

function orientations(cells: readonly ShapeCell[]): ShapeCell[][] {
  const seen = new Set<string>();
  const out: ShapeCell[][] = [];
  let cur = [...cells];
  for (let m = 0; m < 2; m++) {
    for (let r = 0; r < 4; r++) {
      const key = cur.map((c) => `${c.x},${c.y},${c.part}`).sort().join(';');
      if (!seen.has(key)) { seen.add(key); out.push(cur); }
      cur = rotate(cur);
    }
    cur = mirror(cur);
  }
  return out;
}

export function allPlacements(board: BoardSize, spec: JewelSpec, piece: number): Placement[] {
  const out: Placement[] = [];
  for (const cells of orientations(spec.shape.cells)) {
    const size = shapeSize(cells);
    for (let oy = 0; oy + size.height <= board.height; oy++) {
      for (let ox = 0; ox + size.width <= board.width; ox++) {
        const moved = cells.map((c) => ({ ...c, x: c.x + ox, y: c.y + oy }));
        const jewel: PlacedJewel = { id: piece, shapeId: spec.shape.id, color: spec.color, cells: moved };
        const writes: [number, number, number][] = [];
        for (const [key, s] of jewelSurfaces(board, [jewel])) {
          const { kind, x, y } = parseKey(key);
          const bit = maskOf(s.color);
          if (kind === 'h') writes.push([0, y * board.width + x, bit]);
          else if (kind === 'v') writes.push([1, y * (board.width + 1) + x, bit]);
          else writes.push([2, y * board.width + x, bit | ((s.orientation === '/' ? 1 : 2) << 4)]);
        }
        const shape = new Uint8Array(board.width * board.height);
        for (const c of moved) {
          shape[c.y * board.width + c.x] = 16 | PART_SIDES[c.part].reduce((m, s) => m | SIDE_BIT[s], 0);
        }
        out.push({ id: -1, piece, shape, cells: moved, cellIdx: moved.map((c) => c.y * board.width + c.x), color: maskOf(spec.color), writes });
      }
    }
  }
  return out;
}

const SIDE_BIT = { T: 1, B: 2, L: 4, R: 8 } as const;

/** Same rule as the game (no shared cell, no shared side), on precomputed cell masks. */
export function compatible(board: BoardSize, a: Placement, b: Placement): boolean {
  const W = board.width;
  for (const c of b.cells) {
    const i = c.y * W + c.x;
    if (a.shape[i]) return false;
    const sides = b.shape[i]!;
    if (sides & 1 && c.y > 0 && (a.shape[i - W]! & 2)) return false;
    if (sides & 2 && c.y < board.height - 1 && (a.shape[i + W]! & 1)) return false;
    if (sides & 4 && c.x > 0 && (a.shape[i - 1]! & 8)) return false;
    if (sides & 8 && c.x < W - 1 && (a.shape[i + 1]! & 4)) return false;
  }
  return true;
}

/** The diamond is a full cell: free, and sharing no side with a decoy. */
export function diamondAllowed(board: BoardSize, placed: readonly Placement[], cell: number): boolean {
  const x = cell % board.width, y = Math.floor(cell / board.width);
  const occ = new Map<string, { part: CellPart }>();
  for (const p of placed) for (const c of p.cells) occ.set(`${c.x},${c.y}`, { part: c.part });
  return !wouldTouchBySide(occ, board, { x, y, part: 'full' });
}

/** What the 36 torches show for a full room (decoys + diamond). */
export function observe(board: BoardSize, placed: readonly Placement[], diamond: number): Observation[] {
  const grid = new Grid(board);
  for (const p of placed) grid.apply(p, true);
  return allPorts(board).map((port) => {
    const lit = new Uint8Array(board.width * board.height);
    const { exit, color } = trace(grid, port, undefined, lit);
    return { exit, color, sparkle: lit[diamond] === 1 };
  });
}

export interface SolveStats {
  nodes: number;
  decoyLayouts: number;
  diamondCells: Set<number>;
  ms: number;
}

/**
 * Finds every diamond cell compatible with the observations (over all decoy layouts that
 * explain the exits and colours). Stops early once two different cells are possible.
 */
export function diamondCandidates(board: BoardSize, specs: readonly JewelSpec[], obs: readonly Observation[], stopAt = 2): SolveStats {
  const t0 = performance.now();
  const ports = allPorts(board);
  const grid0 = new Grid(board);
  // Transparent results went straight across untouched: no piece may stand in their way.
  let byPiece = specs.map((spec, i) => allPlacements(board, spec, i).filter((p) => {
    grid0.apply(p, true);
    const ok = ports.every((port) => obs[port]!.color !== 0 || trace(grid0, port).color === 0);
    grid0.apply(p, false);
    return ok;
  }));
  // A piece whose colour never shows up anywhere would still have to be touched by some beam: keep generic.
  const order = byPiece.map((_, i) => i).sort((a, b) => byPiece[a]!.length - byPiece[b]!.length);
  byPiece = order.map((i) => byPiece[i]!);
  const flat = byPiece.flat();
  flat.forEach((p, i) => { p.id = i; });
  const N = flat.length;
  const table = new Uint8Array(N * N);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    if (flat[i]!.piece !== flat[j]!.piece && compatible(board, flat[i]!, flat[j]!)) { table[i * N + j] = 1; table[j * N + i] = 1; }
  }
  const fits = (p: Placement): boolean => placed.every((q) => table[q.id * N + p.id] === 1);

  const grid = new Grid(board);
  const placed: Placement[] = [];
  const stats: SolveStats = { nodes: 0, decoyLayouts: 0, diamondCells: new Set(), ms: 0 };
  const cells = board.width * board.height;
  const maybe = new Uint8Array(cells);

  const consistentSoFar = (depth: number): boolean => {
    maybe.fill(0);
    for (let k = depth; k < byPiece.length; k++) {
      for (const q of byPiece[k]!) {
        if (fits(q)) for (const c of q.cellIdx) maybe[c] = 1;
      }
    }
    for (const port of ports) {
      const o = obs[port]!;
      const r = trace(grid, port, maybe);
      if ((r.color & ~o.color) !== 0) return false;
      if (r.exit !== UNKNOWN && (r.exit !== o.exit || r.color !== o.color)) return false;
    }
    return true;
  };

  const finish = (): void => {
    stats.decoyLayouts++;
    const lit = ports.map(() => new Uint8Array(cells));
    for (const port of ports) {
      const r = trace(grid, port, undefined, lit[port]);
      if (r.exit !== obs[port]!.exit || r.color !== obs[port]!.color) return;
    }
    for (let c = 0; c < cells; c++) {
      if (!diamondAllowed(board, placed, c)) continue;
      if (ports.every((port) => (lit[port]![c] === 1) === obs[port]!.sparkle)) stats.diamondCells.add(c);
    }
  };

  const dfs = (depth: number): boolean => {
    stats.nodes++;
    if (depth === byPiece.length) { finish(); return stats.diamondCells.size >= stopAt; }
    for (const p of byPiece[depth]!) {
      if (!fits(p)) continue;
      placed.push(p); grid.apply(p, true);
      const stop = consistentSoFar(depth + 1) && dfs(depth + 1);
      grid.apply(p, false); placed.pop();
      if (stop) return true;
    }
    return false;
  };
  dfs(0);
  stats.ms = performance.now() - t0;
  return stats;
}

export interface TargetStats {
  nodes: number;
  /** Full layouts explaining every torch (capped by the search). */
  layouts: number;
  /** Distinct positions of the target jewel among those layouts. */
  targets: Set<string>;
  aborted: boolean;
  ms: number;
}

/**
 * Target heist with ordinary jewels: which positions of jewel `target` are compatible with the
 * torches (exit + colour)? Stops once two positions are found, or after `maxNodes`.
 */
export function targetCandidates(
  board: BoardSize, specs: readonly JewelSpec[], obs: readonly Observation[], target: number, maxNodes = 400_000,
): TargetStats {
  const t0 = performance.now();
  const ports = allPorts(board);
  const grid0 = new Grid(board);
  let byPiece = specs.map((spec, i) => allPlacements(board, spec, i).filter((p) => {
    grid0.apply(p, true);
    const ok = ports.every((port) => obs[port]!.color !== 0 || trace(grid0, port).color === 0);
    grid0.apply(p, false);
    return ok;
  }));
  const order = byPiece.map((_, i) => i).sort((a, b) => byPiece[a]!.length - byPiece[b]!.length);
  byPiece = order.map((i) => byPiece[i]!);
  const flat = byPiece.flat();
  flat.forEach((p, i) => { p.id = i; });
  const N = flat.length;
  const table = new Uint8Array(N * N);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    if (flat[i]!.piece !== flat[j]!.piece && compatible(board, flat[i]!, flat[j]!)) { table[i * N + j] = 1; table[j * N + i] = 1; }
  }
  const placed: Placement[] = [];
  const fits = (p: Placement): boolean => placed.every((q) => table[q.id * N + p.id] === 1);
  const grid = new Grid(board);
  const maybe = new Uint8Array(board.width * board.height);
  const stats: TargetStats = { nodes: 0, layouts: 0, targets: new Set(), aborted: false, ms: 0 };

  const consistentSoFar = (depth: number): boolean => {
    maybe.fill(0);
    for (let k = depth; k < byPiece.length; k++) for (const q of byPiece[k]!) if (fits(q)) for (const c of q.cellIdx) maybe[c] = 1;
    for (const port of ports) {
      const o = obs[port]!;
      const r = trace(grid, port, maybe);
      if ((r.color & ~o.color) !== 0) return false;
      if (r.exit !== -1 && (r.exit !== o.exit || r.color !== o.color)) return false;
    }
    return true;
  };

  const dfs = (depth: number): boolean => {
    if (++stats.nodes > maxNodes) { stats.aborted = true; return true; }
    if (depth === byPiece.length) {
      for (const port of ports) {
        const r = trace(grid, port);
        if (r.exit !== obs[port]!.exit || r.color !== obs[port]!.color) return false;
      }
      stats.layouts++;
      const t = placed.find((p) => p.piece === target)!;
      stats.targets.add([...t.cellIdx].sort((a, b) => a - b).join(',') + '|' + t.cells.map((c) => c.part).join(''));
      return stats.targets.size >= 2;
    }
    for (const p of byPiece[depth]!) {
      if (!fits(p)) continue;
      placed.push(p); grid.apply(p, true);
      const stop = consistentSoFar(depth + 1) && dfs(depth + 1);
      grid.apply(p, false); placed.pop();
      if (stop) return true;
    }
    return false;
  };
  dfs(0);
  stats.ms = performance.now() - t0;
  return stats;
}
