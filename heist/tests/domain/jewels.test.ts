import { describe, expect, it } from 'vitest';
import { DEFAULT_BOARD, jewelSurfaces, SHAPES, wouldTouchBySide, occupancy, type PlacedJewel } from '../../src/domain';

const place = (id: number, shape: keyof typeof SHAPES, dx: number, dy: number): PlacedJewel => ({
  id, shapeId: shape, color: 'blue',
  cells: SHAPES[shape].cells.map((c) => ({ ...c, x: c.x + dx, y: c.y + dy })),
});

describe('jewel surfaces', () => {
  it('keeps only the outer sides and the diagonals of the big triangle', () => {
    const surfaces = jewelSurfaces(DEFAULT_BOARD, [place(0, 'bigTriangle', 2, 3)]);
    expect([...surfaces.keys()].sort()).toEqual(
      ['d:2,3', 'd:3,4', 'd:4,4', 'd:5,3', 'h:2,3', 'h:3,3', 'h:4,3', 'h:5,3'].sort(),
    );
  });

  it('gives the diamond four facets and no straight side', () => {
    const surfaces = jewelSurfaces(DEFAULT_BOARD, [place(0, 'diamond', 1, 1)]);
    expect([...surfaces.keys()].every((k) => k.startsWith('d:'))).toBe(true);
    expect(surfaces.size).toBe(4);
  });
});

describe('placement rule', () => {
  const triangle = place(0, 'legTriangle', 0, 0); // staircase: (0,0) SW · (0,1) full, (1,1) SW · (0,2) (1,2) full, (2,2) SW
  const occupied = occupancy([triangle]);

  it('forbids sharing a side', () => {
    expect(wouldTouchBySide(occupied, DEFAULT_BOARD, { x: 0, y: 3, part: 'full' })).toBe(true);
  });

  it('allows touching at a single point', () => {
    expect(wouldTouchBySide(occupied, DEFAULT_BOARD, { x: 3, y: 3, part: 'full' })).toBe(false);
  });

  it('allows a neighbour cell when the triangle does not cover that side', () => {
    expect(wouldTouchBySide(occupied, DEFAULT_BOARD, { x: 1, y: 0, part: 'full' })).toBe(false);
  });
});
