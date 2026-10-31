/**
 * Jewel colours and how a laser accumulates them.
 * A laser's colour is the *set* of jewel colours it touched: touching the same
 * colour twice changes nothing, so a bit mask is the natural representation.
 */
export type JewelColor = 'red' | 'blue' | 'yellow' | 'white';

/** Bit set of the jewel colours a laser touched (0 = transparent). */
export type ColorMask = number;

export const JEWEL_COLORS: readonly JewelColor[] = ['red', 'blue', 'yellow', 'white'];

export const TRANSPARENT: ColorMask = 0;

const BIT: Record<JewelColor, number> = { red: 1, blue: 2, yellow: 4, white: 8 };

export function tint(mask: ColorMask, color: JewelColor): ColorMask {
  return mask | BIT[color];
}

export function maskOf(...colors: JewelColor[]): ColorMask {
  return colors.reduce<ColorMask>(tint, TRANSPARENT);
}

export function colorsIn(mask: ColorMask): JewelColor[] {
  return JEWEL_COLORS.filter((c) => (mask & BIT[c]) !== 0);
}

export function isMixed(mask: ColorMask): boolean {
  return colorsIn(mask).length > 1;
}
