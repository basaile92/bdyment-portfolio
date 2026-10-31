import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOARD, generatePuzzle, HEIST_JEWELS, recognizedJewels, SHAPES, type JewelSpec, type Surface,
} from '../../src/domain';
import { seeded } from '../helpers';

describe('recognising drawn jewels', () => {
  it('recognises every jewel of the real layout', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const p = generatePuzzle(DEFAULT_BOARD, HEIST_JEWELS, seeded(seed));
      expect(recognizedJewels(DEFAULT_BOARD, p.surfaces, HEIST_JEWELS)).toEqual([true, true, true, true, true]);
    }
  });

  it('needs the right colour', () => {
    const square = new Map<string, Surface>([['h:1,1', { color: 'red' }], ['h:1,2', { color: 'red' }], ['v:1,1', { color: 'red' }], ['v:2,1', { color: 'red' }]]);
    const block: JewelSpec = { shape: { id: 'block', cells: [{ x: 0, y: 0, part: 'full' }] }, color: 'red' };
    expect(recognizedJewels(DEFAULT_BOARD, square, [block])).toEqual([true]);
    expect(recognizedJewels(DEFAULT_BOARD, square, [{ ...block, color: 'blue' }])).toEqual([false]);
  });

  it('needs the right shape', () => {
    const diamond = new Map<string, Surface>([
      ['d:2,2', { color: 'white', orientation: '/' }], ['d:3,2', { color: 'white', orientation: '\\' }],
      ['d:2,3', { color: 'white', orientation: '\\' }], ['d:3,3', { color: 'white', orientation: '/' }],
    ]);
    expect(recognizedJewels(DEFAULT_BOARD, diamond, [{ shape: SHAPES.diamond, color: 'white' }, { shape: SHAPES.smallTriangle, color: 'white' }]))
      .toEqual([true, false]);
  });
});
