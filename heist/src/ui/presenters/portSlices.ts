import { colorsIn, maskOf, type ColorMask, type JewelColor } from '../../domain';
import type { Point } from './boardGeometry';

export interface Slice {
  readonly color: JewelColor;
  /** SVG path of the pie slice. */
  readonly path: string;
  /** Where the slice's glyph sits. */
  readonly spot: Point;
  /** Mask of the single colour (for ink and fill lookups). */
  readonly mask: ColorMask;
}

/** Slice centre angles (degrees, 0 = right, clockwise) for 2, 3 and 4 colours, matching the glyph layout. */
const CENTRES: Record<number, readonly number[]> = {
  2: [180, 0],
  3: [-90, 150, 30],
  4: [-135, -45, 135, 45],
};

const polar = (c: Point, r: number, deg: number): Point => {
  const a = (deg * Math.PI) / 180;
  return { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) };
};

const fmt = (p: Point) => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`;

/**
 * A mixed laser colour split back into the jewel colours it is made of,
 * one pie slice per colour. Empty for a pure colour or no colour.
 */
export function colorSlices(mask: ColorMask, c: Point, r: number): Slice[] {
  const colors = colorsIn(mask);
  const centres = CENTRES[colors.length];
  if (!centres) return [];
  const half = 180 / colors.length;
  return colors.map((color, i) => {
    const mid = centres[i] ?? 0;
    const from = polar(c, r, mid - half);
    const to = polar(c, r, mid + half);
    return {
      color,
      mask: maskOf(color),
      path: `M ${fmt(c)} L ${fmt(from)} A ${r} ${r} 0 0 1 ${fmt(to)} Z`,
      spot: polar(c, r * 0.5, mid),
    };
  });
}
