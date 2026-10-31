import { describe, expect, it } from 'vitest';
import { HEIST_JEWELS, mirror, rotate, SHAPES, type ShapeCell } from '../../src/domain';

const sorted = (cells: ShapeCell[]) => [...cells].sort((a, b) => a.y - b.y || a.x - b.x);

describe('jewel shapes', () => {
  it.each(Object.values(SHAPES))('$id comes back after four quarter turns', (shape) => {
    let cells = [...shape.cells];
    for (let i = 0; i < 4; i++) cells = rotate(cells);
    expect(sorted(cells)).toEqual(sorted([...shape.cells]));
  });

  it.each(Object.values(SHAPES))('$id comes back after two mirrors', (shape) => {
    expect(sorted(mirror(mirror(shape.cells)))).toEqual(sorted([...shape.cells]));
  });

  it('rotates a half cell corner clockwise', () => {
    expect(rotate([{ x: 0, y: 0, part: 'SW' }])).toEqual([{ x: 0, y: 0, part: 'NW' }]);
  });
});

describe('the heist jewels', () => {
  const area = (cells: readonly { part: string }[]) => cells.reduce((a, c) => a + (c.part === 'full' ? 1 : 0.5), 0);

  it('has the five jewels of Le Casse', () => {
    expect(HEIST_JEWELS.map((j) => `${j.color} ${j.shape.id}`)).toEqual([
      'blue smallTriangle', 'red legTriangle', 'yellow bigTriangle', 'yellow diamond', 'white trapezoid',
    ]);
  });

  it('gives each shape the requested size', () => {
    expect(area(SHAPES.smallTriangle.cells)).toBe(1); // hypotenuse 2, height 1
    expect(area(SHAPES.legTriangle.cells)).toBe(4.5); // legs 3 × 3
    expect(area(SHAPES.bigTriangle.cells)).toBe(4); // hypotenuse 4, height 2
    expect(area(SHAPES.diamond.cells)).toBe(2);
    expect(area(SHAPES.trapezoid.cells)).toBe(2);
  });
});
