import type { BoardSize } from './board';
import type { JewelColor } from './colors';

/**
 * A surface is what a laser can bounce on:
 *  - an *edge*: one side of a cell (straight surface, bounces the laser back);
 *  - a *facet*: a cell diagonal (deflects the laser by 90°).
 *
 * Keys:  h:x,y  horizontal edge above cell (x,y)   (y in 0..H)
 *        v:x,y  vertical edge left of cell (x,y)   (x in 0..W)
 *        d:x,y  diagonal inside cell (x,y)
 */
export type SurfaceKey = string;
export type FacetOrientation = '/' | '\\';
export type CellSide = 'T' | 'B' | 'L' | 'R';

export interface Surface {
  readonly color: JewelColor;
  /** Present on facets only. */
  readonly orientation?: FacetOrientation;
}

export type SurfaceMap = ReadonlyMap<SurfaceKey, Surface>;

export const EMPTY_SURFACES: SurfaceMap = new Map();

export function sideKey(x: number, y: number, side: CellSide): SurfaceKey {
  switch (side) {
    case 'T': return `h:${x},${y}`;
    case 'B': return `h:${x},${y + 1}`;
    case 'L': return `v:${x},${y}`;
    case 'R': return `v:${x + 1},${y}`;
  }
}

export function facetKey(x: number, y: number): SurfaceKey {
  return `d:${x},${y}`;
}

/** Key of the edge crossed when leaving (x,y) in direction (dx,dy). */
export function edgeCrossed(x: number, y: number, dx: number, dy: number): SurfaceKey {
  return dx !== 0 ? `v:${Math.max(x, x + dx)},${y}` : `h:${x},${Math.max(y, y + dy)}`;
}

export interface ParsedKey {
  readonly kind: 'h' | 'v' | 'd';
  readonly x: number;
  readonly y: number;
}

export function parseKey(key: SurfaceKey): ParsedKey {
  const [kind, coords] = key.split(':') as ['h' | 'v' | 'd', string];
  const [x, y] = coords.split(',').map(Number) as [number, number];
  return { kind, x, y };
}

export function isFacetKey(key: SurfaceKey): boolean {
  return key.startsWith('d:');
}

const within = (n: number, max: number) => n >= 0 && n <= max;

/** Horizontal edges go one row further than cells, vertical edges one column further. */
export function isValidKey(board: BoardSize, key: SurfaceKey): boolean {
  const { kind, x, y } = parseKey(key);
  const extraRow = kind === 'h' ? 1 : 0;
  const extraCol = kind === 'v' ? 1 : 0;
  return within(x, board.width - 1 + extraCol) && within(y, board.height - 1 + extraRow);
}
