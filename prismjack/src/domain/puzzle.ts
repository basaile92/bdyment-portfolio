import { allPorts, type BoardSize } from './board';
import { jewelSurfaces, occupancy, wouldTouchBySide, type PlacedJewel } from './jewels';
import { traceLaser } from './laser';
import { mirror, rotate, shapeSize, type JewelSpec, type ShapeCell } from './shapes';
import type { SurfaceMap } from './surfaces';

/** A function returning a float in [0, 1). Injected so puzzles are reproducible. */
export type Random = () => number;

export interface Puzzle {
  readonly board: BoardSize;
  readonly jewels: readonly PlacedJewel[];
  readonly surfaces: SurfaceMap;
}

const MAX_ATTEMPTS = 2000;
const PLACEMENT_TRIES = 80;

function randomOrientation(cells: readonly ShapeCell[], random: Random): ShapeCell[] {
  let out = [...cells];
  const turns = Math.floor(random() * 4);
  for (let i = 0; i < turns; i++) out = rotate(out);
  return random() < 0.5 ? mirror(out) : out;
}

function tryPlace(board: BoardSize, placed: PlacedJewel[], spec: JewelSpec, random: Random): PlacedJewel | null {
  const cells = randomOrientation(spec.shape.cells, random);
  const size = shapeSize(cells);
  const occupied = occupancy(placed);
  for (let t = 0; t < PLACEMENT_TRIES; t++) {
    const ox = Math.floor(random() * (board.width - size.width + 1));
    const oy = Math.floor(random() * (board.height - size.height + 1));
    const moved = cells.map((c) => ({ ...c, x: c.x + ox, y: c.y + oy }));
    if (moved.some((c) => wouldTouchBySide(occupied, board, c))) continue;
    return { id: placed.length, shapeId: spec.shape.id, color: spec.color, cells: moved };
  }
  return null;
}

function placeAll(board: BoardSize, specs: readonly JewelSpec[], random: Random): PlacedJewel[] | null {
  const placed: PlacedJewel[] = [];
  for (const spec of specs) {
    const jewel = tryPlace(board, placed, spec, random);
    if (!jewel) return null;
    placed.push(jewel);
  }
  return placed;
}

/** Every jewel must be reachable by at least one laser, otherwise it could never be found. */
export function everyJewelDetectable(puzzle: Puzzle): boolean {
  const owners = jewelSurfaces(puzzle.board, puzzle.jewels);
  const seen = new Set<number>();
  for (const port of allPorts(puzzle.board)) {
    for (const key of traceLaser(puzzle.board, puzzle.surfaces, port).touched) {
      const owner = owners.get(key)?.owner;
      if (owner !== undefined) seen.add(owner);
    }
  }
  return puzzle.jewels.every((j) => seen.has(j.id));
}

/**
 * Places the jewels at random: they may touch at a single point but never share
 * a side, and each of them can be detected from the outside.
 */
export function generatePuzzle(board: BoardSize, specs: readonly JewelSpec[], random: Random): Puzzle {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const jewels = placeAll(board, specs, random);
    if (!jewels) continue;
    const puzzle: Puzzle = { board, jewels, surfaces: jewelSurfaces(board, jewels) };
    if (everyJewelDetectable(puzzle)) return puzzle;
  }
  throw new Error('Unable to generate a puzzle with these jewels on this board.');
}
