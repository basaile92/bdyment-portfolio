import type { CellPart } from '../../domain';

/** Polygon of a cell part, in a unit square. */
export const PART_POLYGON: Record<CellPart, string> = {
  full: '0,0 1,0 1,1 0,1',
  NW: '0,0 1,0 0,1',
  NE: '0,0 1,0 1,1',
  SW: '0,0 0,1 1,1',
  SE: '1,0 1,1 0,1',
};

/** Quarter triangles of a cell (north, east, south, west), in a unit square. */
export const QUARTER_POLYGON = ['0,0 1,0 .5,.5', '1,0 1,1 .5,.5', '0,1 1,1 .5,.5', '0,0 0,1 .5,.5'] as const;

export function translate(points: string, dx: number, dy: number): string {
  return points
    .split(' ')
    .map((p) => p.split(',').map(Number) as [number, number])
    .map(([x, y]) => `${x + dx},${y + dy}`)
    .join(' ');
}
