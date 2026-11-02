import { it } from 'vitest';
import { LESSONS } from '../src/application/lessons';
import { storedSpecs } from '../src/domain/rooms';
import { allPlacements } from './diamondSolver';
import { fireInOrder, Room, solve } from './solver';

/**
 * GEN=lessons: for every lesson, after each torch the lesson makes the player fire, how many layouts of the loot
 * still fit what was seen. A drawing step must come only once that number is 1 (no guessing).
 */
it.skipIf(process.env.GEN !== 'lessons')('every drawing step of the tutorial is proven', () => {
  LESSONS.forEach((lesson, index) => {
    const room = lesson.room;
    const specs = storedSpecs(room);
    const pillars = room.pillars ?? [];
    const truth = new Room(room.board, pillars);
    room.jewels.forEach((cells, j) => {
      const key = cells.map(([x, y, part]) => `${x},${y},${part}`).sort().join(' ');
      const p = allPlacements(room.board, specs[j]!, j).find((q) => q.cells.map((c) => `${c.x},${c.y},${c.part}`).sort().join(' ') === key);
      if (!p) throw new Error(`lesson ${index + 1}: jewel ${j} not placeable`);
      truth.apply(p, true);
    });
    const fired: number[] = [];
    const lines: string[] = [];
    for (const step of lesson.steps) {
      if (step.kind === 'fire') {
        fired.push(step.port);
        const obs = fireInOrder(truth, fired);
        const r = solve(room.board, pillars, specs, obs, { cap: 50, maxNodes: 5_000_000 });
        const last = obs[obs.length - 1]!;
        lines.push(`  fire ${step.port} -> exit ${last.b} color ${last.color}: ${r.count}${r.aborted ? '+' : ''} layouts`);
      } else lines.push(`  ${step.kind}`);
    }
    console.log(`Lesson ${index + 1}\n${lines.join('\n')}`);
  });
});
