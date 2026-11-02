import { it } from 'vitest';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { BoardSize } from '../src/domain/board';
import { allPorts } from '../src/domain/board';
import { makePillar, type Pillar, type PillarKind, type PillarShape } from '../src/domain/pillars';
import { SHAPES, type JewelSpec } from '../src/domain/shapes';
import { compatible, type Placement } from './diamondSolver';
import { fireInOrder, rate, Room, score, solve } from './solver';

/**
 * Campaign levels (MODE=levels) and room pools for the daily heist / endless run (MODE=pool).
 * Every room kept has a single solution when every torch is fired.
 */
const S = SHAPES;
const R = (shape: keyof typeof S, color: JewelSpec['color']): JewelSpec => ({ shape: S[shape], color });
type P = [PillarKind, PillarShape];
interface Config { board: BoardSize; specs: JewelSpec[]; pillars: P[] }
const c = (w: number, h: number, specs: JewelSpec[], pillars: P[] = []): Config => ({ board: { width: w, height: h }, specs, pillars });

const SMALL = R('smallTriangle', 'blue'), LEG = R('legTriangle', 'red'), BIG = R('bigTriangle', 'yellow');
const LOS = R('diamond', 'yellow'), TRAP = R('trapezoid', 'white'), SQ = R('square', 'red');
const CELL = R('cell', 'blue'), HALF = R('halfTriangle', 'red'), HALF2 = R('halfTriangle', 'white'), CELL2 = R('cell', 'yellow');
const FOUR = [SMALL, LEG, LOS, TRAP];
const SIX = [SMALL, LEG, LOS, TRAP, CELL, HALF];
const SIX_B = [SMALL, LEG, BIG, LOS, CELL2, HALF2];
const SEVEN_A = [SMALL, LEG, BIG, LOS, TRAP, CELL, HALF];
const SEVEN_B = [SMALL, LEG, LOS, TRAP, CELL, CELL2, HALF2];
const SEVEN_C = [LEG, BIG, LOS, CELL, CELL2, HALF, HALF2];
const FIVE = [SMALL, LEG, BIG, LOS, TRAP];

export const LEVELS: Config[] = [
  // Easy: one new idea per level.
  c(5, 5, [SQ]),
  c(5, 5, [LOS]),
  c(6, 6, [LEG]),
  c(6, 6, [SMALL, LEG]),
  c(6, 6, [LOS, LEG]),
  c(6, 6, [LOS, LEG], [['black', 'square1']]),
  c(6, 6, [SMALL, TRAP], [['clear', 'losange2']]),
  c(6, 6, [LEG, SMALL], [['prism', 'square1']]),
  c(7, 7, [BIG, LOS, SMALL]),
  c(7, 7, [LEG, LOS, TRAP], [['black', 'square2']]),
  // Medium.
  c(7, 7, [SMALL, LEG, TRAP]),
  c(7, 7, [SMALL, LEG, TRAP], [['clear', 'losange2']]),
  c(7, 7, [BIG, LOS, LEG]),
  c(7, 7, [SMALL, LEG, LOS], [['prism', 'square1']]),
  c(7, 8, FOUR),
  c(7, 8, FOUR, [['black', 'square1']]),
  c(7, 8, FOUR, [['clear', 'losange2']]),
  c(7, 8, FOUR, [['prism', 'square2']]),
  c(7, 8, [BIG, LOS, LEG, SMALL]),
  c(7, 8, FOUR, [['black', 'square1'], ['clear', 'losange2']]),
  // Hard.
  c(8, 8, FOUR, [['black', 'square1'], ['prism', 'square1']]),
  c(8, 8, FIVE),
  c(8, 8, FIVE, [['black', 'square1']]),
  c(8, 8, FIVE, [['clear', 'losange2']]),
  c(8, 8, FIVE, [['prism', 'square1']]),
  c(8, 10, FIVE),
  c(8, 10, FIVE, [['black', 'square1'], ['clear', 'losange2']]),
  c(8, 10, FIVE, [['prism', 'square2'], ['black', 'square1']]),
  c(8, 10, FIVE, [['clear', 'square2'], ['prism', 'square1']]),
  c(8, 10, FIVE, [['black', 'square2'], ['clear', 'losange2'], ['prism', 'square1']]),
  // Extreme: six jewels including the two smallest (a single cell, half a cell), colours shared.
  c(8, 8, SIX),
  c(8, 8, SIX, [['black', 'square1']]),
  c(8, 9, SIX, [['clear', 'losange2']]),
  c(8, 9, SIX_B, [['prism', 'square1']]),
  c(9, 9, SIX),
  c(9, 9, SIX, [['black', 'square1'], ['clear', 'losange2']]),
  c(9, 9, SIX_B, [['prism', 'square2']]),
  c(9, 9, SIX, [['black', 'square1'], ['prism', 'square1']]),
  c(9, 9, SIX_B, [['black', 'square1'], ['clear', 'losange2']]),
  c(9, 9, SIX_B, [['black', 'square1'], ['clear', 'losange2'], ['prism', 'square1']]),
  // Nightmare: seven jewels (up to four tiny ones) and two to four pillars on 9 × 9.
  c(9, 9, SEVEN_A, [['black', 'square1'], ['clear', 'square1']]),
  c(9, 9, SEVEN_B, [['prism', 'square1'], ['black', 'square1']]),
  c(9, 9, SEVEN_A, [['black', 'square1'], ['clear', 'losange2'], ['prism', 'square1']]),
  c(9, 9, SEVEN_C, [['black', 'square1'], ['black', 'square1']]),
  c(9, 9, SEVEN_B, [['clear', 'losange2'], ['prism', 'square1'], ['black', 'square1']]),
  c(9, 9, SEVEN_C, [['prism', 'square1'], ['prism', 'square1'], ['black', 'square1']]),
  c(9, 9, SEVEN_A, [['black', 'square2'], ['clear', 'losange2'], ['prism', 'square1']]),
  c(9, 9, SEVEN_C, [['black', 'square1'], ['clear', 'square1'], ['prism', 'square1'], ['black', 'square1']]),
  c(9, 9, SEVEN_B, [['prism', 'square2'], ['clear', 'losange2'], ['black', 'square1'], ['black', 'square1']]),
  c(9, 9, SEVEN_C, [['black', 'square1'], ['clear', 'losange2'], ['prism', 'square1'], ['prism', 'square1']]),
];

