import { it } from 'vitest';
import { appendFileSync } from 'node:fs';
import { allPorts } from '../src/domain/board';
import { SHAPES, type JewelSpec } from '../src/domain/shapes';
import { makePillar, type Pillar } from '../src/domain/pillars';
import { compatible, type Placement } from './diamondSolver';
import { fireInOrder, Room, solve } from './solver';

/** GEN=solverbench: how long the exact solver takes on hard rooms (6 to 8 jewels, with pillars). */
const log = (s: string) => appendFileSync('/tmp/solverbench.log', s + '\n');
const R = (shape: keyof typeof SHAPES, color: JewelSpec['color']): JewelSpec => ({ shape: SHAPES[shape], color });
const SMALL = R('smallTriangle', 'blue'), LEG = R('legTriangle', 'red'), BIG = R('bigTriangle', 'yellow'), LOS = R('diamond', 'yellow');
const TRAP = R('trapezoid', 'white'), CELL = R('cell', 'blue'), HALF = R('halfTriangle', 'red'), CELL2 = R('cell', 'yellow'), HALF2 = R('halfTriangle', 'white');
function seeded(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }

const CASES = [
  { name: 'six-8x9', board: { width: 8, height: 9 }, specs: [SMALL, LEG, LOS, TRAP, CELL, HALF], pillars: [] as Pillar[] },
  { name: 'six-9x9-heavy', board: { width: 9, height: 9 }, specs: [SMALL, LEG, BIG, LOS, CELL2, HALF2], pillars: [makePillar('black', 'square1', { x: 2, y: 6 }), makePillar('clear', 'losange2', { x: 5, y: 2 }), makePillar('prism', 'square1', { x: 6, y: 6 }, ['red', 'blue', 'yellow', 'white'])] },
  { name: 'seven-9x9', board: { width: 9, height: 9 }, specs: [SMALL, LEG, BIG, LOS, TRAP, CELL, HALF], pillars: [makePillar('black', 'square1', { x: 4, y: 4 })] },
  { name: 'eight-9x9', board: { width: 9, height: 9 }, specs: [SMALL, LEG, BIG, LOS, TRAP, CELL, HALF, HALF2], pillars: [makePillar('black', 'square1', { x: 1, y: 6 }), makePillar('clear', 'square1', { x: 6, y: 1 })] },
];

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

it.skipIf(process.env.GEN !== 'solverbench')('exact solver benchmark', () => {
  const only = process.env.CASE;
  for (const c of CASES.filter((x) => !only || x.name === only)) {
    const random = seeded(77);
    for (let k = 0; k < Number(process.env.K ?? 4); k++) {
      const room = new Room(c.board, c.pillars);
      const placed = randomJewels(room, c.specs, random);
      if (!placed) continue;
      for (const p of placed) room.apply(p, true);
      const all = fireInOrder(room, allPorts(c.board));
      const max = Number(process.env.MAX ?? 300_000);
      const t0 = performance.now();
      const b = solve(c.board, c.pillars, c.specs, all, { maxNodes: max });
      const tb = performance.now() - t0;
      const line = `${c.name} #${k}: count=${b.count} aborted=${b.aborted} nodes=${b.nodes} ${(tb / 1000).toFixed(1)}s`;
      log(line);
    }
  }
}, 7_200_000);
