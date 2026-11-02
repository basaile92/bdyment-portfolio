import { allPorts, type BoardSize } from './board';
import { ABSORBED, traceLaser } from './laser';
import { sceneOf, type Pillar } from './pillars';
import type { SurfaceMap } from './surfaces';

export interface AlarmThresholds {
  /** Up to this many tests, the alarm stays quiet; one more raises it by one level. */
  readonly quiet: number;
  /** Tests needed to light every sensor (firing them all always solves the room). */
  readonly all: number;
}

const QUIET_RATIO = 0.6;
/** At this alarm level the guard arrives: game over. */
export const MAX_ALARM = 3;

/** Distinct shots needed to light every port: firing them all always solves the room. */
export function shotsToRevealAll(board: BoardSize, surfaces: SurfaceMap, pillars: readonly Pillar[] = []): number {
  const scene = sceneOf(board, pillars);
  const lit = new Set<number>();
  let shots = 0;
  for (const port of allPorts(board)) {
    if (lit.has(port)) continue;
    const { exit } = traceLaser(board, surfaces, port, scene);
    lit.add(port);
    if (exit !== ABSORBED) lit.add(exit);
    shots++;
  }
  return shots;
}

export function alarmThresholds(board: BoardSize, surfaces: SurfaceMap, jewelCount: number, pillars: readonly Pillar[] = []): AlarmThresholds {
  const all = shotsToRevealAll(board, surfaces, pillars);
  return { quiet: quietTests(all, jewelCount), all };
}

/** How many tests stay quiet: a share of those that light every sensor, never fewer than the jewels + 2. */
export function quietTests(all: number, jewelCount: number, ratio = QUIET_RATIO): number {
  return Math.max(jewelCount + 2, Math.round(all * ratio));
}

/**
 * Alarm level, 0 to 3: one level for testing past the quiet limit, one per wrong plan.
 * 0 is a perfect prismjack; 3 brings the guard.
 */
export function alarmFor(shots: number, thresholds: AlarmThresholds, wrongPlans: number): number {
  return Math.min(MAX_ALARM, (shots > thresholds.quiet ? 1 : 0) + wrongPlans);
}
