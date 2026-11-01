import { it } from 'vitest';
import { appendFileSync, writeFileSync } from 'node:fs';
import { SHAPES, PRISMJACK_JEWELS, type JewelSpec } from '../src/domain/shapes';
import type { BoardSize } from '../src/domain/board';
import { allPlacements, compatible, type Placement } from './diamondSolver';
import { rateRoom, type Rating } from './rating';

/** Rated rooms for calibration: several configurations, a dozen rooms each, written as JSON. */
const S = SHAPES;
export const CONFIGS: { id: string; board: BoardSize; specs: JewelSpec[] }[] = [
  { id: 'c1', board: { width: 5, height: 5 }, specs: [{ shape: S.diamond, color: 'yellow' }] },
  { id: 'c2', board: { width: 6, height: 6 }, specs: [{ shape: S.legTriangle, color: 'red' }] },
  { id: 'c3', board: { width: 6, height: 6 }, specs: [{ shape: S.diamond, color: 'yellow' }, { shape: S.legTriangle, color: 'red' }] },
  { id: 'c4', board: { width: 6, height: 6 }, specs: [{ shape: S.smallTriangle, color: 'blue' }, { shape: S.legTriangle, color: 'red' }, { shape: S.trapezoid, color: 'white' }] },
  { id: 'c5', board: { width: 7, height: 8 }, specs: [{ shape: S.smallTriangle, color: 'blue' }, { shape: S.legTriangle, color: 'red' }, { shape: S.diamond, color: 'yellow' }, { shape: S.trapezoid, color: 'white' }] },
  { id: 'c6', board: { width: 8, height: 10 }, specs: [...PRISMJACK_JEWELS] },
];

/** Provisional single number: blind tests, plus reasoning effort on a log scale. */
export const score = (r: Rating) => Math.round(r.blind + 2 * Math.log10(r.effort + 1));

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

it('builds rated pools', () => {
  const only = process.env.CONFIGS?.split(',');
  const count = Number(process.env.N ?? 12);
  for (const { id, board, specs } of CONFIGS) {
    if (only && !only.includes(id)) continue;
    const random = seeded(21);
    const lists = specs.map((s, i) => allPlacements(board, s, i));
    const rooms: unknown[] = [];
    for (let tries = 0; rooms.length < count && tries < count * 4; tries++) {
      const placed: Placement[] = [];
      for (const list of lists) {
        for (let t = 0; t < 300; t++) {
          const p = list[Math.floor(random() * list.length)]!;
          if (placed.every((q) => compatible(board, q, p))) { placed.push(p); break; }
        }
      }
      if (placed.length < specs.length) continue;
      const r = rateRoom(board, specs, placed, random);
      appendFileSync('/tmp/pool.log', `${id} ${rooms.length}: unique=${r.unique} score=${score(r)} tests=${r.blind} (${r.blindMin}-${r.blindMax}) guesses=${r.guesses.toFixed(1)} effort=${r.effort} aborted=${r.aborted} ${(r.ms / 1000).toFixed(1)}s\n`);
      if (!r.unique || r.aborted) continue;
      rooms.push({ score: score(r), guesses: r.guesses, blind: r.blind, blindMin: r.blindMin, blindMax: r.blindMax, effort: r.effort, jewels: placed.map((p) => p.cells.map((c) => [c.x, c.y, c.part])) });
      writeFileSync(`/tmp/pool-${id}.json`, JSON.stringify({ id, board, specs: specs.map((s) => [s.shape.id, s.color]), rooms }));
    }
  }
}, 3_600_000);
