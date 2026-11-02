import type { Surface, SurfaceKey } from '../domain';
import type { Progress, ProgressStore, SavedRun } from '../ports/ProgressStore';
import { fireLaser } from './fireLaser';
import { runQuietRatio, type RoomPick } from './modes';
import type { PrismjackState } from './PrismjackState';
import { startRoom } from './startPrismjack';

export type { SavedRun };

export function snapshotRun(step: number, pick: RoomPick, state: PrismjackState): SavedRun {
  return {
    step,
    room: { stored: pick.room, variant: pick.variant },
    shots: state.shots.map((s) => s.entry),
    plan: [...state.plan].map(([key, s]) => (s.orientation ? [key, s.color, s.orientation] : [key, s.color])),
    empties: [...state.emptyCells],
    wrongPlans: state.wrongPlans,
  };
}

/** The room as it was left: same tests in the same order (prisms included), same drawing. */
export function restoreRun(saved: SavedRun): { pick: RoomPick; state: PrismjackState } | null {
  if (!saved.room) return null;
  const pick: RoomPick = { room: saved.room.stored, variant: saved.room.variant };
  let state = startRoom(pick, runQuietRatio(saved.step));
  for (const port of saved.shots) state = fireLaser(state, port).state;
  const plan = new Map<SurfaceKey, Surface>(saved.plan.map(([key, color, orientation]) => [key, orientation ? { color, orientation } : { color }]));
  return { pick, state: { ...state, plan, emptyCells: new Set(saved.empties), wrongPlans: saved.wrongPlans } };
}

export async function saveRun(store: ProgressStore, run: SavedRun | null): Promise<Progress> {
  const p = await store.load();
  const next: Progress = { ...p, run };
  await store.save(next);
  return next;
}
