import { ROOM_VARIANTS, SHAPES } from '../domain';
import { NO_PROGRESS, type Language, type LevelResult, type Progress, type SavedRun, type Settings } from '../ports/ProgressStore';

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
const SHAPE_IDS: readonly string[] = Object.keys(SHAPES);
const PILLAR_KINDS = ['black', 'clear', 'prism'];
const PILLAR_SHAPES = ['square1', 'square2', 'losange2'];
const SURFACE_KEY = /^[hvd]:\d{1,2},\d{1,2}$/;

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

/** A stored room cell [x, y, part], inside a board of that size. */
const isCellIn = (width: number, height: number) => (c: unknown): boolean =>
  Array.isArray(c) && c.length === 3 && (count(c[0]) ?? width) < width && (count(c[1]) ?? height) < height && PARTS.includes(c[2] as string);

const isSpec = (s: unknown): boolean => Array.isArray(s) && SHAPE_IDS.includes(s[0] as string) && COLORS.includes(s[1] as string);

function isPillar(p: unknown, inside: (c: unknown) => boolean): boolean {
  if (!isObject(p) || !PILLAR_KINDS.includes(p.kind as string) || !PILLAR_SHAPES.includes(p.shape as string) || !Array.isArray(p.cells)) return false;
  const cellsOk = p.cells.every((c) => isObject(c) && inside([c.x, c.y, c.part]));
  return cellsOk && (p.order === undefined || (Array.isArray(p.order) && p.order.every((o) => COLORS.includes(o as string))));
}

/** A room as stored in a saved run: known shapes and pillars, every cell on the board. */
const boardOf = (v: Raw): { width: number; height: number } | null => {
  const width = isObject(v.board) ? count(v.board.width, 30) : null, height = isObject(v.board) ? count(v.board.height, 30) : null;
  return width && height ? { width, height } : null;
};

const sameLength = (a: unknown, b: unknown): a is unknown[] => Array.isArray(a) && Array.isArray(b) && a.length === b.length;

function isStoredRoom(v: unknown): boolean {
  const board = isObject(v) ? boardOf(v) : null;
  if (!isObject(v) || !board || !sameLength(v.specs, v.jewels)) return false;
  const inside = isCellIn(board.width, board.height);
  const jewelsOk = (v.jewels as unknown[]).every((j) => Array.isArray(j) && j.length > 0 && j.every(inside));
  const pillarsOk = v.pillars === undefined || (Array.isArray(v.pillars) && v.pillars.every((p) => isPillar(p, inside)));
  return (v.specs as unknown[]).every(isSpec) && jewelsOk && pillarsOk;
}

const isPlanEntry = (e: unknown): boolean =>
  Array.isArray(e) && typeof e[0] === 'string' && SURFACE_KEY.test(e[0]) && COLORS.includes(e[1] as string) && (e[2] === undefined || e[2] === '/' || e[2] === '\\');

const isRoomRef = (v: unknown): boolean => isObject(v) && isStoredRoom(v.stored) && (count(v.variant) ?? ROOM_VARIANTS) < ROOM_VARIANTS;

/** A run in progress, or null when anything in it is off (the run is then simply started anew). */
function runOf(v: unknown): SavedRun | null {
  if (!isObject(v)) return null;
  const numbersOk = count(v.step, 10_000) !== null && count(v.wrongPlans, 3) !== null && counts(v.shots, 200) && counts(v.empties, 400);
  const roomOk = v.room === null || isRoomRef(v.room);
  const planOk = Array.isArray(v.plan) && v.plan.every(isPlanEntry);
  return numbersOk && roomOk && planOk ? (v as unknown as SavedRun) : null;
}

/** Best results per level: only well-formed entries are kept. */
function bestOf(v: unknown): Record<string, LevelResult> {
  if (!isObject(v)) return {};
  const ok = Object.entries(v).filter(([k, r]) => count(Number(k), 999) !== null && isObject(r) && count(r.alarms, 2) !== null && count(r.tests, 500) !== null);
  return Object.fromEntries(ok.map(([k, r]) => [k, { alarms: (r as Raw).alarms as number, tests: (r as Raw).tests as number }]));
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
    levelBest: bestOf(v.levelBest),
    runBest: n('runBest', undefined, 10_000),
    dailyStreak: n('dailyStreak', undefined, 100_000),
    dailiesWon: n('dailiesWon', undefined, 100_000),
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