/** Pools: medium, hard (daily heist), very hard. Pillars are mixed at random. */
const POOL_PILLARS: P[][] = [[], [['black', 'square1']], [['clear', 'losange2']], [['prism', 'square1']], [['black', 'square1'], ['clear', 'losange2']], [['prism', 'square2'], ['black', 'square1']]];
/** Two or three pillars, prisms often: the last tier of the run. */
const HEAVY_PILLARS: P[][] = [[['prism', 'square1'], ['black', 'square1']], [['prism', 'square2'], ['clear', 'losange2']], [['black', 'square1'], ['clear', 'losange2'], ['prism', 'square1']]];
/** Three or four pillars: the nightmare tier. */
const NIGHTMARE_PILLARS: P[][] = [[['black', 'square1'], ['clear', 'losange2'], ['prism', 'square1']], [['prism', 'square1'], ['prism', 'square1'], ['black', 'square1']], [['black', 'square1'], ['clear', 'square1'], ['prism', 'square1'], ['black', 'square1']]];
export const TIERS: Record<string, { board: BoardSize; specs: JewelSpec[]; pillarSets: P[][] }> = {
  medium: { board: { width: 7, height: 7 }, specs: [SMALL, LEG, LOS], pillarSets: POOL_PILLARS },
  hard: { board: { width: 7, height: 8 }, specs: FOUR, pillarSets: POOL_PILLARS },
  expert: { board: { width: 8, height: 8 }, specs: FIVE, pillarSets: POOL_PILLARS },
  extreme: { board: { width: 8, height: 9 }, specs: SIX, pillarSets: POOL_PILLARS },
  insane: { board: { width: 9, height: 9 }, specs: SIX_B, pillarSets: HEAVY_PILLARS },
  nightmare: { board: { width: 9, height: 9 }, specs: SEVEN_B, pillarSets: NIGHTMARE_PILLARS },
};

const COLORS = ['red', 'blue', 'yellow', 'white'] as const;
const log = (s: string) => appendFileSync(process.env.LOG ?? '/tmp/campaign.log', s + '\n');
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

function randomPillars(board: BoardSize, kinds: P[], random: () => number): Pillar[] | null {
  const out: Pillar[] = [];
  for (const [kind, shape] of kinds) {
    let ok = false;
    for (let t = 0; t < 100 && !ok; t++) {
      const size = shape === 'square1' ? 1 : 2;
      const x = 1 + Math.floor(random() * (board.width - size - 1)), y = 1 + Math.floor(random() * (board.height - size - 1));
      const p = makePillar(kind, shape, { x, y }, [...COLORS].sort(() => random() - 0.5));
      // Pillars keep a free cell between them.
      const near = (a: Pillar, b: Pillar) => a.cells.some((u) => b.cells.some((v) => Math.abs(u.x - v.x) <= 1 && Math.abs(u.y - v.y) <= 1));
      if (out.some((q) => near(q, p))) continue;
      out.push(p); ok = true;
    }
    if (!ok) return null;
  }
  return out;
}

function randomJewels(room: Room, specs: JewelSpec[], random: () => number): Placement[] | null {
  const placed: Placement[] = [];
  for (const [i, spec] of specs.entries()) {
    const list = room.placementsOf(spec, i);
    let ok = false;
    for (let t = 0; t < 400 && !ok; t++) {
      const p = list[Math.floor(random() * list.length)];
      if (p && placed.every((q) => compatible(room.board, q, p))) { placed.push(p); ok = true; }
    }
    if (!ok) return null;
  }
  return placed;
}

