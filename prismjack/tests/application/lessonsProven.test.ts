import { describe, expect, it } from 'vitest';
import { LESSONS } from '../../src/application';
import { storedSpecs } from '../../src/domain';
import { allPlacements } from '../../prototype/diamondSolver';
import { fireInOrder, Room, solve } from '../../prototype/solver';

/**
 * The tutorial never asks to draw a guess: when a lesson reaches its drawing step (or lets the player play
 * freely), the torches it made the player light must leave exactly one layout of the loot — or, in free play,
 * lighting every torch must.
 */
describe('the tutorial only asks to draw what the torches prove', () => {
  LESSONS.forEach((lesson, index) => {
    it(`lesson ${index + 1}`, () => {
      const { room } = lesson;
      const specs = storedSpecs(room);
      const pillars = room.pillars ?? [];
      const truth = new Room(room.board, pillars);
      room.jewels.forEach((cells, j) => {
        const key = cells.map(([x, y, part]) => `${x},${y},${part}`).sort().join(' ');
        const spec = specs[j];
        const placement = spec && allPlacements(room.board, spec, j).find((q) => q.cells.map((c) => `${c.x},${c.y},${c.part}`).sort().join(' ') === key);
        if (!placement) throw new Error('jewel not placeable');
        truth.apply(placement, true);
      });
      const fired: number[] = [];
      for (const step of lesson.steps) {
        if (step.kind === 'fire') fired.push(step.port);
        if (step.kind === 'draw') {
          expect(solve(room.board, pillars, specs, fireInOrder(truth, fired), { cap: 2 }).count).toBe(1);
          return;
        }
        if (step.kind === 'free') {
          const all = Array.from({ length: 2 * (room.board.width + room.board.height) }, (_, p) => p);
          expect(solve(room.board, pillars, specs, fireInOrder(truth, [...fired, ...all.filter((p) => !fired.includes(p))]), { cap: 2 }).count).toBe(1);
          return;
        }
      }
    });
  });
});
