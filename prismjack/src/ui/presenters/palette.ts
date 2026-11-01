import { colorsIn, type ColorMask, type JewelColor } from '../../domain';
import type { Strings } from '../i18n/strings';
import { SLICE_CENTRES } from './portSlices';

export const JEWEL_HEX: Record<JewelColor, string> = {
  red: '#ff4d6d',
  blue: '#3d63ff',
  yellow: '#ffd23f',
  white: '#ffffff',
};


/**
 * Second code, so colour is never the only cue (colour blindness, sunlight):
 * every jewel colour also has a shape.
 */
export type Glyph = 'triangle' | 'square' | 'circle' | 'diamond';
export const GLYPH: Record<JewelColor, Glyph> = { red: 'triangle', blue: 'square', yellow: 'circle', white: 'diamond' };

/** Display colour and whether text on it should be dark (index = colour mask). Names live in i18n. */
const MIXES: readonly [string, boolean][] = [
  ['transparent', false], ['#ff4d6d', true], ['#3d63ff', false], ['#8e3bd9', false],
  ['#ffd21f', true], ['#ff8a1f', true], ['#22b04b', true], ['#7a4a22', false],
  ['#ffffff', true], ['#ff9aa8', true], ['#a9d8ff', true], ['#c9a0f0', true],
  ['#fff3a3', true], ['#ffc48a', true], ['#9be3a8', true], ['#c49a6c', true],
];

export function laserHex(mask: ColorMask): string {
  return MIXES[mask]?.[0] ?? '#ffffff';
}

export function laserName(mask: ColorMask, s: Strings): string {
  return s.laserNames[mask] ?? '';
}

/** Ink to draw on top of a laser colour. */
export function inkOn(mask: ColorMask): string {
  return MIXES[mask]?.[1] ? '#1b1745' : '#ffffff';
}

/** Colours are never blended: "red + blue" for several, just the name otherwise. */
export function laserDescription(mask: ColorMask, s: Strings): string {
  const parts = colorsIn(mask);
  return parts.length > 1 ? parts.map((c) => s.colors[c]).join(' + ') : laserName(mask, s);
}

/**
 * CSS background of a light: one flat colour, or the jewel colours side by side
 * (same split as the torch lenses: left/right for 2, thirds, quarters).
 */
export function laserFill(mask: ColorMask): string {
  const parts = colorsIn(mask);
  const centres = SLICE_CENTRES[parts.length];
  if (!centres) return laserHex(mask);
  const step = 360 / parts.length;
  /** SVG angles (0 = right) → CSS conic angles (0 = top), sorted clockwise. */
  const slices = parts
    .map((c, i) => ({ c, at: (((centres[i] ?? 0) + 90) % 360 + 360) % 360 }))
    .sort((a, b) => a.at - b.at);
  const start = (slices[0]?.at ?? 0) - step / 2;
  const stops = slices.map((s, i) => `${JEWEL_HEX[s.c]} ${i * step}deg ${(i + 1) * step}deg`).join(', ');
  return `conic-gradient(from ${start}deg, ${stops})`;
}
