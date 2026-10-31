import { NO_PROGRESS, type Progress, type ProgressStore, type Settings } from '../ports/ProgressStore';
import { previousDay, type HeistMode } from './modes';

function afterWin(p: Progress, mode: HeistMode): Progress {
  if (mode.kind === 'training') return { ...p, trainingDone: Math.max(p.trainingDone, mode.level) };
  if (mode.kind !== 'daily' || p.lastDailyWon === mode.day) return p;
  const streak = p.lastDailyWon === previousDay(mode.day) ? p.dailyStreak + 1 : 1;
  return { ...p, dailyStreak: streak, lastDailyWon: mode.day };
}

const played = (p: Progress, mode: HeistMode): Progress => (mode.kind === 'daily' ? { ...p, lastDailyPlayed: mode.day } : p);

/** A won heist; `alarms` = alarm level reached (0 = perfect). */
export async function recordHeist(store: ProgressStore, alarms: number, mode: HeistMode): Promise<Progress> {
  const p = await store.load();
  const counted: Progress = { ...p, heistsWon: p.heistsWon + 1, perfectHeists: p.perfectHeists + (alarms === 0 ? 1 : 0) };
  const next = played(afterWin(counted, mode), mode);
  await store.save(next);
  return next;
}

/** The guard caught the thief: a daily heist still counts as played today. */
export async function recordCaught(store: ProgressStore, mode: HeistMode): Promise<Progress> {
  const next = played(await store.load(), mode);
  await store.save(next);
  return next;
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
