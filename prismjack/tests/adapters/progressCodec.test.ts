import { describe, expect, it } from 'vitest';
import { decodeProgress, encodeProgress, sanitizeProgress } from '../../src/adapters/progressCodec';
import { StoredProgress, type TextStorage } from '../../src/adapters/StoredProgress';
import { NO_PROGRESS } from '../../src/ports/ProgressStore';

const memory = (initial: Record<string, string> = {}) => {
  const data: Record<string, string> = { ...initial };
  const storage: TextStorage = {
    read: async (k) => data[k] ?? null,
    write: async (k, t) => {
      data[k] = t;
    },
  };
  return { data, storage };
};

describe('stored progress is never trusted', () => {
  it('reads progress saved before the Prismjack rename', () => {
    const p = sanitizeProgress({ heistsWon: 7, perfectHeists: 3 });
    expect([p.prismjacksWon, p.perfectPrismjacks]).toEqual([7, 3]);
    expect(sanitizeProgress({ heistsWon: 1, prismjacksWon: 9 }).prismjacksWon).toBe(9);
  });

  it('keeps the good fields and drops the bad ones', () => {
    const p = sanitizeProgress({
      levelsWon: [0, 1, 'x'], runBest: -4, dailyStreak: 3, lastDailyWon: 'yesterday',
      settings: { sound: 'yes', language: 'xx', symbols: true },
    });
    expect(p.levelsWon).toEqual([]);
    expect(p.runBest).toBe(0);
    expect(p.dailyStreak).toBe(3);
    expect(p.lastDailyWon).toBeNull();
    expect(p.settings).toEqual({ sound: true, symbols: true });
  });

  it('forgets a run in an unknown or broken shape instead of blocking the game', () => {
    const broken = { step: 2, room: { stored: { board: 'big' }, variant: 0 }, shots: [], plan: [], empties: [], wrongPlans: 0 };
    expect(sanitizeProgress({ run: broken }).run).toBeNull();
    const between = { step: 3, room: null, shots: [], plan: [], empties: [], wrongPlans: 0 };
    expect(sanitizeProgress({ run: between }).run).toEqual(between);
  });

  it('round-trips with a schema version', () => {
    const p = { ...NO_PROGRESS, levelsWon: [0, 1], runBest: 4 };
    expect(JSON.parse(encodeProgress(p)).schemaVersion).toBe(2);
    expect(decodeProgress(encodeProgress(p))).toEqual({ ...p, run: null, lessonReached: 0 });
    expect(decodeProgress('{not json')).toBeNull();
    expect(decodeProgress(null)).toBe(NO_PROGRESS);
  });

  it('keeps unreadable text aside and starts fresh', async () => {
    const { data, storage } = memory({ 'le-casse/progress': '{oops' });
    expect(await new StoredProgress(storage).load()).toEqual(NO_PROGRESS);
    expect(data['le-casse/progress/unreadable']).toBe('{oops');
  });

  it('writes in order and serves the latest progress from memory', async () => {
    const { data, storage } = memory();
    const slow: TextStorage = {
      read: storage.read,
      write: (k, t) => new Promise((resolve) => setTimeout(() => void storage.write(k, t).then(resolve), t.includes('"runBest":1') ? 30 : 0)),
    };
    const store = new StoredProgress(slow);
    void store.save({ ...NO_PROGRESS, runBest: 1 });
    await store.save({ ...NO_PROGRESS, runBest: 2 });
    expect((await store.load()).runBest).toBe(2);
    expect(JSON.parse(data['le-casse/progress'] ?? '{}').runBest).toBe(2);
  });

  it('a failing storage never stops the game', async () => {
    const broken: TextStorage = {
      read: async () => {
        throw new Error('denied');
      },
      write: async () => {
        throw new Error('full');
      },
    };
    const store = new StoredProgress(broken);
    expect(await store.load()).toEqual(NO_PROGRESS);
    await expect(store.save({ ...NO_PROGRESS, runBest: 5 })).resolves.toBeUndefined();
    expect((await store.load()).runBest).toBe(5);
  });
});
