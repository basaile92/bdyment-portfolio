import { EXPERT_POOL, HARD_POOL, LEVEL_ROOMS, MEDIUM_POOL, ROOM_VARIANTS, type StoredRoom } from '../domain';

/**
 * The three kinds of game:
 *  - level: the 30 campaign rooms, unlocked one by one (1-10 easy, 11-20 medium, 21-30 hard);
 *  - daily: one hard room a day, the same for everybody, a single attempt;
 *  - run: rooms one after another, from medium to ever harder, until the first failure.
 */
export type PrismjackMode =
  | { readonly kind: 'level'; readonly index: number }
  | { readonly kind: 'daily'; readonly day: string }
  | { readonly kind: 'run'; readonly step: number };

export const LEVEL_COUNT = LEVEL_ROOMS.length;
export type LevelTier = 'easy' | 'medium' | 'hard';

export function levelTier(index: number): LevelTier {
  return index < 10 ? 'easy' : index < 20 ? 'medium' : 'hard';
}

/** Endless run: 3 medium rooms, 4 hard ones, then expert rooms for as long as the player lasts. */
export function runPool(step: number): readonly StoredRoom[] {
  if (step < 3 && MEDIUM_POOL.length) return MEDIUM_POOL;
  if (step < 7 && HARD_POOL.length) return HARD_POOL;
  return EXPERT_POOL.length ? EXPERT_POOL : HARD_POOL;
}

/** A room and its mirror variant. */
export interface RoomPick {
  readonly room: StoredRoom;
  readonly variant: number;
}

function pickIn(pool: readonly StoredRoom[], n: number): RoomPick {
  const total = pool.length * ROOM_VARIANTS;
  const i = ((n % total) + total) % total;
  const room = pool[Math.floor(i / ROOM_VARIANTS)];
  if (!room) throw new Error('Empty room pool.');
  return { room, variant: i % ROOM_VARIANTS };
}

/** Which room a mode plays. `random` in [0, 1) is only used by the run. */
export function roomFor(mode: PrismjackMode, random: number): RoomPick {
  if (mode.kind === 'level') {
    const room = LEVEL_ROOMS[mode.index] ?? LEVEL_ROOMS[0];
    if (!room) throw new Error('No campaign level.');
    return { room, variant: 0 };
  }
  if (mode.kind === 'daily') return pickIn(HARD_POOL, dailySeed(mode.day));
  const pool = runPool(mode.step);
  return pickIn(pool, Math.floor(random * pool.length * ROOM_VARIANTS));
}

/** Local calendar day, "YYYY-MM-DD". */
export function dayOf(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Time left before the next daily prismjack (local midnight), in whole hours and minutes. */
export function untilNextDay(date: Date): { readonly hours: number; readonly minutes: number } {
  const midnight = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const minutes = Math.max(0, Math.ceil((midnight.getTime() - date.getTime()) / 60000));
  return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
}

/** Same seed for everybody on the same day: everyone plays the same daily prismjack. */
export function dailySeed(day: string): number {
  let h = 2166136261;
  for (const ch of `le-casse/${day}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function previousDay(day: string): string {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return dayOf(d);
}
