import type { BoardSize } from './board';
import type { JewelColor } from './colors';
import { jewelSurfaces, type PlacedJewel } from './jewels';
import type { Pillar } from './pillars';
import type { Puzzle } from './puzzle';
import { SHAPES, type CellPart, type JewelSpec, type ShapeCell } from './shapes';

/**
 * A room generated and checked offline (single solution when every torch is fired):
 * the campaign levels and the pools of the daily heist and the endless run.
 */
export interface StoredRoom {
  readonly board: BoardSize;
  readonly specs: readonly (readonly [keyof typeof SHAPES, JewelColor])[];
  /** Each jewel's cells, in the order of `specs`. */
  readonly jewels: readonly (readonly (readonly [number, number, CellPart])[])[];
  readonly pillars?: readonly Pillar[];
  /** Difficulty score measured by the solver (campaign levels only). */
  readonly score?: number;
}

export function storedSpecs(room: StoredRoom): JewelSpec[] {
  return room.specs.map(([shape, color]) => ({ shape: SHAPES[shape], color }));
}

const FLIP_X: Record<CellPart, CellPart> = { full: 'full', NW: 'NE', NE: 'NW', SW: 'SE', SE: 'SW' };
const FLIP_Y: Record<CellPart, CellPart> = { full: 'full', NW: 'SW', SW: 'NW', NE: 'SE', SE: 'NE' };

/** Mirror images keep a room's single solution: 4 variants (none, ↔, ↕, both). */
export const ROOM_VARIANTS = 4;

function mirrorCell(board: BoardSize, variant: number) {
  const fx = variant & 1, fy = variant & 2;
  return (c: ShapeCell): ShapeCell => {
    let part = c.part;
    if (fx) part = FLIP_X[part];
    if (fy) part = FLIP_Y[part];
    return { x: fx ? board.width - 1 - c.x : c.x, y: fy ? board.height - 1 - c.y : c.y, part };
  };
}

/** The puzzle of a stored room, seen in mirror image `variant` (0 to 3). */
export function roomPuzzle(room: StoredRoom, variant = 0): Puzzle {
  const { board } = room;
  const move = mirrorCell(board, variant % ROOM_VARIANTS);
  const specs = storedSpecs(room);
  const jewels: PlacedJewel[] = room.jewels.map((cells, id) => ({
    id, shapeId: specs[id]?.shape.id ?? '', color: specs[id]?.color ?? 'white',
    cells: cells.map(([x, y, part]) => move({ x, y, part })),
  }));
  const pillars = (room.pillars ?? []).map((p) => ({ ...p, cells: p.cells.map(move) }));
  return { board, jewels, surfaces: jewelSurfaces(board, jewels), ...(pillars.length ? { pillars } : {}) };
}
