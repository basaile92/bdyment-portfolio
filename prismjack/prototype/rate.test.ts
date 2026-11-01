import { it } from 'vitest';
import { appendFileSync } from 'node:fs';
import { SHAPES, PRISMJACK_JEWELS, type JewelSpec } from '../src/domain/shapes';
import type { BoardSize } from '../src/domain/board';
import { allPlacements, compatible, type Placement } from './diamondSolver';
import { rateRoom } from './rating';

const LOG = process.env.LOG ?? '/tmp/rate.log';
const log = (s: string) => appendFileSync(LOG, s + '\n');
const S = SHAPES;

const LEVELS: Record<string, { board: BoardSize; specs: JewelSpec[] }> = {
  'A 5x5 · 1 losange': { board: { width: 5, height: 5 }, specs: [{ shape: S.diamond, color: 'yellow' }] },
  'B 6x6 · 2 joyaux': { board: { width: 6, height: 6 }, specs: [{ shape: S.diamond, color: 'yellow' }, { shape: S.legTriangle, color: 'red' }] },
  'C 6x6 · 3 joyaux': { board: { width: 6, height: 6 }, specs: [{ shape: S.smallTriangle, color: 'blue' }, { shape: S.legTriangle, color: 'red' }, { shape: S.trapezoid, color: 'white' }] },
  'D 8x10 · 5 joyaux (casse du jour)': { board: { width: 8, height: 10 }, specs: [...PRISMJACK_JEWELS] },
};

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

it('rates rooms per level', () => {
  const only = process.env.LEVEL;
  const count = Number(process.env.N ?? 8);
  for (const [name, { board, specs }] of Object.entries(LEVELS)) {
    if (only && !name.startsWith(only)) continue;
    const random = seeded(5);
    const lists = specs.map((s, i) => allPlacements(board, s, i));
    for (let n = 0; n < count; n++) {
      const placed: Placement[] = [];
      for (const list of lists) {
        for (let t = 0; t < 300; t++) {
          const p = list[Math.floor(random() * list.length)]!;
          if (placed.every((q) => compatible(board, q, p))) { placed.push(p); break; }
        }
      }
      if (placed.length < specs.length) continue;
      const r = rateRoom(board, specs, placed, random);
      log(`${name} #${n}: unique=${r.unique} paths=${r.paths} blind=${r.blind} (${r.blindMin}-${r.blindMax}) needed=${r.needed} effort=${r.effort} colored=${r.colored.toFixed(2)} mixed=${r.mixed.toFixed(2)} aborted=${r.aborted} ${(r.ms / 1000).toFixed(1)}s`);
    }
  }
}, 3_000_000);
