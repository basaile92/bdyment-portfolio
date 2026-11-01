import { describe, expect, it } from 'vitest';
import { appendFileSync, writeFileSync } from 'node:fs';
import { allPorts, type BoardSize } from '../src/domain/board';
import { jewelSurfaces } from '../src/domain/jewels';
import { traceLaser } from '../src/domain/laser';
import { advanceStates, makePillar, sceneOf, type Pillar, type PillarKind, type PillarShape } from '../src/domain/pillars';
import { SHAPES, type JewelSpec } from '../src/domain/shapes';
import { compatible, type Placement } from './diamondSolver';
import { ABSORBED, fireInOrder, rate, Room, score } from './solver';

const S = SHAPES;
const log = (s: string) => appendFileSync(process.env.LOG ?? '/tmp/pillars.log', s + '\n');
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

const TWO: JewelSpec[] = [{ shape: S.diamond, color: 'yellow' }, { shape: S.legTriangle, color: 'red' }];
const THREE: JewelSpec[] = [{ shape: S.smallTriangle, color: 'blue' }, { shape: S.legTriangle, color: 'red' }, { shape: S.trapezoid, color: 'white' }];
type PillarSpec = [PillarKind, PillarShape];
export const PILLAR_CONFIGS: { id: string; label: string; board: BoardSize; specs: JewelSpec[]; pillars: PillarSpec[] }[] = [
  { id: 'p0', label: '2 joyaux, sans pilier', board: { width: 6, height: 6 }, specs: TWO, pillars: [] },
  { id: 'p1', label: '2 joyaux + pilier noir', board: { width: 6, height: 6 }, specs: TWO, pillars: [['black', 'square1']] },
  { id: 'p2', label: '2 joyaux + pilier incolore', board: { width: 6, height: 6 }, specs: TWO, pillars: [['clear', 'losange2']] },
  { id: 'p3', label: '2 joyaux + prisme', board: { width: 6, height: 6 }, specs: TWO, pillars: [['prism', 'square2']] },
  { id: 'p4', label: '3 joyaux + noir + incolore', board: { width: 6, height: 6 }, specs: THREE, pillars: [['black', 'square2'], ['clear', 'losange2']] },
];

const COLORS = ['red', 'blue', 'yellow', 'white'] as const;

function randomPillars(board: BoardSize, kinds: PillarSpec[], random: () => number): Pillar[] {
  const out: Pillar[] = [];
  for (const [kind, shape] of kinds) {
    for (let t = 0; t < 100; t++) {
      const size = shape === 'square1' ? 1 : 2;
      // Keep pillars off the outer ring, so they are not glued to a wall.
      const x = 1 + Math.floor(random() * (board.width - size - 1)), y = 1 + Math.floor(random() * (board.height - size - 1));
      const order = [...COLORS].sort(() => random() - 0.5);
      const p = makePillar(kind, shape, { x, y }, order);
      const cells = new Set(out.flatMap((q) => q.cells.map((c) => `${c.x},${c.y}`)));
      if (p.cells.some((c) => cells.has(`${c.x},${c.y}`))) continue;
      out.push(p);
      break;
    }
  }
  return out;
}

function randomJewels(room: Room, specs: JewelSpec[], random: () => number): Placement[] | null {
  const placed: Placement[] = [];
  for (const [i, spec] of specs.entries()) {
    const list = room.placementsOf(spec, i);
    let ok = false;
    for (let t = 0; t < 300 && !ok; t++) {
      const p = list[Math.floor(random() * list.length)];
      if (p && placed.every((q) => compatible(room.board, q, p))) { placed.push(p); ok = true; }
    }
    if (!ok) return null;
  }
  return placed;
}

describe('pillar solver', () => {
  it('traces like the game', () => {
    const random = seeded(3);
    for (let n = 0; n < 40; n++) {
      const board = { width: 6, height: 6 };
      const pillars = randomPillars(board, [['black', 'square1'], ['clear', 'losange2'], ['prism', 'square2']], random);
      const room = new Room(board, pillars);
      const placed = randomJewels(room, THREE, random);
      if (!placed) continue;
      for (const p of placed) room.apply(p, true);
      const surfaces = jewelSurfaces(board, placed.map((p, i) => ({ id: i, shapeId: '', color: THREE[p.piece]!.color, cells: p.cells })));
      const ports = allPorts(board).sort(() => random() - 0.5);
      const fast = fireInOrder(room, ports);
      let scene = sceneOf(board, pillars);
      ports.forEach((port, k) => {
        const r = traceLaser(board, surfaces, port, scene);
        scene = { ...scene, states: advanceStates(scene, r.pillarsTouched) };
        const expected = { b: r.exit, color: r.exit === ABSORBED ? 0 : r.color };
        expect({ b: fast[k]!.b, color: fast[k]!.color }).toEqual(expected);
      });
    }
  });

  it.skipIf(!process.env.POOL)('builds rated pools with pillars', () => {
    const only = process.env.POOL?.split(',');
    const count = Number(process.env.N ?? 10);
    for (const cfg of PILLAR_CONFIGS) {
      if (only && !only.includes(cfg.id)) continue;
      const random = seeded(77);
      const rooms: unknown[] = [];
      for (let tries = 0; rooms.length < count && tries < count * 6; tries++) {
        const pillars = randomPillars(cfg.board, cfg.pillars, random);
        if (pillars.length < cfg.pillars.length) continue;
        const room = new Room(cfg.board, pillars);
        const placed = randomJewels(room, cfg.specs, random);
        if (!placed) continue;
        const r = rate(cfg.board, pillars, cfg.specs, placed, random);
        log(`${cfg.id} ${rooms.length}: unique=${r.unique} score=${score(r)} tests=${r.tests} (${r.testsMin}-${r.testsMax}) effort=${r.effort} aborted=${r.aborted} ${(r.ms / 1000).toFixed(1)}s`);
        if (!r.unique || r.aborted) continue;
        rooms.push({ score: score(r), blind: r.tests, effort: r.effort, jewels: placed.map((p) => p.cells.map((c) => [c.x, c.y, c.part])), pillars });
        writeFileSync(`/tmp/pool-${cfg.id}.json`, JSON.stringify({ id: cfg.id, label: cfg.label, board: cfg.board, specs: cfg.specs.map((s) => [s.shape.id, s.color]), rooms }));
      }
    }
  }, 3_600_000);
});
