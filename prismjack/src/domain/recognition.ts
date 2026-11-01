import type { BoardSize } from './board';
import { closedRegions, type ClosedRegion, type Quarter } from './regions';
import { mirror, rotate, type CellPart, type JewelSpec, type ShapeCell } from './shapes';
import type { SurfaceMap } from './surfaces';

/**
 * Recognises, in the player's drawing, the closed shapes that look exactly like
 * a jewel to find (same colour, same shape, any orientation). Used to tick the
 * loot list and to warn before submitting an incomplete plan.
 */
const PART_QUARTERS: Record<CellPart, readonly Quarter[]> = {
  full: [0, 1, 2, 3],
  NW: [0, 3],
  NE: [0, 1],
  SW: [2, 3],
  SE: [1, 2],
};

type Footprint = string;

function footprint(quarters: readonly { x: number; y: number; q: Quarter }[]): Footprint {
  const minX = Math.min(...quarters.map((c) => c.x));
  const minY = Math.min(...quarters.map((c) => c.y));
  return quarters.map((c) => `${c.x - minX},${c.y - minY},${c.q}`).sort().join('|');
}

function shapeQuarters(cells: readonly ShapeCell[]) {
  return cells.flatMap((c) => PART_QUARTERS[c.part].map((q) => ({ x: c.x, y: c.y, q })));
}

/** The footprints of a shape in its 8 orientations (4 turns × mirror). */
export function shapeFootprints(cells: readonly ShapeCell[]): Set<Footprint> {
  const prints = new Set<Footprint>();
  let current = [...cells];
  for (let turn = 0; turn < 4; turn++) {
    prints.add(footprint(shapeQuarters(current)));
    prints.add(footprint(shapeQuarters(mirror(current))));
    current = rotate(current);
  }
  return prints;
}

export function regionMatches(region: ClosedRegion, spec: JewelSpec): boolean {
  return region.color === spec.color && shapeFootprints(spec.shape.cells).has(footprint(region.quarters));
}

/** For each jewel to find, whether the plan already contains a matching closed shape. */
export function recognizedJewels(board: BoardSize, plan: SurfaceMap, specs: readonly JewelSpec[]): boolean[] {
  const free = [...closedRegions(board, plan)];
  return specs.map((spec) => {
    const i = free.findIndex((r) => regionMatches(r, spec));
    if (i < 0) return false;
    free.splice(i, 1);
    return true;
  });
}
