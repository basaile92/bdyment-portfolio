import { allPorts, type BoardSize, type PortId } from './board';
import { sameResult, traceLaser } from './laser';
import { advanceStates, type Pillar, type PillarScene, sceneOf } from './pillars';
import type { SurfaceMap } from './surfaces';

/**
 * A plan is accepted when it behaves exactly like the real room for every
 * port: same exit, same colour. Two different layouts that nobody could tell
 * apart from the outside are therefore both correct.
 *
 * With a prism pillar the result of a test depends on when it is fired: the tests already
 * fired (`history`, in order) are replayed on both rooms, then every port is compared from there.
 */
export interface PlanContext {
  /** The room's pillars (the plan shares them). */
  readonly pillars?: readonly Pillar[] | undefined;
  /** Ports fired so far, in order. */
  readonly history?: readonly PortId[];
}

export function mismatchingPorts(board: BoardSize, solution: SurfaceMap, plan: SurfaceMap, context: PlanContext = {}): PortId[] {
  const { pillars = [], history = [] } = context;
  let real: PillarScene = sceneOf(board, pillars);
  let drawn: PillarScene = real;
  const wrong = new Set<PortId>();
  for (const port of history) {
    const a = traceLaser(board, solution, port, real);
    const b = traceLaser(board, plan, port, drawn);
    if (!sameResult(a, b)) wrong.add(port);
    real = { ...real, states: advanceStates(real, a.pillarsTouched) };
    drawn = { ...drawn, states: advanceStates(drawn, b.pillarsTouched) };
  }
  for (const port of allPorts(board)) {
    if (!sameResult(traceLaser(board, solution, port, real), traceLaser(board, plan, port, drawn))) wrong.add(port);
  }
  return [...wrong];
}

export function planMatches(board: BoardSize, solution: SurfaceMap, plan: SurfaceMap, context: PlanContext = {}): boolean {
  return mismatchingPorts(board, solution, plan, context).length === 0;
}
