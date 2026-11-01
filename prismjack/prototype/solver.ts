/**
 * PROTOTYPE — exact solver for rooms with jewels and pillars (black, clear, prism).
 *
 * Observations are tests in the order they were fired: a prism's colour depends on how many
 * earlier tests touched it, so full layouts are checked by replaying the tests in order. Partial
 * layouts are checked loosely (a prism counts as "some colour") to prune the search early.
 */
import { allPorts, isInside, portEntry, portOutside, type BoardSize, type PortId } from '../src/domain/board';
import { maskOf, type JewelColor } from '../src/domain/colors';
import { pillarBodies, pillarSurfaces, type Pillar } from '../src/domain/pillars';
import { PART_SIDES, type JewelSpec } from '../src/domain/shapes';
import { parseKey } from '../src/domain/surfaces';
import { allPlacements, compatible, type Placement } from './diamondSolver';

export const ABSORBED = -1;
const UNKNOWN = -2;

/** One test: torch `a` was fired, the light came out at `b` (or was absorbed) with `color`. */
export interface TestObs {
  readonly a: PortId;
  readonly b: PortId;
  readonly color: number;
}

const KIND = { black: 0, clear: 1, prism: 2 } as const;

/** Surfaces of the room: jewels (colour bits) and pillars (index + 1), as flat arrays. */
export class Room {
  readonly h: Uint8Array;
  readonly v: Uint8Array;
  readonly d: Uint8Array;
  readonly dOri: Uint8Array;
  readonly hp: Uint8Array;
  readonly vp: Uint8Array;
  readonly dp: Uint8Array;
  readonly dpOri: Uint8Array;
  readonly kinds: number[];
  readonly orders: number[][];
  constructor(readonly board: BoardSize, readonly pillars: readonly Pillar[] = []) {
    const W = board.width, H = board.height;
    this.h = new Uint8Array(W * (H + 1)); this.v = new Uint8Array((W + 1) * H);
    this.d = new Uint8Array(W * H); this.dOri = new Uint8Array(W * H);
    this.hp = new Uint8Array(W * (H + 1)); this.vp = new Uint8Array((W + 1) * H);
    this.dp = new Uint8Array(W * H); this.dpOri = new Uint8Array(W * H);
    this.kinds = pillars.map((p) => KIND[p.kind]);
    this.orders = pillars.map((p) => (p.order ?? []).map((c: JewelColor) => maskOf(c)));
    for (const [key, s] of pillarSurfaces(board, pillars)) {
      const { kind, x, y } = parseKey(key);
      const id = s.owner + 1;
      if (kind === 'h') this.hp[y * W + x] = id;
      else if (kind === 'v') this.vp[y * (W + 1) + x] = id;
      else { this.dp[y * W + x] = id; this.dpOri[y * W + x] = s.orientation === '/' ? 1 : 2; }
    }
  }
  apply(p: Placement, on: boolean): void {
    for (const [kind, i, value] of p.writes) {
      if (kind === 0) this.h[i] = on ? value : 0;
      else if (kind === 1) this.v[i] = on ? value : 0;
      else { this.d[i] = on ? value & 0xf : 0; this.dOri[i] = on ? value >> 4 : 0; }
    }
  }
  /** Placements of a jewel that keep clear of the pillars (no shared cell, no shared side). */
  placementsOf(spec: JewelSpec, piece: number): Placement[] {
    const bodies = pillarBodies(this.pillars, 0).map((b) => {
      const shape = new Uint8Array(this.board.width * this.board.height);
      for (const c of b.cells) shape[c.y * this.board.width + c.x] = 16 | PART_SIDES[c.part].reduce((m, s) => m | ({ T: 1, B: 2, L: 4, R: 8 } as const)[s], 0);
      return { id: -1, piece: -1, shape, cells: b.cells, cellIdx: [], color: 0, writes: [] } as Placement;
    });
    return allPlacements(this.board, spec, piece).filter((p) => bodies.every((b) => compatible(this.board, b, p)));
  }
}

