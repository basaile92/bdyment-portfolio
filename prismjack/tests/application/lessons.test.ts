import { describe, expect, it } from 'vitest';
import { fireLaser, LESSONS, recordPrismjack, startRoom } from '../../src/application';
import { NO_PROGRESS, type Progress, type ProgressStore } from '../../src/ports/ProgressStore';
import { ABSORBED, colorsIn, portSide } from '../../src/domain';
import { stringsFor, LANGUAGES } from '../../src/ui/i18n/strings';

/** The tutorial's texts describe what each scripted torch does: the rooms must really do it. */
const shot = (lesson: number, ports: number[]) => {
  const l = LESSONS[lesson];
  if (!l) throw new Error('no lesson');
  let state = startRoom({ room: l.room, variant: 0 });
  for (const p of ports) state = fireLaser(state, p).state;
  const last = state.shots.at(-1);
  if (!last) throw new Error('no shot');
  return { ...last, colors: colorsIn(last.color), exitSide: portSide(l.room.board, last.exit).side };
};

describe('the playable tutorial', () => {
  it('lesson 1: an empty row, then a red straight wall met twice', () => {
    expect(shot(0, [15])).toMatchObject({ exit: 5, colors: [] });
    expect(shot(0, [15, 16])).toMatchObject({ exit: 16, colors: ['red'] });
    expect(shot(0, [15, 16, 2])).toMatchObject({ exit: 2, colors: ['red'] });
    // Column 1 crosses straight: the square starts at column 2.
    expect(shot(0, [15, 16, 2, 1])).toMatchObject({ exit: 11, colors: [] });
  });

  it('lesson 2: the light turns on the facets, out at the top then at the bottom', () => {
    expect(shot(1, [17])).toMatchObject({ exitSide: 'top', colors: ['yellow'] });
    expect(shot(1, [17, 18])).toMatchObject({ exitSide: 'bottom', colors: ['yellow'] });
  });

  it('lesson 3: a blue ↩, then one light picks up yellow and blue', () => {
    expect(shot(2, [4])).toMatchObject({ exit: 4, colors: ['blue'] });
    expect(shot(2, [4, 2]).colors.sort()).toEqual(['blue', 'yellow']);
    // From the left on row 1, the light turns up on the diamond: it comes out at the top of column 1.
    expect(shot(2, [4, 2, 18])).toMatchObject({ exit: 1, colors: ['yellow'] });
  });

  it('lesson 4: black swallows, clear turns without colour, the prism gives red then blue', () => {
    expect(shot(3, [22])).toMatchObject({ exit: ABSORBED });
    expect(shot(3, [22, 16])).toMatchObject({ exitSide: 'right', colors: [] });
    expect(shot(3, [22, 16, 19])).toMatchObject({ exit: 19, colors: ['red'] });
    expect(shot(3, [22, 16, 19, 1])).toMatchObject({ exit: 1, colors: ['blue'] });
  });

  it('has one line per step in every language', () => {
    for (const { id } of LANGUAGES) {
      expect(stringsFor(id).lessons.map((l) => l.length)).toEqual(LESSONS.map((l) => l.steps.length));
    }
  });

  it('a won lesson counts as no heist, it only remembers how far the tutorial went', async () => {
    let saved: Progress = NO_PROGRESS;
    const store: ProgressStore = { load: async () => saved, save: async (p) => void (saved = p) };
    await recordPrismjack(store, 0, { kind: 'lesson', index: 1 });
    expect(saved.prismjacksWon).toBe(0);
    expect(saved.lessonReached).toBe(2);
    await recordPrismjack(store, 0, { kind: 'lesson', index: 0 });
    expect(saved.lessonReached).toBe(2);
  });
});