const toRoom = (pillars: Pillar[], placed: Placement[], extra: object) => ({
  ...extra, jewels: placed.map((p) => p.cells.map((q) => [q.x, q.y, q.part])), pillars,
});

/** Single solution when every torch is fired, without measuring how hard (too slow past five jewels). */
function uniqueOnly(board: BoardSize, pillars: Pillar[], specs: JewelSpec[], room: Room, placed: Placement[]) {
  const t0 = performance.now();
  for (const p of placed) room.apply(p, true);
  const all = fireInOrder(room, allPorts(board));
  for (const p of placed) room.apply(p, false);
  const r = solve(board, pillars, specs, all, { maxNodes: Number(process.env.MAX_NODES ?? 1_500_000) });
  return { unique: r.count === 1 && !r.aborted, tests: 0, effort: r.nodes, aborted: r.aborted, ms: performance.now() - t0 };
}

it.skipIf(process.env.GEN !== 'levels')('generates the campaign levels', () => {
  const out = process.env.OUT ?? '/tmp/levels.json';
  const done: Record<number, unknown> = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : {};
  const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
  for (const [index, cfg] of LEVELS.entries()) {
    if (done[index] || (only && !only.includes(index))) continue;
    const random = seeded(1000 + index);
    const hard = index >= 20, easy = index < 10;
    const wanted = Number(process.env.WANTED ?? (easy ? 6 : 3));
    const found: { s: number; room: unknown }[] = [];
    for (let tries = 0; found.length < wanted && tries < wanted * 8; tries++) {
      const pillars = randomPillars(cfg.board, cfg.pillars, random);
      if (!pillars) continue;
      const room = new Room(cfg.board, pillars);
      const placed = randomJewels(room, cfg.specs, random);
      if (!placed) continue;
      const r = process.env.NO_RATE === '1' ? uniqueOnly(cfg.board, pillars, cfg.specs, room, placed) : rate(cfg.board, pillars, cfg.specs, placed, random, Number(process.env.PLAYERS ?? (hard ? 2 : 3)));
      log(`L${index + 1} try ${tries}: unique=${r.unique} score=${score(r)} tests=${r.tests} effort=${r.effort} aborted=${r.aborted} ${(r.ms / 1000).toFixed(1)}s`);
      if (!r.unique || (r.aborted && process.env.ACCEPT_ABORTED !== '1')) continue;
      found.push({ s: score(r), room: toRoom(pillars, placed, { score: score(r), tests: r.tests, effort: r.effort }) });
    }
    if (!found.length) continue;
    found.sort((a, b) => a.s - b.s);
    // Easy: the gentlest room; then the hardest of the candidates, so difficulty climbs.
    done[index] = (easy ? found[0] : found[found.length - 1])!.room;
    writeFileSync(out, JSON.stringify(done));
  }
}, 7_200_000);

it.skipIf(process.env.GEN !== 'pool')('generates a pool of verified rooms', () => {
  const tier = TIERS[process.env.TIER ?? 'hard']!;
  const out = process.env.OUT ?? `/tmp/pool-${process.env.TIER}.json`;
  const rooms: unknown[] = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : [];
  const random = seeded(Number(process.env.SEED ?? 5) + rooms.length * 7919);
  const wanted = Number(process.env.N ?? 40);
  for (let tries = 0; rooms.length < wanted && tries < wanted * 10; tries++) {
    const kinds = tier.pillarSets[Math.floor(random() * tier.pillarSets.length)]!;
    const pillars = randomPillars(tier.board, kinds, random);
    if (!pillars) continue;
    const room = new Room(tier.board, pillars);
    const placed = randomJewels(room, tier.specs, random);
    if (!placed) continue;
    const t0 = performance.now();
    for (const p of placed) room.apply(p, true);
    const all = fireInOrder(room, allPorts(tier.board));
    const r = solve(tier.board, pillars, tier.specs, all, { maxNodes: Number(process.env.MAX_NODES ?? 1_500_000) });
    log(`${process.env.TIER} try ${tries}: count=${r.count} aborted=${r.aborted} nodes=${r.nodes} ${((performance.now() - t0) / 1000).toFixed(1)}s`);
    if (r.count !== 1 || r.aborted) continue;
    rooms.push(toRoom(pillars, placed, {}));
    writeFileSync(out, JSON.stringify(rooms));
  }
}, 7_200_000);

it.skipIf(process.env.GEN !== 'configs')('exports the configs for writeCampaign.py', () => {
  const specs = (list: JewelSpec[]) => `[${list.map((s) => `['${s.shape.id}', '${s.color}']`).join(', ')}]`;
  writeFileSync('/tmp/campaign-configs.json', JSON.stringify({
    levels: LEVELS.map((l) => ({ board: [l.board.width, l.board.height], specs: specs(l.specs) })),
    tiers: Object.fromEntries(Object.entries(TIERS).map(([k, t]) => [k, { board: [t.board.width, t.board.height], specs: specs(t.specs) }])),
  }));
});
