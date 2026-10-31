import { colorsIn, type ColorMask, type JewelColor } from '../../domain';
import type { Strings } from '../i18n/strings';

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

/** "purple (red + blue)" for mixes, just the name otherwise. */
export function laserDescription(mask: ColorMask, s: Strings): string {
  const parts = colorsIn(mask);
  const name = laserName(mask, s);
  return parts.length > 1 ? `${name} (${parts.map((c) => s.colors[c]).join(' + ')})` : name;
}
