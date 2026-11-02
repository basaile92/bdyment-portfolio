import { EXPERT_POOL, EXTREME_POOL, HARD_POOL, INSANE_POOL, LEVEL_ROOMS, MEDIUM_POOL, NIGHTMARE_POOL, ROOM_VARIANTS, type StoredRoom } from '../domain';

/**
 * The three kinds of game:
 *  - level: the 50 campaign rooms, unlocked one by one (easy, medium, hard, extreme, nightmare: ten each);
 *  - daily: one hard room a day, the same for everybody, a single attempt;
 *  - run: rooms one after another, from medium to ever harder, until the first failure.
 */
export type PrismjackMode =
  | { readonly kind: 'level'; readonly index: number }
  | { readonly kind: 'daily'; readonly day: string }
  | { readonly kind: 'run'; readonly step: number };

export const LEVEL_COUNT = LEVEL_ROOMS.length;
export type LevelTier = 'easy' | 'medium' | 'hard' | 'extreme' | 'nightmare';

export function levelTier(index: number): LevelTier {
  const tiers: LevelTier[] = ['easy', 'medium', 'hard', 'extreme', 'nightmare'];
  return tiers[Math.min(tiers.length - 1, Math.floor(index / 10))] ?? 'easy';
}

/**
 * Endless run, room by room: 3 medium, 4 hard, 4 expert (five jewels), 4 extreme (six jewels, two tiny ones),
 * 5 with six jewels and two or three pillars, then nightmare rooms (seven jewels, three or four pillars)
 * for as long as the player lasts —
 * with an alarm that gets stricter and stricter (see runQuietRatio).
 */
const RUN_TIERS: readonly (readonly [until: number, pool: readonly StoredRoom[]])[] = [
  [3, MEDIUM_POOL], [7, HARD_POOL], [11, EXPERT_POOL], [15, EXTREME_POOL], [20, INSANE_POOL], [Infinity, NIGHTMARE_POOL],
];

export function runPool(step: number): readonly StoredRoom[] {
  const usable = RUN_TIERS.filter(([, pool]) => pool.length > 0);
  return (usable.find(([until]) => step < until) ?? usable.at(-1))?.[1] ?? HARD_POOL;
}

/** Share of the tests that stay quiet: the usual 60 %, then 2 points less per room after the 15th, down to 30 %. */
export function runQuietRatio(step: number): number {
  return Math.max(0.3, 0.6 - 0.02 * Math.max(0, step - 14));
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
