import { NO_PROGRESS, type LevelResult, type Progress, type ProgressStore, type Settings } from '../ports/ProgressStore';
import { previousDay, type PrismjackMode } from './modes';

/** True when `a` beats `b`: fewer alarms, or as many alarms with fewer tests. */
export function betterResult(a: LevelResult, b: LevelResult | undefined): boolean {
  return !b || a.alarms < b.alarms || (a.alarms === b.alarms && a.tests < b.tests);
}

function withBest(p: Progress, index: number, result: LevelResult): Progress {
  const key = String(index);
  return betterResult(result, p.levelBest?.[key]) ? { ...p, levelBest: { ...p.levelBest, [key]: result } } : p;
}

function afterWin(p: Progress, mode: PrismjackMode): Progress {
  if (mode.kind === 'lesson') return p;
  if (mode.kind === 'run') {
    const next = { step: mode.step + 1, room: null, shots: [], plan: [], empties: [], wrongPlans: 0 };
    return { ...p, runBest: Math.max(p.runBest, mode.step + 1), run: next };
  }
  if (mode.kind === 'level') return p.levelsWon.includes(mode.index) ? p : { ...p, levelsWon: [...p.levelsWon, mode.index] };
  // A day already won, or an older one (after flying west), changes nothing.
  if (mode.kind !== 'daily' || (p.lastDailyWon ?? '') >= mode.day) return p;
  const streak = p.lastDailyWon === previousDay(mode.day) ? p.dailyStreak + 1 : 1;
  return { ...p, dailyStreak: streak, lastDailyWon: mode.day, dailiesWon: (p.dailiesWon ?? 0) + 1 };
}

const played = (p: Progress, mode: PrismjackMode): Progress => (mode.kind === 'daily' ? { ...p, lastDailyPlayed: mode.day } : p);

/** A won prismjack: the alarm level reached (0 = perfect) and the tests fired. A campaign level keeps its best result. */
export async function recordPrismjack(store: ProgressStore, result: LevelResult, mode: PrismjackMode): Promise<Progress> {
  const { alarms } = result;
  const p = await store.load();
  // A tutorial lesson is practice: it counts as no heist, it only remembers how far the tutorial went.
  if (mode.kind === 'lesson') {
    if ((p.lessonReached ?? 0) > mode.index) return p;
    const next = { ...p, lessonReached: mode.index + 1 };
    await store.save(next);
    return next;
  }
  const counted: Progress = { ...p, prismjacksWon: p.prismjacksWon + 1, perfectPrismjacks: p.perfectPrismjacks + (alarms === 0 ? 1 : 0) };
  const won = afterWin(counted, mode);
  const next = played(mode.kind === 'level' ? withBest(won, mode.index, result) : won, mode);
  await store.save(next);
  return next;
}

/** The guard caught the thief: a daily prismjack still counts as played today; a run ends here. */
export async function recordCaught(store: ProgressStore, mode: PrismjackMode): Promise<Progress> {
  const p = played(await store.load(), mode);
  const next = mode.kind === 'run' ? { ...p, runBest: Math.max(p.runBest, mode.step), run: null } : p;
  await store.save(next);
  return next;
}

/** Levels that can be played: every level won, plus the one after the highest won. */
export function unlockedLevels(p: Progress, count: number): number {
  const highest = p.levelsWon.length ? Math.max(...p.levelsWon) : -1;
  return Math.min(count, highest + 2);
}

export async function saveSettings(store: ProgressStore, settings: Settings): Promise<Progress> {
  const next = { ...(await store.load()), settings };
  await store.save(next);
  return next;
}

/** Back to a first launch: progress and settings (language, symbols, sound) are all forgotten. */
export async function resetProgress(store: ProgressStore): Promise<Progress> {
  const next: Progress = NO_PROGRESS;
  await store.save(next);
  return next;
}
