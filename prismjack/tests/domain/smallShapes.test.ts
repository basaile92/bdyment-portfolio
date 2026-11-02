import { describe, expect, it } from 'vitest';
import { jewelSurfaces, recognizedJewels, SHAPES, traceLaser, type JewelColor, type PlacedJewel } from '../../src/domain';

const board = { width: 5, height: 5 };
const place = (shape: 'cell' | 'halfTriangle', color: JewelColor, x: number, y: number): PlacedJewel =>
  ({ id: 0, shapeId: shape, color, cells: SHAPES[shape].cells.map((c) => ({ ...c, x: c.x + x, y: c.y + y })) });

describe('the smallest jewels', () => {
  it('a single cell sends the light straight back, from every side', () => {
    const s = jewelSurfaces(board, [place('cell', 'blue', 2, 2)]);
    for (const port of [2, 7, 12, 17]) expect(traceLaser(board, s, port).exit).toBe(port);
  });

  it('half a cell turns the light on its diagonal and sends it back on its straight sides', () => {
    const s = jewelSurfaces(board, [place('halfTriangle', 'red', 2, 2)]); // filled south-east corner
    expect(traceLaser(board, s, 2).exit).not.toBe(2); // from the top: open side, the facet turns it
    expect(traceLaser(board, s, 7).exit).toBe(7); // from the right: straight wall
  });

  it('is recognised in the loot once its outline is drawn', () => {
    for (const shape of ['cell', 'halfTriangle'] as const) {
      const jewel = place(shape, 'yellow', 1, 3);
      const plan = jewelSurfaces(board, [jewel]);
      expect(recognizedJewels(board, plan, [{ shape: SHAPES[shape], color: 'yellow' }])).toEqual([true]);
    }
  });
});
