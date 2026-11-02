import { makePillar, type PortId, type StoredRoom } from '../domain';

/**
 * The playable tutorial: four tiny rooms where the player does every gesture once, guided step by step.
 * Each step waits for one thing: a given torch, the jewels drawn, GO, or nothing in particular (free play).
 * The texts live in i18n (`lessons`, one line per step); tests check the rooms do what the texts say.
 */
export type LessonStep =
  | { readonly kind: 'fire'; readonly port: PortId }
  | { readonly kind: 'draw' }
  | { readonly kind: 'go' }
  | { readonly kind: 'free' };

export interface Lesson {
  readonly room: StoredRoom;
  readonly steps: readonly LessonStep[];
  /** Show the jewels' outline as a dotted guide while drawing. */
  readonly ghost: boolean;
}

const fire = (port: PortId): LessonStep => ({ kind: 'fire', port });

export const LESSONS: readonly Lesson[] = [
  {
    // Flat sides: an empty row, a red ↩ on the next row and on column 2, then column 1 empty — only now is the square's
    // place certain (with column 1 still unknown it could also sit one column to the left).
    room: { board: { width: 5, height: 5 }, specs: [['square', 'red']], jewels: [[[2, 1, 'full'], [3, 1, 'full'], [2, 2, 'full'], [3, 2, 'full']]] },
    steps: [fire(15), fire(16), fire(2), fire(1), { kind: 'draw' }, { kind: 'go' }],
    ghost: true,
  },
  {
    // Facets: the light turns at right angles on a yellow diamond.
    room: { board: { width: 5, height: 5 }, specs: [['diamond', 'yellow']], jewels: [[[1, 2, 'SE'], [2, 2, 'SW'], [1, 3, 'NE'], [2, 3, 'NW']]] },
    steps: [fire(17), fire(18), { kind: 'draw' }, { kind: 'go' }],
    ghost: true,
  },
  {
    // Colours: a blue ↩, then one light through both jewels picks up yellow and blue (both on one row, but which?);
    // from the left, the light turns up at column 1: the diamond's facet is there, so both jewels are on row 1.
    room: {
      board: { width: 6, height: 5 },
      specs: [['diamond', 'yellow'], ['smallTriangle', 'blue']],
      jewels: [[[1, 1, 'SE'], [2, 1, 'SW'], [1, 2, 'NE'], [2, 2, 'NW']], [[4, 1, 'NE'], [5, 1, 'NW']]],
    },
    steps: [fire(4), fire(2), fire(18), { kind: 'draw' }, { kind: 'go' }],
    ghost: true,
  },
  {
    // Pillars: black swallows, clear turns without colour, the prism gives red then blue. Then a white jewel, alone.
    room: {
      board: { width: 6, height: 6 },
      specs: [['square', 'white']],
      jewels: [[[3, 0, 'full'], [4, 0, 'full'], [3, 1, 'full'], [4, 1, 'full']]],
      pillars: [
        makePillar('black', 'square1', { x: 1, y: 4 }),
        makePillar('clear', 'losange2', { x: 3, y: 3 }),
        makePillar('prism', 'square1', { x: 1, y: 1 }, ['red', 'blue', 'yellow', 'white']),
      ],
    },
    steps: [fire(22), fire(16), fire(19), fire(1), { kind: 'free' }],
    ghost: false,
  },
];

export const LESSON_COUNT = LESSONS.length;