export interface TraceOptions {
  /** Cells an unplaced jewel could still occupy: stop there (exit UNKNOWN). */
  readonly maybe?: Uint8Array | undefined;
  /** Prism states; null = unknown (a prism then adds no colour and sets `wild`). */
  readonly states?: Int32Array | null;
  /** Receives the pillars touched. */
  readonly touched?: Set<number>;
  /** Marks cells entered (for nothing yet; kept for later metrics). */
  readonly lit?: Uint8Array;
}

export function trace(room: Room, port: PortId, o: TraceOptions = {}): { exit: number; color: number; wild: boolean } {
  const { board, h, v, d, dOri, hp, vp, dp, dpOri, kinds, orders } = room;
  const W = board.width;
  const start = portEntry(board, port);
  let x = start.x - start.dx, y = start.y - start.dy, dx = start.dx, dy = start.dy, color = 0, wild = false;
  /** Pillar hit: false when swallowed. */
  const pillar = (id: number): boolean => {
    const i = id - 1;
    o.touched?.add(i);
    const k = kinds[i];
    if (k === 0) return false;
    if (k === 2) {
      if (o.states) color |= orders[i]![o.states[i]! % 4]!;
      else wild = true;
    }
    return true;
  };
  const turn = (ori: number) => { if (ori === 1) { const t = dx; dx = -dy; dy = -t; } else { const t = dx; dx = dy; dy = t; } };
  /** Facet in the current cell; false when swallowed. */
  const facet = (): boolean => {
    const i = y * W + x;
    if (d[i]) { color |= d[i]!; turn(dOri[i]!); return true; }
    if (dp[i]) { if (!pillar(dp[i]!)) return false; turn(dpOri[i]!); }
    return true;
  };
  for (let step = 0; step < 4000; step++) {
    const nx = x + dx, ny = y + dy;
    if (o.maybe && isInside(board, nx, ny) && o.maybe[ny * W + nx]) return { exit: UNKNOWN, color, wild };
    const ei = dx !== 0 ? y * (W + 1) + Math.max(x, nx) : Math.max(y, ny) * W + x;
    const edge = dx !== 0 ? v[ei] : h[ei];
    const pEdge = dx !== 0 ? vp[ei] : hp[ei];
    if (edge || pEdge) {
      if (edge) color |= edge;
      else if (!pillar(pEdge!)) return { exit: ABSORBED, color, wild };
      dx = -dx; dy = -dy;
      if (!isInside(board, x, y)) break;
      if (!facet()) return { exit: ABSORBED, color, wild };
      continue;
    }
    x = nx; y = ny;
    if (!isInside(board, x, y)) break;
    if (o.lit) o.lit[y * W + x] = 1;
    if (!facet()) return { exit: ABSORBED, color, wild };
  }
  return { exit: portOutside(board, x, y), color, wild };
}

const same = (a: { exit: number; color: number }, b: { exit: number; color: number }) =>
  a.exit === b.exit && (a.exit === ABSORBED || a.color === b.color);

/** Fires `ports` in order on a full room, prisms moving on as they go. */
export function fireInOrder(room: Room, ports: readonly PortId[]): TestObs[] {
  const states = new Int32Array(room.pillars.length);
  return ports.map((a) => {
    const touched = new Set<number>();
    const r = trace(room, a, { states, touched });
    for (const i of touched) if (room.kinds[i] === 2) states[i]!++;
    return { a, b: r.exit, color: r.exit === ABSORBED ? 0 : r.color };
  });
}

/** Prism states after the tests, for this full room. */
export function statesAfter(room: Room, tests: readonly TestObs[]): Int32Array {
  const states = new Int32Array(room.pillars.length);
  for (const t of tests) {
    const touched = new Set<number>();
    trace(room, t.a, { states, touched });
    for (const i of touched) if (room.kinds[i] === 2) states[i]!++;
  }
  return states;
}

export interface SolveResult {
  count: number;
  nodes: number;
  aborted: boolean;
}

export interface SolveOptions {
  readonly cap?: number;
  readonly maxNodes?: number;
  /** Receives every layout found. */
  readonly collect?: Placement[][];
  /** Shuffles the search order (varied samples). */
  readonly random?: () => number;
}

