import { describe, expect, it } from 'vitest';
import {
  drawSurface, fireLaser, markEmpty, recordCaught, recordPrismjack, restoreRun, roomFor, saveRun, snapshotRun, startRoom,
} from '../../src/application';
import { NO_PROGRESS, type Progress, type ProgressStore } from '../../src/ports/ProgressStore';

class MemoryStore implements ProgressStore {
  constructor(public value: Progress = NO_PROGRESS) {}
  async load() { return this.value; }
  async save(p: Progress) { this.value = p; }
}

describe('a run left unfinished', () => {
  const pick = roomFor({ kind: 'run', step: 4 }, 0.37);

  it('comes back exactly as it was left: tests in order, drawing, empty cells, wrong plans', () => {
    let state = startRoom(pick);
    for (const port of [0, 5, 9]) state = fireLaser(state, port).state;
    state = drawSurface(state, 'h:1,1', { color: 'red' });
    state = markEmpty(state, 3, true);
    state = markEmpty(state, 12, true);
    state = { ...state, wrongPlans: 1 };
    const saved = JSON.parse(JSON.stringify(snapshotRun(4, pick, state))) as ReturnType<typeof snapshotRun>;
    const back = restoreRun(saved);
    expect(back?.state.shots).toEqual(state.shots);
    expect(back?.state.pillarStates).toEqual(state.pillarStates);
    expect([...(back?.state.plan ?? [])]).toEqual([...state.plan]);
    expect([...(back?.state.emptyCells ?? [])]).toEqual([...state.emptyCells]);
    expect(state.emptyCells.size).toBeGreaterThan(0);
    expect(back?.state.wrongPlans).toBe(1);
    expect(back?.pick.room).toEqual(pick.room);
  });

  it('moves on to the next room after a win, and is forgotten once lost', async () => {
    const store = new MemoryStore();
    await saveRun(store, snapshotRun(4, pick, startRoom(pick)));
    let p = await recordPrismjack(store, { alarms: 0, tests: 5 }, { kind: 'run', step: 4 });
    expect(p.run).toMatchObject({ step: 5, room: null });
    expect(p.runBest).toBe(5);
    expect(p.run && restoreRun(p.run)).toBeNull();
    p = await recordCaught(store, { kind: 'run', step: 5 });
    expect(p.run).toBeNull();
    expect(p.runBest).toBe(5);
  });
});
