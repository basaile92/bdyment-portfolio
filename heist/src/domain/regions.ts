import { isInside, type BoardSize } from './board';
import type { JewelColor } from './colors';
import { facetKey, sideKey, type CellSide, type SurfaceKey, type SurfaceMap } from './surfaces';

/**
 * Detects the closed shapes of a plan, so they can be filled with their colour.
 * Each cell is split into four triangles (quarters) around its centre; the
 * area reachable from outside the board without crossing a surface is open,
 * everything else is enclosed.
 */
export type Quarter = 0 | 1 | 2 | 3; // north, east, south, west

export interface QuarterCell {
  readonly x: number;
  readonly y: number;
  readonly q: Quarter;
}

export interface ClosedRegion {
  readonly quarters: readonly QuarterCell[];
  readonly color: JewelColor;
}

const QUARTER_SIDE: Record<Quarter, CellSide> = { 0: 'T', 1: 'R', 2: 'B', 3: 'L' };
const QUARTER_STEP: Record<Quarter, [number, number]> = { 0: [0, -1], 1: [1, 0], 2: [0, 1], 3: [-1, 0] };
const FACING: Record<Quarter, Quarter> = { 0: 2, 1: 3, 2: 0, 3: 1 };

interface Link {
  readonly to: QuarterCell;
  readonly wall: SurfaceKey | null;
}

/** A '/' facet separates N|E and S|W; a '\' facet separates N|W and E|S. */
function facetBlocks(orientation: string | undefined, a: Quarter, b: Quarter): boolean {
  if (!orientation) return false;
  const pair = `${Math.min(a, b)}${Math.max(a, b)}`;
  return orientation === '/' ? pair === '01' || pair === '23' : pair === '03' || pair === '12';
}

function links(plan: SurfaceMap, { x, y, q }: QuarterCell): Link[] {
  const facet = facetKey(x, y);
  const orientation = plan.get(facet)?.orientation;
  const inner = ([(q + 1) % 4, (q + 3) % 4] as Quarter[]).map((r) => ({
    to: { x, y, q: r },
    wall: facetBlocks(orientation, q, r) ? facet : null,
  }));
  const [dx, dy] = QUARTER_STEP[q];
  const side = sideKey(x, y, QUARTER_SIDE[q]);
  return [...inner, { to: { x: x + dx, y: y + dy, q: FACING[q] }, wall: plan.has(side) ? side : null }];
}

function outsideSeeds(board: BoardSize, plan: SurfaceMap): QuarterCell[] {
  const seeds: QuarterCell[] = [];
  const add = (x: number, y: number, q: Quarter) => {
    if (!plan.has(sideKey(x, y, QUARTER_SIDE[q]))) seeds.push({ x, y, q });
  };
  for (let x = 0; x < board.width; x++) { add(x, 0, 0); add(x, board.height - 1, 2); }
  for (let y = 0; y < board.height; y++) { add(0, y, 3); add(board.width - 1, y, 1); }
  return seeds;
}

interface Flood {
  readonly board: BoardSize;
  readonly plan: SurfaceMap;
  readonly seen: Set<string>;
  /** Collects the colours of the surfaces bounding the flooded area. */
  readonly walls?: Map<string, number>;
}

function flood({ board, plan, seen, walls }: Flood, seeds: QuarterCell[]): QuarterCell[] {
  const id = (c: QuarterCell) => `${c.x},${c.y},${c.q}`;
  const stack = seeds.filter((s) => !seen.has(id(s)));
  stack.forEach((s) => seen.add(id(s)));
  const visited: QuarterCell[] = [];
  while (stack.length) {
    const cell = stack.pop() as QuarterCell;
    visited.push(cell);
    for (const { to, wall } of links(plan, cell)) {
      if (wall) { const c = plan.get(wall)?.color; if (c && walls) walls.set(c, (walls.get(c) ?? 0) + 1); continue; }
      if (!isInside(board, to.x, to.y) || seen.has(id(to))) continue;
      seen.add(id(to));
      stack.push(to);
    }
  }
  return visited;
}

export function closedRegions(board: BoardSize, plan: SurfaceMap): ClosedRegion[] {
  const seen = new Set<string>();
  flood({ board, plan, seen }, outsideSeeds(board, plan));
  const regions: ClosedRegion[] = [];
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      for (const q of [0, 1, 2, 3] as Quarter[]) {
        if (seen.has(`${x},${y},${q}`)) continue;
        const walls = new Map<string, number>();
        const quarters = flood({ board, plan, seen, walls }, [{ x, y, q }]);
        const color = [...walls.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as JewelColor | undefined;
        if (color) regions.push({ quarters, color });
      }
    }
  }
  return regions;
}
