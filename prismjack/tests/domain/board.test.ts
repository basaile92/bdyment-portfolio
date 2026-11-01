import { describe, expect, it } from 'vitest';
import { allPorts, DEFAULT_BOARD, portEntry, portOutside, portSide } from '../../src/domain';

describe('board ports', () => {
  const board = DEFAULT_BOARD;

  it('numbers 2W+2H ports clockwise', () => {
    expect(allPorts(board)).toHaveLength(36);
    expect(portSide(board, 0)).toEqual({ side: 'top', index: 0 });
    expect(portSide(board, 8)).toEqual({ side: 'right', index: 0 });
    expect(portSide(board, 18)).toEqual({ side: 'bottom', index: 0 });
    expect(portSide(board, 35)).toEqual({ side: 'left', index: 9 });
  });

  it('finds every port again from the square just outside its entry cell', () => {
    for (const port of allPorts(board)) {
      const e = portEntry(board, port);
      expect(portOutside(board, e.x - e.dx, e.y - e.dy)).toBe(port);
    }
  });
});
