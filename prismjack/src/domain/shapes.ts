import type { JewelColor } from './colors';
import type { CellSide, FacetOrientation } from './surfaces';

/**
 * Jewel shapes are drawn on the grid with whole cells and half cells.
 * A half cell is a right triangle named after the corner of its right angle.
 */
export type CellPart = 'full' | 'NW' | 'NE' | 'SW' | 'SE';

export interface ShapeCell {
  readonly x: number;
  readonly y: number;
  readonly part: CellPart;
}

export interface JewelShape {
  readonly id: string;
  readonly cells: readonly ShapeCell[];
}

export interface JewelSpec {
  readonly shape: JewelShape;
  readonly color: JewelColor;
}

/** Cell sides covered by each part (the straight sides of the jewel inside that cell). */
export const PART_SIDES: Record<CellPart, readonly CellSide[]> = {
  full: ['T', 'B', 'L', 'R'],
  NW: ['T', 'L'],
  NE: ['T', 'R'],
  SW: ['B', 'L'],
  SE: ['B', 'R'],
};

/** Diagonal of a half cell (undefined for a full cell). */
export const PART_FACET: Record<CellPart, FacetOrientation | undefined> = {
  full: undefined,
  NW: '/',
  SE: '/',
  NE: '\\',
  SW: '\\',
};

const ROTATED: Record<CellPart, CellPart> = { full: 'full', NW: 'NE', NE: 'SE', SE: 'SW', SW: 'NW' };
const MIRRORED: Record<CellPart, CellPart> = { full: 'full', NW: 'NE', NE: 'NW', SW: 'SE', SE: 'SW' };

export function shapeSize(cells: readonly ShapeCell[]): { width: number; height: number } {
  return {
    width: Math.max(...cells.map((c) => c.x)) + 1,
    height: Math.max(...cells.map((c) => c.y)) + 1,
  };
}

/** Quarter turn clockwise. */
export function rotate(cells: readonly ShapeCell[]): ShapeCell[] {
  const { height } = shapeSize(cells);
  return cells.map((c) => ({ x: height - 1 - c.y, y: c.x, part: ROTATED[c.part] }));
}

/** Horizontal mirror. */
export function mirror(cells: readonly ShapeCell[]): ShapeCell[] {
  const { width } = shapeSize(cells);
  return cells.map((c) => ({ x: width - 1 - c.x, y: c.y, part: MIRRORED[c.part] }));
}

const shape = (id: string, cells: [number, number, CellPart][]): JewelShape => ({
  id,
  cells: cells.map(([x, y, part]) => ({ x, y, part })),
});

export const SHAPES = {
  /** Plain 2 × 2 square: only straight sides, light always comes straight back. */
  square: shape('square', [[0, 0, 'full'], [1, 0, 'full'], [0, 1, 'full'], [1, 1, 'full']]),
  /** Isosceles right triangle: hypotenuse 2 cells, height 1. */
  smallTriangle: shape('smallTriangle', [[0, 0, 'NE'], [1, 0, 'NW']]),
  /** Isosceles right triangle with 3-cell legs. */
  legTriangle: shape('legTriangle', [[0, 0, 'SW'], [0, 1, 'full'], [1, 1, 'SW'], [0, 2, 'full'], [1, 2, 'full'], [2, 2, 'SW']]),
  /** Isosceles right triangle: hypotenuse 4 cells, height 2. */
  bigTriangle: shape('bigTriangle', [[0, 0, 'NE'], [1, 0, 'full'], [2, 0, 'full'], [3, 0, 'NW'], [1, 1, 'NE'], [2, 1, 'NW']]),
  /** Square standing on a corner, 2 × 2 cells. */
  diamond: shape('diamond', [[0, 0, 'SE'], [1, 0, 'SW'], [0, 1, 'NE'], [1, 1, 'NW']]),
  /** Slanted bar, one cell wide and three tall, leaning the other way. */
  trapezoid: shape('trapezoid', [[0, 0, 'SE'], [0, 1, 'full'], [0, 2, 'NW']]),
} as const;

/** The five jewels hidden in every prismjack. */
export const PRISMJACK_JEWELS: readonly JewelSpec[] = [
  { shape: SHAPES.smallTriangle, color: 'blue' },
  { shape: SHAPES.legTriangle, color: 'red' },
  { shape: SHAPES.bigTriangle, color: 'yellow' },
  { shape: SHAPES.diamond, color: 'yellow' },
  { shape: SHAPES.trapezoid, color: 'white' },
];
