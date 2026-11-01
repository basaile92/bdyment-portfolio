import { describe, expect, it } from 'vitest';
import {
  allPorts, DEFAULT_BOARD, EMPTY_SURFACES, generatePuzzle, PRISMJACK_JEWELS, maskOf, portFor, traceLaser, TRANSPARENT,
  type Surface,
} from '../../src/domain';
import { seeded } from '../helpers';

const board = DEFAULT_BOARD;
const map = (entries: [string, Surface][]) => new Map(entries);

describe('laser', () => {
  it('crosses an empty room in a straight line', () => {
    const r = traceLaser(board, EMPTY_SURFACES, portFor(board, 'top', 3));
    expect(r.exit).toBe(portFor(board, 'bottom', 3));
    expect(r.color).toBe(TRANSPARENT);
  });

  it('comes back from a straight wall, tinted', () => {
    const walls = map([['v:4,2', { color: 'red' }]]);
    const r = traceLaser(board, walls, portFor(board, 'left', 2));
    expect(r.exit).toBe(portFor(board, 'left', 2));
    expect(r.color).toBe(maskOf('red'));
  });

  it('ignores a wall it runs alongside', () => {
    const walls = map([['v:4,2', { color: 'red' }]]);
    expect(traceLaser(board, walls, portFor(board, 'top', 4)).color).toBe(TRANSPARENT);
  });

  it('turns 90° on a facet', () => {
    const facet = map([['d:3,5', { color: 'blue', orientation: '/' }]]);
    const r = traceLaser(board, facet, portFor(board, 'left', 5)); // going right, '/' sends it up
    expect(r.exit).toBe(portFor(board, 'top', 3));
    expect(r.color).toBe(maskOf('blue'));
  });

  it('bounces straight back on a wall at the board edge', () => {
    const r = traceLaser(board, map([['h:2,0', { color: 'yellow' }]]), portFor(board, 'top', 2));
    expect(r.exit).toBe(portFor(board, 'top', 2));
    expect(r.color).toBe(maskOf('yellow'));
  });

  it('is reversible: firing from the exit gives back the entry, same colour', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const puzzle = generatePuzzle(board, PRISMJACK_JEWELS, seeded(seed));
      for (const port of allPorts(board)) {
        const there = traceLaser(board, puzzle.surfaces, port);
        const back = traceLaser(board, puzzle.surfaces, there.exit);
        expect(back.exit).toBe(port);
        expect(back.color).toBe(there.color);
      }
    }
  });
});
