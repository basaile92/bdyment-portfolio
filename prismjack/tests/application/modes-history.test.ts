import { DAILY_FOUR, DAILY_SUNDAY, HARD_POOL } from '../../src/domain';
import { describe, expect, it } from 'vitest';
import {
  testsLimit, dailyPick, dailyWeekday, dailySeed, dayOf, drawSurface, EMPTY_HISTORY, fireLaser, LEVEL_COUNT, missingJewels, roomFor, startMode, unlockedLevels, previousDay,
  recordCaught, recordPrismjack, redo, resetProgress, untilNextDay, remember, startPrismjack, submitPlan, undo,
} from '../../src/application';
import { SeededRandom } from '../../src/adapters/SeededRandom';
import { NO_PROGRESS, type Progress, type ProgressStore } from '../../src/ports/ProgressStore';

class MemoryStore implements ProgressStore {
  constructor(public value: Progress = NO_PROGRESS) {}
  async load() { return this.value; }
  async save(p: Progress) { this.value = p; }
}

describe('undo / redo', () => {
  it('walks back and forth through the drawing', () => {
    const s0 = startPrismjack(new SeededRandom(1));
    const s1 = drawSurface(s0, 'h:1,1', { color: 'red' });
    let history = remember(EMPTY_HISTORY, s0, s1);
    const back = undo(history, s1);
    expect(back.state.plan.size).toBe(0);
    history = back.history;
    const forth = redo(history, back.state);
    expect(forth.state.plan.has('h:1,1')).toBe(true);
  });

  it('ignores actions that did not change the drawing', () => {
    const s0 = startPrismjack(new SeededRandom(1));
    expect(remember(EMPTY_HISTORY, s0, fireLaser(s0, 0).state)).toBe(EMPTY_HISTORY);
  });
});

describe('the alarm limit', () => {
  it('never gets the thief caught for testing every emitter', () => {
    let s = startPrismjack(new SeededRandom(5));
    for (let p = 0; p < 36; p++) s = fireLaser(s, p).state;
    expect(s.shots.length).toBeLessThanOrEqual(testsLimit(s));
    expect(s.status).toBe('planning');
  });

  it('remembers which emitters disagreed, until the plan changes', () => {
    const s = drawSurface(startPrismjack(new SeededRandom(5)), 'h:0,0', { color: 'red' });
    const wrong = submitPlan(s);
    expect(wrong.state.mismatches.length).toBeGreaterThan(0);
    expect(drawSurface(wrong.state, 'h:1,1', { color: 'red' }).mismatches).toEqual([]);
  });
});

describe('modes', () => {
  it('gives the same daily prismjack to everyone', () => {
    const a = startPrismjack(new SeededRandom(dailySeed('2026-10-31')));
    const b = startPrismjack(new SeededRandom(dailySeed('2026-10-31')));
    expect(a.puzzle.jewels).toEqual(b.puzzle.jewels);
    expect(dailySeed('2026-10-31')).not.toBe(dailySeed('2026-11-01'));
  });

  it('starts training with a single jewel', () => {
    const s = startMode({ kind: 'level', index: 0 }, new SeededRandom(2));
    expect(s.puzzle.jewels).toHaveLength(1);
    expect(missingJewels(s)).toBe(1);
    expect(missingJewels({ ...s, plan: s.puzzle.surfaces })).toBe(0);
  });

  it('formats days and goes back one day', () => {
    expect(dayOf(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
  });

  it('counts the time left before the next daily prismjack', () => {
    expect(untilNextDay(new Date(2026, 9, 31, 16, 48))).toEqual({ hours: 7, minutes: 12 });
    expect(untilNextDay(new Date(2026, 9, 31, 23, 59, 30))).toEqual({ hours: 0, minutes: 1 });
  });
});

describe('progress', () => {
  it('counts a daily streak on consecutive days only', async () => {
    const store = new MemoryStore();
    await recordPrismjack(store, 3, { kind: 'daily', day: '2026-10-30' });
    await recordPrismjack(store, 2, { kind: 'daily', day: '2026-10-31' });
    expect(store.value.dailyStreak).toBe(2);
    await recordPrismjack(store, 2, { kind: 'daily', day: '2026-11-02' });
    expect(store.value.dailyStreak).toBe(1);
    expect(store.value.prismjacksWon).toBe(3);
  });

  it('resets everything, settings included, as on a first launch', async () => {
    const store = new MemoryStore();
    await recordPrismjack(store, 0, { kind: 'daily', day: '2026-10-31' });
    store.value = { ...store.value, settings: { sound: false, language: 'en', symbols: true } };
    const p = await resetProgress(store);
    expect(p.prismjacksWon).toBe(0);
    expect(p.lastDailyPlayed).toBeNull();
    expect(p.settings).toEqual({ sound: true });
  });

  it('marks the daily prismjack as played, won or caught, but not a free one', async () => {
    const store = new MemoryStore();
    await recordCaught(store, { kind: 'run', step: 4 });
    expect(store.value.lastDailyPlayed).toBeNull();
    await recordCaught(store, { kind: 'daily', day: '2026-10-31' });
    expect(store.value.lastDailyPlayed).toBe('2026-10-31');
    expect(store.value.lastDailyWon).toBeNull();
  });

  it('unlocks levels one by one and remembers the best run', async () => {
    const store = new MemoryStore();
    expect(unlockedLevels(store.value, LEVEL_COUNT)).toBe(1);
    await recordPrismjack(store, 1, { kind: 'level', index: 0 });
    expect(store.value.levelsWon).toEqual([0]);
    expect(unlockedLevels(store.value, LEVEL_COUNT)).toBe(2);
    await recordCaught(store, { kind: 'run', step: 4 });
    expect(store.value.runBest).toBe(4);
    await recordCaught(store, { kind: 'run', step: 2 });
    expect(store.value.runBest).toBe(4);
  });

  it('plays the stored rooms: same daily heist for everybody, levels in order', () => {
    const a = roomFor({ kind: 'daily', day: '2026-11-02' }, 0.1);
    const b = roomFor({ kind: 'daily', day: '2026-11-02' }, 0.9);
    expect(a).toEqual(b);
    expect(startMode({ kind: 'level', index: 0 }, { next: () => 0 }).jewels).toHaveLength(1);
  });
});

describe('the daily heist calendar', () => {
  it('starts on a Monday with four jewels and ends the week with pillars', () => {
    expect(dailyWeekday('2026-11-02')).toBe(0);
    expect(dailyPick('2026-11-02').room).toBe(DAILY_FOUR[0]);
    expect(dailyPick('2026-11-08').room).toBe(DAILY_SUNDAY[0]);
    expect(dailyPick('2026-11-08').room.pillars?.length).toBeGreaterThan(0);
  });

  it('never gives the same room twice in a year, and never the run rooms', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 365; i++) {
      const d = new Date(Date.UTC(2026, 10, 2 + i));
      const day = d.toISOString().slice(0, 10);
      const pick = dailyPick(day);
      const key = `${JSON.stringify(pick.room.jewels)}#${pick.variant}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(HARD_POOL.includes(pick.room)).toBe(false);
    }
  });

  it('is the same for everybody and works before the first week too', () => {
    expect(dailyPick('2027-03-14')).toEqual(dailyPick('2027-03-14'));
    expect(() => dailyPick('2026-10-01')).not.toThrow();
  });
});

