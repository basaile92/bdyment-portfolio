import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOARD, everyJewelDetectable, generatePuzzle, HEIST_JEWELS, occupancy, PART_SIDES, type Puzzle,
} from '../../src/domain';
import { seeded } from '../helpers';

const STEP = { T: [0, -1], B: [0, 1], L: [-1, 0], R: [1, 0] } as const;
const OPP = { T: 'B', B: 'T', L: 'R', R: 'L' } as const;

function sharedSides(p: Puzzle): number {
  const occ = occupancy(p.jewels);
  let shared = 0;
  for (const j of p.jewels) for (const c of j.cells) for (const s of PART_SIDES[c.part]) {
    const n = occ.get(`${c.x + STEP[s][0]},${c.y + STEP[s][1]}`);
    if (n && n.owner !== j.id && PART_SIDES[n.part].includes(OPP[s])) shared++;
  }
  return shared;
}

describe('puzzle generation', () => {
  const puzzles = Array.from({ length: 100 }, (_, i) => generatePuzzle(DEFAULT_BOARD, HEIST_JEWELS, seeded(i + 1)));

  it('places the five jewels', () => puzzles.forEach((p) => expect(p.jewels).toHaveLength(5)));

  it('never lets two jewels share a side', () => puzzles.forEach((p) => expect(sharedSides(p)).toBe(0)));

  it('only hides jewels that a laser can reach', () => puzzles.forEach((p) => expect(everyJewelDetectable(p)).toBe(true)));

  it('is reproducible with the same seed', () => {
    const a = generatePuzzle(DEFAULT_BOARD, HEIST_JEWELS, seeded(42));
    const b = generatePuzzle(DEFAULT_BOARD, HEIST_JEWELS, seeded(42));
    expect(a.jewels).toEqual(b.jewels);
  });
});
