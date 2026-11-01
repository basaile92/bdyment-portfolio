import { describe, expect, it } from 'vitest';
import { appendFileSync } from 'node:fs';
const log = (s: string) => appendFileSync('/tmp/bench.out', s + '\n');
import { DEFAULT_BOARD, allPorts } from '../src/domain/board';
import { traceLaser } from '../src/domain/laser';
import { jewelSurfaces, type PlacedJewel } from '../src/domain/jewels';
import { maskOf } from '../src/domain/colors';
import { SHAPES, type JewelSpec } from '../src/domain/shapes';
import { allPlacements, compatible, diamondAllowed, diamondCandidates, Grid, observe, trace, type Placement } from './diamondSolver';

const board = DEFAULT_BOARD;
const DECOYS: JewelSpec[] = [
  { shape: SHAPES.smallTriangle, color: 'blue' },
  { shape: SHAPES.legTriangle, color: 'red' },
  { shape: SHAPES.bigTriangle, color: 'yellow' },
  { shape: SHAPES.trapezoid, color: 'white' },
];

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

function randomRoom(random: () => number): { placed: Placement[]; diamond: number } | null {
  const all = DECOYS.map((d, i) => allPlacements(board, d, i));
  const placed: Placement[] = [];
  for (const list of all) {
    let ok = false;
    for (let t = 0; t < 200 && !ok; t++) {
      const p = list[Math.floor(random() * list.length)]!;
      if (placed.every((q) => compatible(board, q, p))) { placed.push(p); ok = true; }
    }
    if (!ok) return null;
  }
  const free = Array.from({ length: board.width * board.height }, (_, c) => c).filter((c) => diamondAllowed(board, placed, c));
  return { placed, diamond: free[Math.floor(random() * free.length)]! };
}

describe('prototype: fast tracer', () => {
  it('matches the game tracer', () => {
    const random = seeded(1);
    for (let n = 0; n < 50; n++) {
      const room = randomRoom(random);
      if (!room) continue;
      const jewels: PlacedJewel[] = room.placed.map((p, i) => ({ id: i, shapeId: '', color: DECOYS[p.piece]!.color, cells: p.cells }));
      const surfaces = jewelSurfaces(board, jewels);
      const grid = new Grid(board);
      for (const p of room.placed) grid.apply(p, true);
      for (const port of allPorts(board)) {
        const a = traceLaser(board, surfaces, port);
        const b = trace(grid, port);
        expect([b.exit, b.color]).toEqual([a.exit, a.color]);
      }
    }
    expect(maskOf('red')).toBe(1);
  });
});

describe('prototype: diamond uniqueness benchmark', () => {
  it('measures', () => {
    const random = seeded(42);
    const rows: string[] = [];
    let unique = 0, total = 0, totalMs = 0, maxMs = 0, noSparkle = 0;
    for (let n = 0; n < Number(process.env.N ?? 40); n++) {
      const room = randomRoom(random);
      if (!room) continue;
      const obs = observe(board, room.placed, room.diamond);
      const sparkles = obs.filter((o) => o.sparkle).length;
      if (sparkles === 0) { noSparkle++; continue; }
      const s = diamondCandidates(board, DECOYS, obs);
      total++; totalMs += s.ms; maxMs = Math.max(maxMs, s.ms);
      const ok = s.diamondCells.size === 1;
      if (ok) unique++;
      log(`#${n} sparkles=${sparkles} unique=${ok} cells=${[...s.diamondCells].join('/')} nodes=${s.nodes} layouts=${s.decoyLayouts} ${s.ms.toFixed(0)}ms`);
    }
    log(rows.join('\n'));
    log(`checked=${total} unique=${unique} noSparkle=${noSparkle} avg=${(totalMs / total).toFixed(0)}ms max=${maxMs.toFixed(0)}ms`);
  }, 600_000);
});
