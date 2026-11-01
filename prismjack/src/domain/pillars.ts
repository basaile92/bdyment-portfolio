import type { BoardSize } from './board';
import type { JewelColor } from './colors';
import { jewelSurfaces, type OwnedSurface, type PlacedJewel } from './jewels';
import type { CellPart, ShapeCell } from './shapes';
import { parseKey, type SurfaceKey } from './surfaces';

/**
 * Pillars: fixed, visible from the start, part of the room's layout.
 *  - black: swallows the light (the torch shows "absorbed", nothing comes out);
 *  - clear: sends the light on like a jewel, without adding any colour;
 *  - prism: four colours in a shown order; it gives the light its current colour, then moves on
 *    to the next one after every new test that touched it. The order of the tests matters.
 */
export type PillarKind = 'black' | 'clear' | 'prism';
export type PillarShape = 'square1' | 'square2' | 'losange2';

export interface Pillar {
  readonly kind: PillarKind;
  readonly shape: PillarShape;
  readonly cells: readonly ShapeCell[];
  /** Prism only: its four colours, in order. */
  readonly order?: readonly JewelColor[];
}

const SHAPE_CELLS: Record<PillarShape, readonly [number, number, CellPart][]> = {
  square1: [[0, 0, 'full']],
  square2: [[0, 0, 'full'], [1, 0, 'full'], [0, 1, 'full'], [1, 1, 'full']],
  losange2: [[0, 0, 'SE'], [1, 0, 'SW'], [0, 1, 'NE'], [1, 1, 'NW']],
};

export function pillarSize(shape: PillarShape): number {
  return shape === 'square1' ? 1 : 2;
}

/** A pillar whose top-left cell is `at`. */
export function makePillar(kind: PillarKind, shape: PillarShape, at: { x: number; y: number }, order?: readonly JewelColor[]): Pillar {
  const cells = SHAPE_CELLS[shape].map(([dx, dy, part]) => ({ x: at.x + dx, y: at.y + dy, part }));
  return kind === 'prism' ? { kind, shape, cells, order: order ?? ['red', 'blue', 'yellow', 'white'] } : { kind, shape, cells };
}

/** Pillars seen as jewels, for placement rules (no shared cell, no shared side). */
export function pillarBodies(pillars: readonly Pillar[], firstId: number): PlacedJewel[] {
  return pillars.map((p, i) => ({ id: firstId + i, shapeId: `pillar-${p.shape}`, color: 'white', cells: p.cells }));
}

/** The pillars' outer surfaces; `owner` is the pillar's index. */
export function pillarSurfaces(board: BoardSize, pillars: readonly Pillar[]): Map<SurfaceKey, OwnedSurface> {
  return jewelSurfaces(board, pillarBodies(pillars, 0));
}

/** The colour a prism gives the light, after `state` advances. */
export function prismColor(pillar: Pillar, state: number): JewelColor {
  const order = pillar.order ?? ['red', 'blue', 'yellow', 'white'];
  return order[state % order.length] ?? 'white';
}

/** Light-related view of a room's pillars, with each prism's current state. */
export interface PillarScene {
  readonly pillars: readonly Pillar[];
  readonly surfaces: ReadonlyMap<SurfaceKey, OwnedSurface>;
  readonly states: readonly number[];
}

export const NO_PILLARS: PillarScene = { pillars: [], surfaces: new Map(), states: [] };

export function sceneOf(board: BoardSize, pillars: readonly Pillar[] | undefined, states?: readonly number[]): PillarScene {
  if (!pillars || pillars.length === 0) return NO_PILLARS;
  return { pillars, surfaces: pillarSurfaces(board, pillars), states: states ?? pillars.map(() => 0) };
}

/** Prisms move on by one colour after a test that touched them (once, however often it was touched). */
export function advanceStates(scene: PillarScene, touched: readonly number[]): number[] {
  const next = [...scene.states];
  for (const i of new Set(touched)) if (scene.pillars[i]?.kind === 'prism') next[i] = (next[i] ?? 0) + 1;
  return next;
}

/** Cells taken by pillars (indices): nothing can be drawn there. */
export function pillarCells(board: BoardSize, pillars: readonly Pillar[] | undefined): Set<number> {
  return new Set((pillars ?? []).flatMap((p) => p.cells.map((c) => c.y * board.width + c.x)));
}

/**
 * True when a surface lies inside `cells`: a diagonal in one of them, or a side between two of them.
 * A side between a pillar and a free cell stays drawable (the player may outline the pillar).
 */
export function keyInsideCells(board: BoardSize, key: SurfaceKey, cells: ReadonlySet<number>): boolean {
  if (cells.size === 0) return false;
  const { kind, x, y } = parseKey(key);
  const around: [number, number][] = kind === 'd' ? [[x, y]] : kind === 'h' ? [[x, y - 1], [x, y]] : [[x - 1, y], [x, y]];
  return around.every(([cx, cy]) => cx >= 0 && cy >= 0 && cx < board.width && cy < board.height && cells.has(cy * board.width + cx));
}
