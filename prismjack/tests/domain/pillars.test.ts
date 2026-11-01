import { describe, expect, it } from 'vitest';
import {
  ABSORBED, advanceStates, occupancy, pillarBodies, wouldTouchBySide, EMPTY_SURFACES, generatePuzzle, makePillar, maskOf, mismatchingPorts, portFor, sceneOf, SHAPES, traceLaser,
} from '../../src/domain';

const board = { width: 6, height: 6 };
const left = (row: number) => portFor(board, 'left', row);

describe('pillars', () => {
  it('a black pillar swallows the light', () => {
    const scene = sceneOf(board, [makePillar('black', 'square1', { x: 3, y: 2 })]);
    expect(traceLaser(board, EMPTY_SURFACES, left(2), scene).exit).toBe(ABSORBED);
    expect(traceLaser(board, EMPTY_SURFACES, left(3), scene).exit).toBe(portFor(board, 'right', 3));
  });

  it('a clear pillar sends the light back without colouring it', () => {
    const scene = sceneOf(board, [makePillar('clear', 'square2', { x: 2, y: 2 })]);
    const r = traceLaser(board, EMPTY_SURFACES, left(2), scene);
    expect([r.exit, r.color]).toEqual([left(2), 0]);
  });

  it('a clear losange turns the light at right angles', () => {
    const scene = sceneOf(board, [makePillar('clear', 'losange2', { x: 2, y: 2 })]);
    const r = traceLaser(board, EMPTY_SURFACES, left(2), scene);
    expect(r.exit).not.toBe(left(2));
    expect(r.color).toBe(0);
  });

  it('a prism gives its current colour, then moves on after the test', () => {
    const pillar = makePillar('prism', 'square1', { x: 3, y: 2 }, ['blue', 'red', 'yellow', 'white']);
    let scene = sceneOf(board, [pillar]);
    const first = traceLaser(board, EMPTY_SURFACES, left(2), scene);
    expect(first.color).toBe(maskOf('blue'));
    scene = { ...scene, states: advanceStates(scene, first.pillarsTouched) };
    expect(traceLaser(board, EMPTY_SURFACES, left(2), scene).color).toBe(maskOf('red'));
    // A test that never touches it does not move it on.
    expect(advanceStates(scene, [])).toEqual([1]);
  });

  it('checking a plan replays the tests in order (prism colours depend on it)', () => {
    const pillars = [makePillar('prism', 'square1', { x: 3, y: 2 })];
    const history = [left(2), left(2)];
    expect(mismatchingPorts(board, EMPTY_SURFACES, EMPTY_SURFACES, { pillars, history })).toEqual([]);
  });

  it('jewels never overlap a pillar nor share a side with it', () => {
    const pillars = [makePillar('black', 'square2', { x: 2, y: 2 })];
    for (let seed = 1; seed < 30; seed++) {
      let s = seed;
      const random = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      const puzzle = generatePuzzle(board, [{ shape: SHAPES.legTriangle, color: 'red' }], random, pillars);
      // No shared cell and no common side with the pillar (a common corner is fine), as between two jewels.
      const blocks = occupancy(pillarBodies(pillars, 99));
      const cells = puzzle.jewels[0]?.cells ?? [];
      expect(cells.some((c) => wouldTouchBySide(blocks, board, c))).toBe(false);
    }
  });
});

describe('drawing around pillars', () => {
  it('nothing can be drawn inside a pillar, but its sides can be outlined', async () => {
    const { drawSurface, markEmpty, eraseAt, startMode } = await import('../../src/application');
    const { pillarCells: cellsOf } = await import('../../src/domain');
    // Level 6 has a black pillar.
    const state = startMode({ kind: 'level', index: 5 }, { next: () => 0 });
    const cells = cellsOf(state.puzzle.board, state.puzzle.pillars);
    const [first] = [...cells];
    const x = (first ?? 0) % state.puzzle.board.width, y = Math.floor((first ?? 0) / state.puzzle.board.width);
    expect(drawSurface(state, `d:${x},${y}`, { color: 'red', orientation: '/' }).plan.size).toBe(0);
    const inner = [...cells].find((c) => cells.has(c + state.puzzle.board.width));
    if (inner !== undefined) {
      const ix = inner % state.puzzle.board.width, iy = Math.floor(inner / state.puzzle.board.width) + 1;
      expect(drawSurface(state, `h:${ix},${iy}`, { color: 'red' }).plan.size).toBe(0);
    }
    const top = Math.min(...cells);
    const tx = top % state.puzzle.board.width, ty = Math.floor(top / state.puzzle.board.width);
    expect(drawSurface(state, `h:${tx},${ty}`, { color: 'red' }).plan.size).toBe(1);
    expect(markEmpty(state, first ?? 0, true).emptyCells.size).toBe(0);
    const drawn = drawSurface(state, 'h:0,0', { color: 'red' });
    expect(eraseAt(drawn, 'h:0,0', null).plan.size).toBe(0);
  });
});
