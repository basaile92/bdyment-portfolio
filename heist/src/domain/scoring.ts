import { allPorts, type BoardSize } from './board';
import { traceLaser } from './laser';
import type { SurfaceMap } from './surfaces';

export interface StarThresholds {
  /** At most this many shots for 3 stars. */
  readonly threeStars: number;
  /** At most this many shots for 2 stars (= shots needed to light every port). */
  readonly twoStars: number;
}

export type Stars = 0 | 1 | 2 | 3;

const THREE_STAR_RATIO = 0.6;
/** Each wrong plan costs a star; this many and the guard arrives. */
export const MAX_WRONG_PLANS = 3;

/** Distinct shots needed to light every port: firing them all always solves the room. */
export function shotsToRevealAll(board: BoardSize, surfaces: SurfaceMap): number {
  const lit = new Set<number>();
  let shots = 0;
  for (const port of allPorts(board)) {
    if (lit.has(port)) continue;
    lit.add(port).add(traceLaser(board, surfaces, port).exit);
    shots++;
  }
  return shots;
}

export function starThresholds(board: BoardSize, surfaces: SurfaceMap, jewelCount: number): StarThresholds {
  const all = shotsToRevealAll(board, surfaces);
  return { threeStars: Math.max(jewelCount + 2, Math.round(all * THREE_STAR_RATIO)), twoStars: all };
}

/** Stars earned by the shots, minus one per wrong plan (down to zero: the loot, but no glory). */
export function starsFor(shots: number, thresholds: StarThresholds, wrongPlans = 0): Stars {
  const earned = shots <= thresholds.threeStars ? 3 : shots <= thresholds.twoStars ? 2 : 1;
  return Math.max(0, earned - wrongPlans) as Stars;
}
