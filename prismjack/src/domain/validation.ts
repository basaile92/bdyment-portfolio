import { allPorts, type BoardSize, type PortId } from './board';
import { traceLaser } from './laser';
import type { SurfaceMap } from './surfaces';

/**
 * A plan is accepted when it behaves exactly like the real room for every
 * port: same exit, same colour. Two different layouts that nobody could tell
 * apart from the outside are therefore both correct.
 */
export function mismatchingPorts(board: BoardSize, solution: SurfaceMap, plan: SurfaceMap): PortId[] {
  return allPorts(board).filter((port) => {
    const expected = traceLaser(board, solution, port);
    const actual = traceLaser(board, plan, port);
    return expected.exit !== actual.exit || expected.color !== actual.color;
  });
}

export function planMatches(board: BoardSize, solution: SurfaceMap, plan: SurfaceMap): boolean {
  return mismatchingPorts(board, solution, plan).length === 0;
}
