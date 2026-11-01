/**
 * PROTOTYPE — difficulty rating of a room.
 *
 * Idea: a room is hard when the player needs many tests, and hard reasoning, to pin down the
 * single layout that explains them. Measured with an exact solver:
 *  - `paths`: distinct light paths of the room (one test reveals one path, both ends);
 *  - `needed`: size of an irredundant set of paths that still leaves a single solution
 *     (greedy removal, best of a few random orders): the tests a perfect player needs;
 *  - `effort`: search nodes the solver spends on that minimal set (how much reasoning it takes);
 *  - `bounces`, `mixed`: how tangled the light is (surfaces touched per path, share of mixed colours).
 */
import { allPorts, type BoardSize, type PortId } from '../src/domain/board';
import { colorsIn } from '../src/domain/colors';
import type { JewelSpec } from '../src/domain/shapes';
import { allPlacements, compatible, Grid, trace, type Placement } from './diamondSolver';

export interface PathObs {
  readonly a: PortId;
  readonly b: PortId;
  readonly color: number;
}

export interface SolveResult {
  count: number;
  nodes: number;
  aborted: boolean;
}

/** Observation per port, from the known paths (a path tells both of its ends). */
function portView(board: BoardSize, paths: readonly PathObs[]): ({ exit: number; color: number } | undefined)[] {
  const view: ({ exit: number; color: number } | undefined)[] = allPorts(board).map(() => undefined);
  for (const p of paths) {
    view[p.a] = { exit: p.b, color: p.color };
    view[p.b] = { exit: p.a, color: p.color };
  }
  return view;
}

/** Placement lists per piece, before any observation (cached per board + specs). */
const cache = new Map<string, Placement[][]>();
function placementsFor(board: BoardSize, specs: readonly JewelSpec[]): Placement[][] {
  const key = `${board.width}x${board.height}:${specs.map((s) => s.shape.id + s.color).join(',')}`;
  let lists = cache.get(key);
  if (!lists) {
    lists = specs.map((spec, i) => allPlacements(board, spec, i));
    cache.set(key, lists);
  }
  return lists;
}

/**
 * Counts the layouts of `specs` that explain the known paths (unknown ports are free), up to `cap`.
 * Identical jewels (same shape and colour) are kept in increasing placement order, so a layout is
 * not counted once per permutation.
 */
export interface SolveOptions {
  /** Receives every layout found (one placement per jewel). */
  readonly collect?: Placement[][];
  /** Shuffles the search order, so the layouts collected are varied rather than the first ones. */
  readonly random?: () => number;
}

