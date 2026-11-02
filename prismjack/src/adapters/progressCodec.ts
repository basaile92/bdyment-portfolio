import { NO_PROGRESS, type Language, type Progress, type SavedRun, type Settings } from '../ports/ProgressStore';

/**
 * How progress is written to storage, and read back without ever trusting it.
 *
 * Stored data outlives versions of the game and can be damaged (interrupted write, manual edit,
 * an older format). Every field is checked on its own: a bad field falls back to its default,
 * the rest is kept. Nothing read from storage can make the game crash or lock the player out.
 */

/** Bump when the stored shape changes; `decodeProgress` must keep reading every older version. */
export const PROGRESS_SCHEMA = 2;

const LANGUAGES: readonly Language[] = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ja', 'ko', 'zh'];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const COLORS = ['red', 'blue', 'yellow', 'white'];
const PARTS = ['full', 'NE', 'NW', 'SE', 'SW'];

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const count = (v: unknown, max = 1e6): number | null => (Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max ? (v as number) : null);
const day = (v: unknown): string | null => (typeof v === 'string' && DAY.test(v) ? v : null);
const counts = (v: unknown, max: number): number[] | null => (Array.isArray(v) && v.every((n) => count(n, max) !== null) ? (v as number[]) : null);

function settingsOf(v: unknown): Settings {
  const s = isObject(v) ? v : {};
  const language = LANGUAGES.find((l) => l === s.language);
  return {
    sound: typeof s.sound === 'boolean' ? s.sound : NO_PROGRESS.settings.sound,
    ...(language ? { language } : {}),
    ...(typeof s.symbols === 'boolean' ? { symbols: s.symbols } : {}),
    ...(typeof s.haptics === 'boolean' ? { haptics: s.haptics } : {}),
  };
}

/** A stored room cell: [x, y, part]. */
const isCell = (c: unknown): boolean =>
  Array.isArray(c) && c.length === 3 && count(c[0], 30) !== null && count(c[1], 30) !== null && PARTS.includes(c[2] as string);

function isStoredRoom(v: unknown): boolean {
  if (!isObject(v) || !isObject(v.board)) return false;
  const { width, height } = v.board;
  if (count(width, 30) === null || count(height, 30) === null) return false;
  if (!Array.isArray(v.specs) || !Array.isArray(v.jewels) || v.specs.length !== v.jewels.length) return false;
  const specsOk = v.specs.every((s) => Array.isArray(s) && typeof s[0] === 'string' && COLORS.includes(s[1] as string));
  const jewelsOk = v.jewels.every((j) => Array.isArray(j) && j.length > 0 && j.every(isCell));
  return specsOk && jewelsOk && (v.pillars === undefined || Array.isArray(v.pillars));
}

/** A run in progress, or null when anything in it is off (the run is then simply started anew). */
function runOf(v: unknown): SavedRun | null {
  if (!isObject(v)) return null;
  const step = count(v.step, 10_000);
  const wrongPlans = count(v.wrongPlans, 3);
  const shots = counts(v.shots, 200);
  const empties = counts(v.empties, 400);
  const planOk = Array.isArray(v.plan) && v.plan.every((e) => Array.isArray(e) && typeof e[0] === 'string' && COLORS.includes(e[1] as string)
    && (e[2] === undefined || e[2] === '/' || e[2] === '\\'));
  const room = v.room === null ? null : isObject(v.room) && isStoredRoom(v.room.stored) && count(v.room.variant, 7) !== null ? v.room : undefined;
  if (step === null || wrongPlans === null || !shots || !empties || !planOk || room === undefined) return null;
  return v as unknown as SavedRun;
}

/** Any parsed value → a valid Progress. Older field names (before the Prismjack rename) are understood. */
export function sanitizeProgress(v: unknown): Progress {
  if (!isObject(v)) return NO_PROGRESS;
  const n = (key: string, legacy?: string, max?: number) => count(v[key], max) ?? (legacy ? count(v[legacy], max) : null) ?? 0;
  const levelsWon = counts(v.levelsWon, 999);
  return {
    prismjacksWon: n('prismjacksWon', 'heistsWon'),
    perfectPrismjacks: n('perfectPrismjacks', 'perfectHeists'),
    levelsWon: levelsWon ? [...new Set(levelsWon)] : [],
    runBest: n('runBest', undefined, 10_000),
    dailyStreak: n('dailyStreak', undefined, 100_000),
    lastDailyWon: day(v.lastDailyWon),
    lastDailyPlayed: day(v.lastDailyPlayed),
    lessonReached: count(v.lessonReached, 20) ?? 0,
    run: runOf(v.run),
    settings: settingsOf(v.settings),
  };
}

/** Stored text → Progress; null when the text is not even JSON (the caller keeps a copy of it). */
export function decodeProgress(text: string | null | undefined): Progress | null {
  if (!text) return NO_PROGRESS;
  try {
    return sanitizeProgress(JSON.parse(text));
  } catch {
    return null;
  }
}

export function encodeProgress(progress: Progress): string {
  return JSON.stringify({ schemaVersion: PROGRESS_SCHEMA, ...progress });
}
