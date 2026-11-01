import { isInside, type BoardSize } from './board';
import type { JewelColor } from './colors';
import { PART_FACET, PART_SIDES, type CellPart, type ShapeCell } from './shapes';
import { facetKey, sideKey, type CellSide, type Surface, type SurfaceKey } from './surfaces';

/** A jewel placed on the board, with absolute cell coordinates. */
export interface PlacedJewel {
  readonly id: number;
  readonly shapeId: string;
  readonly color: JewelColor;
  readonly cells: readonly ShapeCell[];
}

export interface OwnedSurface extends Surface {
  readonly owner: number;
}

const OPPOSITE: Record<CellSide, CellSide> = { T: 'B', B: 'T', L: 'R', R: 'L' };
const STEP: Record<CellSide, [number, number]> = { T: [0, -1], B: [0, 1], L: [-1, 0], R: [1, 0] };

/** Which part of a jewel occupies each cell, indexed by "x,y". */
export function occupancy(jewels: readonly PlacedJewel[]): Map<string, { part: CellPart; owner: number }> {
  const map = new Map<string, { part: CellPart; owner: number }>();
  for (const j of jewels) for (const c of j.cells) map.set(`${c.x},${c.y}`, { part: c.part, owner: j.id });
  return map;
}

/**
 * The outer surfaces of the jewels: every straight side that is not shared with
 * another cell of the same jewel, plus every diagonal.
 */
export function jewelSurfaces(board: BoardSize, jewels: readonly PlacedJewel[]): Map<SurfaceKey, OwnedSurface> {
  const occupied = occupancy(jewels);
  const covers = (x: number, y: number, side: CellSide, owner: number): boolean => {
    if (!isInside(board, x, y)) return false;
    const o = occupied.get(`${x},${y}`);
    return o !== undefined && o.owner === owner && PART_SIDES[o.part].includes(side);
  };
  const surfaces = new Map<SurfaceKey, OwnedSurface>();
  for (const jewel of jewels) {
    for (const { x, y, part } of jewel.cells) {
      const orientation = PART_FACET[part];
      if (orientation) surfaces.set(facetKey(x, y), { color: jewel.color, orientation, owner: jewel.id });
      for (const side of PART_SIDES[part]) {
        const [dx, dy] = STEP[side];
        if (covers(x + dx, y + dy, OPPOSITE[side], jewel.id)) continue; // interior side
        surfaces.set(sideKey(x, y, side), { color: jewel.color, owner: jewel.id });
      }
    }
  }
  return surfaces;
}

/** True when two different jewels would share a cell or a whole side. */
export function wouldTouchBySide(
  occupied: ReadonlyMap<string, { part: CellPart }>,
  board: BoardSize,
  cell: ShapeCell,
): boolean {
  if (occupied.has(`${cell.x},${cell.y}`)) return true;
  return PART_SIDES[cell.part].some((side) => {
    const [dx, dy] = STEP[side];
    const nx = cell.x + dx;
    const ny = cell.y + dy;
    if (!isInside(board, nx, ny)) return false;
    const neighbour = occupied.get(`${nx},${ny}`);
    return neighbour !== undefined && PART_SIDES[neighbour.part].includes(OPPOSITE[side]);
  });
}