/** What one port is known to show, from the tests (a test also tells about its exit port). */
interface PortView { exit: number; color: number }

/**
 * Counts the jewel layouts (up to `cap`) that explain the tests, given the room's pillars.
 */
export function solve(board: BoardSize, pillars: readonly Pillar[], specs: readonly JewelSpec[], tests: readonly TestObs[], options: SolveOptions = {}): SolveResult {
  const { cap = 2, maxNodes = 300_000, collect, random } = options;
  const room = new Room(board, pillars);
  const pillarsOnly = new Room(board, pillars);
  const view: (PortView | undefined)[] = allPorts(board).map(() => undefined);
  for (const t of tests) {
    view[t.a] = { exit: t.b, color: t.color };
    if (t.b >= 0) view[t.b] = { exit: t.a, color: t.color };
  }
  const known = allPorts(board).filter((p) => view[p] !== undefined);
  const hasPrism = room.kinds.includes(2);
  // Transparent tests met no jewel: they followed the pillars-only path, which no jewel may touch.
  const clearPorts = known.filter((port) => view[port]!.color === 0 && view[port]!.exit !== ABSORBED && !trace(pillarsOnly, port, { states: null }).wild);
  let lists = specs.map((spec, i) => room.placementsOf(spec, i).filter((p) => {
    pillarsOnly.apply(p, true);
    const ok = clearPorts.every((port) => trace(pillarsOnly, port, { states: null }).color === 0);
    pillarsOnly.apply(p, false);
    return ok;
  }));
  const order = lists.map((_, i) => i).sort((a, b) => lists[a]!.length - lists[b]!.length);
  lists = order.map((i) => lists[i]!);
  if (random) lists = lists.map((l) => [...l].sort(() => random() - 0.5));
  const flat = lists.flat();
  const ids = new Map<Placement, number>();
  flat.forEach((p, i) => ids.set(p, i));
  const N = flat.length;
  const table = new Uint8Array(N * N);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    if (compatible(board, flat[i]!, flat[j]!)) { table[i * N + j] = 1; table[j * N + i] = 1; }
  }
  const placed: Placement[] = [];
  const fits = (p: Placement) => placed.every((q) => table[ids.get(q)! * N + ids.get(p)!] === 1);
  const maybe = new Uint8Array(board.width * board.height);
  const res: SolveResult = { count: 0, nodes: 0, aborted: false };

  const consistentSoFar = (depth: number): boolean => {
    maybe.fill(0);
    for (let k = depth; k < lists.length; k++) for (const q of lists[k]!) if (fits(q)) for (const c of q.cellIdx) maybe[c] = 1;
    for (const port of known) {
      const o = view[port]!;
      const r = trace(room, port, { maybe, states: hasPrism ? null : new Int32Array(0) });
      if (r.exit === UNKNOWN) { if (o.exit !== ABSORBED && (r.color & ~o.color) !== 0) return false; continue; }
      if (r.exit !== o.exit) return false;
      if (o.exit !== ABSORBED && !r.wild && r.color !== o.color) return false;
      if (o.exit !== ABSORBED && r.wild && (r.color & ~o.color) !== 0) return false;
    }
    return true;
  };

  const fullCheck = (): boolean => {
    const states = new Int32Array(pillars.length);
    for (const t of tests) {
      const touched = new Set<number>();
      const r = trace(room, t.a, { states, touched });
      if (!same(r, { exit: t.b, color: t.color })) return false;
      for (const i of touched) if (room.kinds[i] === 2) states[i]!++;
    }
    return true;
  };

  const dfs = (depth: number): boolean => {
    if (++res.nodes > maxNodes) { res.aborted = true; return true; }
    if (depth === lists.length) {
      if (!fullCheck()) return false;
      collect?.push([...placed]);
      return ++res.count >= cap;
    }
    for (const p of lists[depth]!) {
      if (!fits(p)) continue;
      placed.push(p); room.apply(p, true);
      const stop = consistentSoFar(depth + 1) && dfs(depth + 1);
      room.apply(p, false); placed.pop();
      if (stop) return true;
    }
    return false;
  };
  dfs(0);
  return res;
}

const SAMPLE = 40;

