import { describe, expect, it } from 'vitest';
import {
  alarms, clearPlan, testsUsed, drawSurface, fireLaser, markEmpty, startHeist, submitPlan, type HeistState,
} from '../../src/application';
import { SeededRandom } from '../../src/adapters/SeededRandom';

const fresh = (): HeistState => startHeist(new SeededRandom(3));

describe('a heist', () => {
  it('starts with five hidden jewels and nothing drawn', () => {
    const s = fresh();
    expect(s.puzzle.jewels).toHaveLength(5);
    expect(s.plan.size).toBe(0);
    expect(testsUsed(s)).toBe(0);
  });

  it('counts a laser test once, even when firing from its exit', () => {
    const first = fireLaser(fresh(), 0);
    const again = fireLaser(first.state, first.shot.exit);
    expect(first.isNew).toBe(true);
    expect(again.isNew).toBe(false);
    expect(testsUsed(again.state)).toBe(1);
  });

  it('replaces a surface of another colour and erases the same one', () => {
    let s = drawSurface(fresh(), 'h:1,1', { color: 'red' });
    s = drawSurface(s, 'h:1,1', { color: 'blue' });
    expect(s.plan.get('h:1,1')?.color).toBe('blue');
    s = drawSurface(s, 'h:1,1', { color: 'blue' });
    expect(s.plan.has('h:1,1')).toBe(false);
  });

  it('never lets a facet and an empty mark share a cell', () => {
    let s = markEmpty(fresh(), 9, true); // cell (1,1)
    s = drawSurface(s, 'd:1,1', { color: 'red', orientation: '/' });
    expect(s.emptyCells.has(9)).toBe(false);
    s = markEmpty(s, 9, true);
    expect(s.plan.has('d:1,1')).toBe(false);
  });

  it('keeps the laser results when the plan is cleared', () => {
    let s = fireLaser(fresh(), 4).state;
    s = clearPlan(drawSurface(s, 'h:0,0', { color: 'red' }));
    expect(s.plan.size).toBe(0);
    expect(s.shots).toHaveLength(1);
  });

  it('raises the alarm one level per wrong plan, without using a test', () => {
    const s = drawSurface(fresh(), 'h:0,0', { color: 'red' });
    const wrong = submitPlan(s);
    expect(wrong.kind).toBe('alarm');
    expect(testsUsed(wrong.state)).toBe(0);
    expect(alarms(wrong.state)).toBe(1);
    const right = submitPlan({ ...wrong.state, plan: wrong.state.puzzle.surfaces });
    expect(right.kind).toBe('success');
    if (right.kind === 'success') expect(right.alarms).toBe(1);
  });

  it('wins a perfect heist with no alarm', () => {
    const s = fresh();
    const right = submitPlan({ ...s, plan: s.puzzle.surfaces });
    if (right.kind === 'success') expect(right.alarms).toBe(0);
  });

  it('gets the thief caught at the third wrong plan', () => {
    let s = drawSurface(fresh(), 'h:0,0', { color: 'red' });
    const kinds = [1, 2, 3].map(() => { const r = submitPlan(s); s = r.state; return r.kind; });
    expect(kinds).toEqual(['alarm', 'alarm', 'caught']);
  });


  it('refuses to submit an empty plan', () => expect(submitPlan(fresh()).kind).toBe('empty-plan'));
});