export function solveCount(
  board: BoardSize, specs: readonly JewelSpec[], paths: readonly PathObs[], cap = 2, maxNodes = 300_000, options: SolveOptions = {},
): SolveResult {
  const view = portView(board, paths);
  const known = allPorts(board).filter((p) => view[p] !== undefined);
  const grid0 = new Grid(board);
  const lists = placementsFor(board, specs).map((list) => list.filter((p) => {
    grid0.apply(p, true);
    const ok = known.every((port) => view[port]!.color !== 0 || trace(grid0, port).color === 0);
    grid0.apply(p, false);
    return ok;
  }));
  const order = lists.map((_, i) => i).sort((a, b) => lists[a]!.length - lists[b]!.length);
  let byPiece = order.map((i) => lists[i]!);
  const sameAsPrevious = order.map((piece, k) => {
    if (k === 0) return -1;
    const prev = order.findIndex((other, j) => j < k && specs[other]!.shape.id === specs[piece]!.shape.id && specs[other]!.color === specs[piece]!.color);
    return prev;
  });
  const shuffle = options.random;
  if (shuffle && sameAsPrevious.every((s) => s < 0)) {
    for (let k = 0; k < byPiece.length; k++) byPiece[k] = [...byPiece[k]!].sort(() => shuffle() - 0.5);
  }
  const flat = byPiece.flat();
  const ids = new Map<Placement, number>();
  flat.forEach((p, i) => ids.set(p, i));
  const N = flat.length;
  const table = new Uint8Array(N * N);
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    if (compatible(board, flat[i]!, flat[j]!)) { table[i * N + j] = 1; table[j * N + i] = 1; }
  }
  const placed: Placement[] = [];
  const chosenIndex: number[] = [];
  const fits = (p: Placement) => placed.every((q) => table[ids.get(q)! * N + ids.get(p)!] === 1);
  const grid = new Grid(board);
  const maybe = new Uint8Array(board.width * board.height);
  const res: SolveResult = { count: 0, nodes: 0, aborted: false };

  const consistentSoFar = (depth: number): boolean => {
    maybe.fill(0);
    for (let k = depth; k < byPiece.length; k++) for (const q of byPiece[k]!) if (fits(q)) for (const c of q.cellIdx) maybe[c] = 1;
    for (const port of known) {
      const o = view[port]!;
      const r = trace(grid, port, maybe);
      if ((r.color & ~o.color) !== 0) return false;
      if (r.exit !== -1 && (r.exit !== o.exit || r.color !== o.color)) return false;
    }
    return true;
  };

  const dfs = (depth: number): boolean => {
    if (++res.nodes > maxNodes) { res.aborted = true; return true; }
    if (depth === byPiece.length) {
      for (const port of known) {
        const r = trace(grid, port);
        if (r.exit !== view[port]!.exit || r.color !== view[port]!.color) return false;
      }
      options.collect?.push([...placed]);
      return ++res.count >= cap;
    }
    const list = byPiece[depth]!;
    const twin = sameAsPrevious[depth]!;
    const from = twin >= 0 ? chosenIndex[twin]! + 1 : 0;
    for (let i = from; i < list.length; i++) {
      const p = list[i]!;
      if (!fits(p)) continue;
      placed.push(p); chosenIndex.push(i); grid.apply(p, true);
      const stop = consistentSoFar(depth + 1) && dfs(depth + 1);
      grid.apply(p, false); chosenIndex.pop(); placed.pop();
      if (stop) return true;
    }
    return false;
  };
  dfs(0);
  return res;
}

/** The distinct light paths of a room. */
export function roomPaths(board: BoardSize, placed: readonly Placement[]): (PathObs & { bounces: number })[] {
  const grid = new Grid(board);
  for (const p of placed) grid.apply(p, true);
  const seen = new Set<PortId>();
  const out: (PathObs & { bounces: number })[] = [];
  for (const port of allPorts(board)) {
    if (seen.has(port)) continue;
    const r = trace(grid, port);
    seen.add(port).add(r.exit);
    out.push({ a: port, b: r.exit, color: r.color, bounces: countBounces(grid, port) });
  }
  return out;
}

function countBounces(grid: Grid, port: PortId): number {
  // Re-trace with a colour probe per step would be costly; colours touched is a good enough proxy.
  return colorsIn(trace(grid, port).color).length;
}

export interface Rating {
  paths: number;
  /** Median tests a player firing torches in no particular order needs before one layout is left. */
  blind: number;
  /** Fewest and most tests over the simulated orders (luck spread). */
  blindMin: number;
  blindMax: number;
  needed: number;
  effort: number;
  /** Average torches fired as guesses (no better idea) per game. */
  guesses: number;
  mixed: number;
  colored: number;
  unique: boolean;
  aborted: boolean;
  ms: number;
}

const PLAYERS = 5;