/**
 * Thoughtful player: guesses the first torch, then fires the unlit torch whose result the
 * remaining hypotheses disagree on most; guesses again only when they all agree.
 */
export function smartPlayer(
  board: BoardSize, pillars: readonly Pillar[], specs: readonly JewelSpec[], truth: readonly Placement[], random: () => number,
): { tests: number; nodes: number; aborted: boolean } {
  const real = new Room(board, pillars);
  for (const p of truth) real.apply(p, true);
  const states = new Int32Array(pillars.length);
  const tests: TestObs[] = [];
  const lit = new Set<PortId>();
  const fire = (a: PortId) => {
    const touched = new Set<number>();
    const r = trace(real, a, { states, touched });
    for (const i of touched) if (real.kinds[i] === 2) states[i]!++;
    tests.push({ a, b: r.exit, color: r.exit === ABSORBED ? 0 : r.color });
    lit.add(a);
    if (r.exit >= 0) lit.add(r.exit);
  };
  const unlit = () => allPorts(board).filter((p) => !lit.has(p));
  const guess = () => { const free = unlit(); fire(free[Math.floor(random() * free.length)]!); };
  guess();
  for (;;) {
    const layouts: Placement[][] = [];
    const r = solve(board, pillars, specs, tests, { cap: SAMPLE, maxNodes: Number(process.env.SAMPLE_NODES ?? 2_000_000), collect: layouts, random });
    if (r.aborted || r.count <= 1) return { tests: tests.length, nodes: r.nodes, aborted: r.aborted };
    const outcomes = new Map<PortId, Map<string, number>>();
    for (const layout of layouts) {
      const room = new Room(board, pillars);
      for (const p of layout) room.apply(p, true);
      const now = statesAfter(room, tests);
      for (const port of unlit()) {
        const res = trace(room, port, { states: now });
        const key = res.exit === ABSORBED ? 'x' : `${res.exit}:${res.color}`;
        const m = outcomes.get(port) ?? new Map<string, number>();
        m.set(key, (m.get(key) ?? 0) + 1);
        outcomes.set(port, m);
      }
    }
    let best: PortId[] = [];
    let bestH = 0;
    for (const [port, m] of outcomes) {
      let h = 0;
      for (const n of m.values()) { const q = n / layouts.length; h -= q * Math.log2(q); }
      if (h > bestH + 1e-9) { bestH = h; best = [port]; } else if (Math.abs(h - bestH) < 1e-9) best.push(port);
    }
    if (bestH === 0) guess();
    else fire(best[Math.floor(random() * best.length)]!);
  }
}

export interface PillarRating {
  unique: boolean;
  tests: number;
  testsMin: number;
  testsMax: number;
  effort: number;
  aborted: boolean;
  ms: number;
}

/** Rates a room: unique with every torch fired? then a few thoughtful players. */
export function rate(board: BoardSize, pillars: readonly Pillar[], specs: readonly JewelSpec[], truth: readonly Placement[], random: () => number, players = 5): PillarRating {
  const t0 = performance.now();
  const real = new Room(board, pillars);
  for (const p of truth) real.apply(p, true);
  const all = fireInOrder(real, allPorts(board));
  const base = solve(board, pillars, specs, all);
  const out: PillarRating = { unique: base.count === 1 && !base.aborted, tests: 0, testsMin: 0, testsMax: 0, effort: 0, aborted: base.aborted, ms: 0 };
  if (out.unique) {
    const games = Array.from({ length: players }, () => smartPlayer(board, pillars, specs, truth, random));
    out.aborted = games.some((g) => g.aborted);
    const t = games.map((g) => g.tests).sort((a, b) => a - b);
    const n = games.map((g) => g.nodes).sort((a, b) => a - b);
    out.tests = t[Math.floor(t.length / 2)]!; out.testsMin = t[0]!; out.testsMax = t[t.length - 1]!;
    out.effort = n[Math.floor(n.length / 2)]!;
  }
  out.ms = performance.now() - t0;
  return out;
}

export const score = (r: { tests: number; effort: number }) => Math.round(r.tests + 2 * Math.log10(r.effort + 1));