export function rateRoom(
  board: BoardSize, specs: readonly JewelSpec[], placed: readonly Placement[], random: () => number, orders = 0,
): Rating {
  const t0 = performance.now();
  const paths = roomPaths(board, placed);
  const base = solveCount(board, specs, paths);
  const rating: Rating = {
    paths: paths.length, blind: paths.length, blindMin: paths.length, blindMax: paths.length, needed: paths.length, effort: base.nodes, guesses: 0, unique: base.count === 1 && !base.aborted, aborted: base.aborted,
    mixed: paths.filter((p) => colorsIn(p.color).length > 1).length / paths.length,
    colored: paths.filter((p) => p.color !== 0).length / paths.length,
    ms: 0,
  };
  if (!rating.unique) { rating.ms = performance.now() - t0; return rating; }
  // Thoughtful players (see smartPlayer): median tests and reasoning effort over a few games.
  const games = Array.from({ length: PLAYERS }, () => smartPlayer(board, specs, placed, random));
  if (games.some((g) => g.aborted)) rating.aborted = true;
  const tests = games.map((g) => g.tests).sort((a, b) => a - b);
  const nodes = games.map((g) => g.nodes).sort((a, b) => a - b);
  rating.blind = tests[Math.floor(tests.length / 2)]!;
  rating.blindMin = tests[0]!;
  rating.blindMax = tests[tests.length - 1]!;
  rating.effort = nodes[Math.floor(nodes.length / 2)]!;
  rating.guesses = games.reduce((s, g) => s + g.guesses, 0) / games.length;
  for (let o = 0; o < orders; o++) {
    let kept = [...paths];
    const shuffled = [...paths].sort(() => random() - 0.5);
    for (const p of shuffled) {
      const without = kept.filter((q) => q !== p);
      const r = solveCount(board, specs, without);
      if (r.aborted) { rating.aborted = true; continue; }
      if (r.count === 1) kept = without;
    }
    rating.needed = Math.min(rating.needed, kept.length);
  }
  rating.ms = performance.now() - t0;
  return rating;
}

/** Layouts sampled per decision: enough to see which torches the hypotheses disagree on. */
const SAMPLE = 40;

/**
 * A thoughtful player: the first torch is a guess; after that, among the layouts still possible
 * (a sample of them), it fires the unlit torch whose result they disagree on the most (highest
 * entropy). It only guesses again when every hypothesis predicts the same thing everywhere.
 * Returns the tests fired until a single layout is left, and the reasoning effort at that point.
 */
export function smartPlayer(
  board: BoardSize, specs: readonly JewelSpec[], placed: readonly Placement[], random: () => number,
): { tests: number; nodes: number; guesses: number; aborted: boolean } {
  const paths = roomPaths(board, placed);
  const pathOf = new Map<PortId, PathObs>();
  for (const p of paths) { pathOf.set(p.a, p); pathOf.set(p.b, p); }
  const known: PathObs[] = [];
  const lit = new Set<PortId>();
  let guesses = 0;
  const fire = (port: PortId) => {
    const p = pathOf.get(port)!;
    known.push(p); lit.add(p.a).add(p.b);
  };
  const unlit = () => allPorts(board).filter((p) => !lit.has(p));
  const guess = () => {
    const free = unlit();
    guesses++;
    fire(free[Math.floor(random() * free.length)]!);
  };
  guess();
  for (;;) {
    const layouts: Placement[][] = [];
    const r = solveCount(board, specs, known, SAMPLE, 2_000_000, { collect: layouts, random });
    if (r.aborted) return { tests: known.length, nodes: r.nodes, guesses, aborted: true };
    if (r.count === 1) return { tests: known.length, nodes: r.nodes, guesses, aborted: false };
    let best: PortId[] = [];
    let bestEntropy = 0;
    const grid = new Grid(board);
    const outcomes = new Map<PortId, Map<string, number>>();
    for (const layout of layouts) {
      for (const p of layout) grid.apply(p, true);
      for (const port of unlit()) {
        const res = trace(grid, port);
        const key = `${res.exit}:${res.color}`;
        const m = outcomes.get(port) ?? new Map<string, number>();
        m.set(key, (m.get(key) ?? 0) + 1);
        outcomes.set(port, m);
      }
      for (const p of layout) grid.apply(p, false);
    }
    for (const [port, m] of outcomes) {
      let h = 0;
      for (const n of m.values()) { const q = n / layouts.length; h -= q * Math.log2(q); }
      if (h > bestEntropy + 1e-9) { bestEntropy = h; best = [port]; } else if (Math.abs(h - bestEntropy) < 1e-9) best.push(port);
    }
    if (bestEntropy === 0) guess();
    else fire(best[Math.floor(random() * best.length)]!);
  }
}
